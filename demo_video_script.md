# 🎥 Unified Campus Intelligence System - Demo Video Script

**Duration:** ~5 Minutes  
**Objective:** Showcase the multi-MCP server routing, real-time tool trace timeline, RAG policy indexing, Recharts telemetry, JWT security, and interactive Swagger API docs of the campus platform.

---

## 🎬 Act 1: Introduction & Architecture (~45 Seconds)

*   **[Visual]** Close-up on the presenter, transitioning to a split-screen of the Next.js landing dashboard and a slide showing the Turborepo monorepo architecture: Next.js frontend, Node/Express broker, and 4 FastAPI python servers (Library, Cafeteria, Events, Academics).
*   **[Audio - Voiceover]**
    > "Welcome! Today we are showcasing the Unified Campus Operations Intelligence System. This platform orchestrates distributed campus services using a centralized AI broker and Model Context Protocol, or MCP. By running Next.js on the frontend, an Express broker in the middle, and 4 Python FastAPI servers on the backend, we give students and admins a single conversational dashboard to manage books, dining, events, and academic policies."

---

## 📊 Act 2: Home Dashboard & Telemetry (~45 Seconds)

*   **[Visual]** Navigating the Dashboard Home page. Shimmering skeleton loaders fade out, revealing occupancy graphs, real-time energy savings meters, active system warning trays, and quick metrics cards.
*   **[Audio - Voiceover]**
    > "Starting on the Overview landing page, we see system statistics, active operations alarms, and live Recharts visualizations representing campus student occupancy and energy efficiency parameters. Note the clean glassmorphic design and the mounting skeleton loaders that guarantee a premium visual experience during asynchronous server loads."

---

## 🔑 Act 3: Secure JWT Login & Student Chat (~1 Minute 30 Seconds)

*   **[Visual]** Clicking 'Logout' then 'Login'. Pre-filling the Student credentials (`student`/`student`) and navigating to the AI Assistant.
*   **[Audio - Voiceover]**
    > "Access to resources is guarded by JWT authentication. We will log in as a Student first. Let's ask our AI Assistant: *'What is today's menu at the Dining Hall?'*"
*   **[Visual]** Typing and submitting the menu query. Bouncing dots typing indicator flashes, the Execution Trace timeline on the right side slides open showing `get_today_menu` in a running state, then turning green with a checkmark. The assistant response streams in.
*   **[Audio - Voiceover]**
    > "Notice the real-time execution trace timeline on the right. It displays which server is called, how long the call took, and a collapsible payload inspector. The AI dynamically resolves that this query requires the Cafeteria MCP server and streams a synthesized markdown response."
*   **[Visual]** Submitting a multi-source query: *'What is today's menu and what events are upcoming?'* The execution timeline shows two tools running concurrently: `get_today_menu` and `get_upcoming_events`. They turn green, and a single synthesized output streams in.
*   **[Audio - Voiceover]**
    > "When we ask a mixed query, the AI Orchestrator executes parallel tool calls across multiple servers—the Cafeteria and Events MCPs—aggregating the responses into a single, unified answer."
*   **[Visual]** Submitting a RAG query: *'What is the attendance policy?'*. The trace shows the Academics MCP calling the semantic vector retriever, matching document chunks, and returning citations.
*   **[Audio - Voiceover]**
    > "For academic policies, the Academics MCP performs a semantic vector lookup against the indexed handbook PDF, retrieving precise paragraphs with source citations."

---

## 📈 Act 4: Telemetry Analytics Dashboard (~45 Seconds)

*   **[Visual]** Clicking on 'Analytics' on the sidebar. The page mounts, showing line charts for query volume/latency trends, bar charts for MCP node call frequencies, pie charts for hot resource hits, and live server health cards.
*   **[Audio - Voiceover]**
    > "Our telemetry Analytics dashboard tracks orchestrator operations. Using Recharts, we plot total queries, response times, individual server success rates, and hot resource hits. Below, we monitor server cluster health, average latency, uptime, CPU, and memory metrics."

---

## 🛡️ Act 5: Admin Console & RAG Document Upload (~1 Minute)

*   **[Visual]** Logging out and logging back in as an Administrator (`admin`/`admin`). Navigating to the 'Admin Console' Shield tab. Click on 'Handbooks' tab, drag-and-drop a sample academic handbook PDF and click 'Index Document Chunks'. The loader updates.
*   **[Audio - Voiceover]**
    > "Let's log in as an Admin to access the Admin Console. Here, admins can add/delete catalog entries and manage policy documents. We'll upload a new PDF handbook. The system splits the PDF, extracts text, computes embeddings, and indexes them in our SQLite vector store—making the knowledge searchable immediately."
*   **[Visual]** Navigating to `http://localhost:3010/api-docs` to show the Swagger UI OpenAPI specs.
*   **[Audio - Voiceover]**
    > "In production, the backend is protected by rate limiters, Helmet headers, and input validators. Developers can inspect all API routes and interactive specs via our Swagger UI dashboard under the `/api-docs` endpoint."

---

## 🏁 Act 6: Conclusion (~15 Seconds)

*   **[Visual]** Back to presenter or the system landing dashboard.
*   **[Audio - Voiceover]**
    > "This concludes the walk-through of the Unified Campus Operations Intelligence System. A secure, resilient, and fully auditable platform preparing modern campuses for agentic AI operations. Thank you!"
