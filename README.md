# Unified Campus Intelligence System

## Author

Parv Khanna 23112070


An enterprise-grade, full-stack campus operations platform powered by **Gemini 2.5 Flash** and the **Model Context Protocol (MCP)**. This system serves as a central orchestrator connecting a Next.js frontend dashboard with multiple decentralized FastAPI MCP resource nodes (Library, Cafeteria, Events, and Academics with RAG support).

---

## Hosted url: https://unified-campus-intelligence-dashboa-omega.vercel.app

Admin username : admin

Admin password : admin

Student username : student

Student password : student


## Screen recording link on drive: 
https://drive.google.com/file/d/1NqkVFiUimpV6CbBJwErZT-pUIoNoX0kr/view?usp=share_link

## Live Deployment

Frontend Dashboard (Vercel): https://unified-campus-intelligence-dashboa-omega.vercel.app

Backend Orchestrator (Render): https://ai-orchestrator-a2yg.onrender.com

API Health Endpoint: https://ai-orchestrator-a2yg.onrender.com/health

## Deployed Services

AI Orchestrator: https://ai-orchestrator-a2yg.onrender.com

Library MCP Service: https://library-map.onrender.com

Cafeteria MCP Service: https://cafeteria-mcp-wz2g.onrender.com

Events MCP Service: https://events-mcp-pp71.onrender.com

Academics MCP Service: https://academics-mcp-ebqc.onrender.com

## Architecture Overview

The monorepo workspace is organized as follows:

```
Folder for project/
├── package.json                  
├── TSConfig.json                 
├── turbo.json                     
├── start-all.js                   
│
├── apps/
│   ├── dashboard/                 
│   │   ├── src/app/               
│   │   └── src/components/        
│   │
│   └── ai-orchestrator/          
│       └── src/
│           ├── index.ts           
│           └── services/          
│
└── packages/                      
    ├── mcp-server-library/       
    ├── mcp-server-cafeteria/      
    ├── mcp-server-events/         
    └── mcp-server-academics/     
```

---

## Key Features

### 1. ChatGPT-Style Chat Interface

* SSE Stream Processing for real-time token streaming
* Auto-scrolling and typing indicators
* Markdown rendering with syntax-highlighted code blocks
* Persistent chat history stored locally

### 2. Live MCP Execution Tracing

* Real-time MCP execution timeline
* Tool invocation tracking
* Latency measurements
* Request and response inspection

### 3. Analytics Dashboard

* Query volume monitoring
* MCP invocation success/failure tracking
* Latency analytics
* Resource utilization insights
* Service health monitoring

### 4. Authentication & Admin Console

* JWT-based authentication
* Student and Admin role separation
* CRUD operations for books, events, menus, and academic resources

### 5. Academics RAG Pipeline

* PDF ingestion and indexing
* Vector search
* Semantic handbook retrieval
* Source citations

### 6. Production Security

* Helmet security headers
* Rate limiting
* Zod validation
* Winston and Morgan logging
* Swagger API documentation

---

## Technology Stack

### Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* Recharts
* Lucide Icons

### Backend

* Node.js
* Express
* Gemini 2.5 Flash
* Model Context Protocol (MCP)

### MCP Services

* FastAPI
* Python
* SQLite
* Vector Store / RAG

### Deployment

* Vercel (Frontend)
* Render (Backend & MCP Services)

---

## Environment Variables

### apps/ai-orchestrator/.env

```env
PORT=3010
NODE_ENV=production
JWT_SECRET=campus-intelligence-secret-key-2026
ALLOWED_ORIGINS=https://unified-campus-intelligence-dashboa-omega.vercel.app
GEMINI_API_KEY=your_gemini_api_key
```

---

## Local Development Setup

### Prerequisites

* Node.js v18+
* npm v10+
* Python 3.10+
* Gemini API Key

### Install Dependencies

```bash
npm install
```

### Start Entire Platform

```bash
npm run start:all
```

### Manual Startup

```bash
# Library MCP
cd packages/mcp-server-library
pip install -r requirements.txt
uvicorn main:app --port 8001

# Cafeteria MCP
cd packages/mcp-server-cafeteria
pip install -r requirements.txt
uvicorn main:app --port 8002

# Events MCP
cd packages/mcp-server-events
pip install -r requirements.txt
uvicorn main:app --port 8003

# Academics MCP
cd packages/mcp-server-academics
pip install -r requirements.txt
uvicorn main:app --port 8004

# AI Orchestrator
cd apps/ai-orchestrator
npm run dev

# Dashboard
cd apps/dashboard
npm run dev
```

---

## Verification & Telemetry

### Production

Dashboard:
https://unified-campus-intelligence-dashboa-omega.vercel.app

Backend:
https://ai-orchestrator-a2yg.onrender.com

Health Check:
https://ai-orchestrator-a2yg.onrender.com/health

### Local Development

Dashboard:
http://localhost:3000

Backend:
http://localhost:3010

Swagger:
http://localhost:3010/api-docs

Health:
http://localhost:3010/health

---

## Deployment Guidelines

### Frontend (Vercel)

```bash
npm run build -w dashboard
npm run start -w dashboard
```

### AI Orchestrator (Render)

```bash
npm run build -w ai-orchestrator
```

### MCP Services (Render)

Deploy each FastAPI MCP service independently:

* Library MCP
* Cafeteria MCP
* Events MCP
* Academics MCP

Each service communicates with the AI Orchestrator through MCP while the dashboard interacts with the orchestrator through authenticated REST endpoints.
