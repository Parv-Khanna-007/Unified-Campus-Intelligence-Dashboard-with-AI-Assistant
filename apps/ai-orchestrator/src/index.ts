declare const process: any;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { MCPService } from './services/mcp-service';
import { AIService } from './services/ai-service';
import { logger, morganMiddleware } from './utils/logger';
import { setupSwagger } from './utils/swagger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "https://api.google.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
}));

app.use(express.json());

// Winston + Morgan HTTP Traffic Logging
app.use(morganMiddleware);

// Rate Limiting
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again after 15 minutes.' },
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
});

// Configure MCP servers URLs
const mcpServersConfig = [
  { name: 'library', url: process.env.LIBRARY_MCP_URL || 'http://localhost:8001/mcp/sse' },
  { name: 'cafeteria', url: process.env.CAFETERIA_MCP_URL || 'http://localhost:8002/mcp/sse' },
  { name: 'events', url: process.env.EVENTS_MCP_URL || 'http://localhost:8003/mcp/sse' },
  { name: 'academics', url: process.env.ACADEMICS_MCP_URL || 'http://localhost:8004/mcp/sse' },
];

// Instantiate services
const mcpService = new MCPService(mcpServersConfig);
const aiService = new AIService(mcpService);

// Initialize MCP Connections
mcpService.connectAll();

const JWT_SECRET = process.env.JWT_SECRET || 'campus-intelligence-secret-key-2026';

// Extend express Request interface locally
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    role: 'student' | 'admin';
  };
}

// Authentication middleware
const authenticateJWT = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { username: string; role: 'student' | 'admin' };
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token.' });
  }
};

// Role authorization middleware
const requireRole = (role: 'student' | 'admin') => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

// Zod Input Schemas
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().trim().min(1, 'Password is required'),
});

const orchestrateSchema = z.object({
  message: z.string().trim().min(1, 'Message is required'),
  stream: z.boolean().optional(),
});

// Setup Swagger Documentation UI
setupSwagger(app);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Retrieve health status of AI Orchestrator
 *     description: Returns current operational state, registration counts of MCP servers, and dependency health.
 *     responses:
 *       200:
 *         description: Healthy system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                 aiEngineAvailable:
 *                   type: boolean
 *                 mcpToolsRegistered:
 *                   type: number
 */
app.get('/health', (req, res) => {
  const tools = mcpService.getAllTools();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiEngineAvailable: !!process.env.GEMINI_API_KEY,
    mcpToolsRegistered: tools.length,
    toolsList: tools.map(t => ({ name: t.name, server: t.serverName })),
  });
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and issue JWT
 *     description: Validates login credentials and returns a Bearer JWT token alongside basic user profile data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: student
 *               password:
 *                 type: string
 *                 example: student
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation or missing input parameters error
 *       401:
 *         description: Authentication failed
 */
app.post('/api/auth/login', loginRateLimiter, (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { username, password } = validation.data;
  const userLower = username.toLowerCase();
  const passLower = password.toLowerCase();

  let role: 'student' | 'admin' | null = null;
  let fullName = '';

  if (userLower === 'admin' && passLower === 'admin') {
    role = 'admin';
    fullName = 'Administrator • IT Center';
  } else if (userLower === 'student' && passLower === 'student') {
    role = 'student';
    fullName = 'Alex Johnson • Student';
  }

  if (!role) {
    logger.warn(`Failed login attempt for user: ${username}`);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username: userLower, role }, JWT_SECRET, { expiresIn: '24h' });

  logger.info(`Successful login for user: ${username} with role: ${role}`);

  return res.json({
    token,
    user: {
      username: userLower,
      name: fullName,
      role
    }
  });
});

/**
 * @openapi
 * /api/orchestrate:
 *   post:
 *     summary: Route query to AI Orchestration engine
 *     description: Feeds the query into the LLM, resolves necessary MCP tools, aggregates data, and provides synthesized answers. Supports Server-Sent Events (SSE) streaming.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: What is CS101 syllabus and library books?
 *               stream:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Unified response synthesized by AI Orchestration
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token missing or invalid
 */
app.post('/api/orchestrate', globalRateLimiter, authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  const validation = orchestrateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { message, stream = false } = validation.data;

  logger.info(`Orchestration query from ${req.user?.username}: "${message}" [Stream: ${stream}]`);

  // SSE Stream Mode
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const result = await aiService.orchestrateChat(
        message,
        (chunkText) => {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        },
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({
        done: true,
        text: result.text,
        calls: result.calls,
        tokens: result.tokens,
      })}\n\n`);
      res.end();
    } catch (error: any) {
      logger.error(`Streaming response error: ${error.message}`);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-Stream Mode
    try {
      const result = await aiService.orchestrateChat(message);
      res.json({
        sender: 'ai',
        text: result.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calls: result.calls,
        tokens: result.tokens,
      });
    } catch (error: any) {
      next(error);
    }
  }
});

// Admin Proxy Write Endpoints with JWT Authenticated Role Guard

/**
 * @openapi
 * /api/admin/books:
 *   post:
 *     summary: Proxy endpoint to add a book to the Library catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Book added successfully
 *       403:
 *         description: Admin authorization required
 */
app.post('/api/admin/books', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.LIBRARY_SERVICE_URL || 'http://localhost:8001'}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    next(new Error(`Library server unreachable: ${error.message}`));
  }
});

/**
 * @openapi
 * /api/admin/books/{isbn}:
 *   delete:
 *     summary: Proxy endpoint to delete a book from the Library catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: isbn
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       430:
 *         description: Admin authorization required
 */
app.delete('/api/admin/books/:isbn', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.LIBRARY_SERVICE_URL || 'http://localhost:8001'}/books/${req.params.isbn}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    next(new Error(`Library server unreachable: ${error.message}`));
  }
});

/**
 * @openapi
 * /api/admin/menu:
 *   post:
 *     summary: Proxy endpoint to update the Cafeteria menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 */
app.post('/api/admin/menu', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.CAFETERIA_SERVICE_URL || 'http://localhost:8002'}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    next(new Error(`Cafeteria server unreachable: ${error.message}`));
  }
});

/**
 * @openapi
 * /api/admin/events:
 *   post:
 *     summary: Proxy endpoint to create a campus Event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Event created successfully
 */
app.post('/api/admin/events', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.EVENTS_SERVICE_URL || 'http://localhost:8003'}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    next(new Error(`Events server unreachable: ${error.message}`));
  }
});

/**
 * @openapi
 * /api/admin/events/{id}:
 *   delete:
 *     summary: Proxy endpoint to delete a campus Event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */
app.delete('/api/admin/events/:id', authenticateJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.EVENTS_SERVICE_URL || 'http://localhost:8003'}/events/${req.params.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    next(new Error(`Events server unreachable: ${error.message}`));
  }
});

// Centralized Production-Grade Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`[Global Error Handler] Caught Exception: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: err.message || 'An unexpected server error occurred.' });
});

// Start listener
app.listen(port, () => {
  logger.info(`[Orchestrator] AI Orchestrator started and listening on http://localhost:${port}`);
  logger.info(`[Orchestrator] OpenAPI Interactive documentation is available at http://localhost:${port}/api-docs`);
});
