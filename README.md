# Unified Campus Intelligence System

An enterprise-grade, full-stack campus operations platform powered by **Gemini 2.5 Flash** and the **Model Context Protocol (MCP)**. This system serves as a central orchestrator connecting a Next.js frontend dashboard with multiple decentralized FastAPI MCP resource nodes (Library, Cafeteria, Events, and Academics with RAG support).

# Screen recording link on drive: 
https://drive.google.com/file/d/1zVHCiMYeAcjdDxQJxNN_NfmgvLdR9cYC/view?usp=sharing

---

## Architecture Overview

The monorepo workspace is organized as follows:

```
Folder for project/
├── package.json                   # Monorepo workspaces configuration
├── TSConfig.json                  # Root TypeScript configurations
├── turbo.json                     # Turborepo task pipeline management
├── start-all.js                   # Unified operations startup script
│
├── apps/
│   ├── dashboard/                 # Next.js 15 App Router Frontend (Port 3000)
│   │   ├── src/app/               # Pages: Overview, Assistant, Monitor, Analytics, Settings, Admin
│   │   └── src/components/        # Reusable UI widgets & React ErrorBoundary
│   │
│   └── ai-orchestrator/           # Node.js + Express microservice broker (Port 3010)
│       └── src/
│           ├── index.ts           # Telemetry, Rate Limits, JWT Auth, Swagger Specs & Routing
│           └── services/          # MCP SSE transports & Gemini API tool calls manager
│
└── packages/                      # FastAPI Python MCP Servers
    ├── mcp-server-library/        # Library search and book checkouts (Port 8001)
    ├── mcp-server-cafeteria/      # Cafeteria today/weekly menu query tools (Port 8002)
    ├── mcp-server-events/         # Upcoming and search events tools (Port 8003)
    └── mcp-server-academics/      # Academics registry & SQLite RAG vector store (Port 8004)
```

---

## Key Features

### 1. ChatGPT-Style Chat Interface
* **SSE Stream Processing**: Streams generated tokens to the UI in real-time.
* **Auto-Scrolling & Typing Indicators**: Premium chatting ergonomics.
* **Markdown Rendering**: High-fidelity code block highlights with syntax copy buttons.
* **Independent Session History**: Persistent chat threads saved to `localStorage`.

### 2. Live MCP Execution Tracing
* **Real-time Pipeline Timeline**: A beautiful timeline visualizer showing:
  * Active tool name and execution status (pulsing for running, checkmark for success, cross for failure).
  * Latency metrics (in milliseconds) and data payload summaries.
  * Collapsible JSON detail viewers for request parameters.

### 3. Analytics Telemetry Dashboard
* **Recharts Dashboards**: Dynamic widgets representing:
  * Cumulative query volume trends.
  * Model-context-protocol invocation success/failure rates.
  * Multi-source node latency distributions.
  * Resource request breakdown charts.
  * Live cluster node health monitors.

### 4. JWT RBAC Authentication & Admin Console
* **Role Guards**: Separates **Student** (queries, chat history, settings) and **Admin** operations.
* **Admin Console**: Full database CRUD actions (add/delete books, menu specials, scheduling events) and RAG indexing.

### 5. Academics Vector Store RAG Pipeline
* **FastAPI Indexer**: Extract PDF text, split into chunks, generate embeddings (Gemini API or local TF-IDF math models), and save to a SQLite-backed database (`handbook_vectors.db`).
* **Source Citations**: Returns exact handbook paragraphs and file sources with semantic AI responses.

### 6. Production Handoff & Security Hardening
* **Helmet Security Headers**: Strict Content Security Policy (CSP), clickjacking, and HSTS setups.
* **Route Rate Limiting**: Global rate-limits (100req/15m) and auth protections (10req/15m) to prevent DoS attacks.
* **Input Validation**: **Zod** schema request body validations.
* **Structured Logs**: **Winston** JSON streams for production and **Morgan** HTTP traffic logging.
* **Interactive APIs**: Full OpenAPI specifications served via Swagger UI under `/api-docs`.

---

## Setup & Installation

### Prerequisites
* Node.js v18+ & npm v10+
* Python 3.10+ & `pip`
* Gemini API Key (configured in environment)

### Environment Variables
Copy and configure the environment files in the project applications:

**`apps/ai-orchestrator/.env`**
```env
PORT=3010
NODE_ENV=development
JWT_SECRET=campus-intelligence-secret-key-2026
ALLOWED_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

### Launching the Complete Platform
To boot the Next.js dashboard, the Express broker, and all 4 FastAPI Python MCP servers concurrently, run:

```bash
# Install root monorepo dependencies
npm install

# Start all systems concurrently
npm run start:all
```

Alternatively, run services in separate terminals:

```bash
# Terminal 1: Library MCP (Port 8001)
cd packages/mcp-server-library && pip install -r requirements.txt && uvicorn main:app --port 8001

# Terminal 2: Cafeteria MCP (Port 8002)
cd packages/mcp-server-cafeteria && pip install -r requirements.txt && uvicorn main:app --port 8002

# Terminal 3: Events MCP (Port 8003)
cd packages/mcp-server-events && pip install -r requirements.txt && uvicorn main:app --port 8003

# Terminal 4: Academics MCP (Port 8004)
cd packages/mcp-server-academics && pip install -r requirements.txt && uvicorn main:app --port 8004

# Terminal 5: AI Orchestrator Backend (Port 3010)
cd apps/ai-orchestrator && npm run dev

# Terminal 6: Next.js Frontend Dashboard (Port 3000)
cd apps/dashboard && npm run dev
```

---

## Verification & Telemetry

* **Next.js Dashboard**: Access at `http://localhost:3000`
* **Express Microservice API**: Access at `http://localhost:3010`
* **Swagger API Specs Docs**: Access at `http://localhost:3010/api-docs`
* **Server Health Status**: Query `GET http://localhost:3010/health`

---

## Deployment Guidelines

### 1. Next.js Dashboard Frontend
Deploy to **Vercel** or host on a Node.js server using PM2:
```bash
npm run build -w dashboard
npm run start -w dashboard
```

### 2. Express Orchestrator Backend
Host on a Virtual Private Server (VPS) behind a reverse proxy (Nginx) with an SSL certificate. Run with PM2 to manage lifecycle:
```bash
npm run build -w ai-orchestrator
pm2 start dist/index.js --name "ai-orchestrator"
```

### 3. Python MCP Services
Deploy FastAPI applications behind Nginx (with Gunicorn/Uvicorn workers) or run them in containerized Docker environments. Expose ports `8001` through `8004` internally to the AI Orchestrator network boundary.
