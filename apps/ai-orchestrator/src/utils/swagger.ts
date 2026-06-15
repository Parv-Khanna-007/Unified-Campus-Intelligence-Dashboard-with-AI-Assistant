import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Campus Intelligence System - AI Orchestrator API',
      version: '1.0.0',
      description: 'Enterprise production-ready API specifications for the Campus Operations AI Orchestrator. Includes user auth, multi-source AI orchestration, analytics data, and admin console proxy routes.',
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT authorization token (e.g., Bearer <token>)',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Detailed explanation of the error',
            },
          },
        },
      },
    },
  },
  // Document endpoints in index.ts and utility files
  apis: ['./src/index.ts', './apps/ai-orchestrator/src/index.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
export { swaggerSpec };
