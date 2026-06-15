import { GoogleGenAI } from '@google/genai';
import { MCPService } from './mcp-service';

export interface TokenUsage {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
}

export class AIService {
  private ai: GoogleGenAI | null = null;
  private mcpService: MCPService;

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      console.log('[AIService] Reusable AI Service initialized with Gemini SDK.');
    } else {
      console.warn('[AIService] Reusable AI Service: GEMINI_API_KEY is missing. Mock Mode will be enforced.');
    }
  }

  /**
   * Helper to execute API calls with exponential backoff retries
   * Specifically handles status 429 (Resource Exhausted)
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;
      
      const errorMessage = error.message || '';
      const isRateLimit =
        error.status === 429 ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota');
        
      const waitTime = isRateLimit ? delay * 2.5 : delay;
      console.warn(
        `[AIService] API Call failed. Retrying in ${waitTime}ms... (${retries} retries remaining). Error: ${errorMessage}`
      );
      
      await new Promise(res => setTimeout(res, waitTime));
      return this.retryWithBackoff(fn, retries - 1, waitTime * 1.5);
    }
  }

  /**
   * Maps MCP Tool schemas to Gemini function declarations format
   */
  private getGeminiTools(): any[] {
    const mcpTools = this.mcpService.getAllTools();
    if (mcpTools.length === 0) return [];

    const functionDeclarations = mcpTools.map(tool => {
      // Map JSON Schema properties to Gemini-compatible uppercase types
      const properties: Record<string, any> = {};
      const inputSchema = tool.inputSchema || {};
      const required = inputSchema.required || [];

      if (inputSchema.properties) {
        for (const [key, val] of Object.entries(inputSchema.properties) as any) {
          let typeStr = 'STRING';
          if (val.type === 'integer' || val.type === 'number') {
            typeStr = 'NUMBER';
          } else if (val.type === 'boolean') {
            typeStr = 'BOOLEAN';
          } else if (val.type === 'array') {
            typeStr = 'ARRAY';
          } else if (val.type === 'object') {
            typeStr = 'OBJECT';
          }
          properties[key] = {
            type: typeStr,
            description: val.description || '',
          };
        }
      }

      return {
        name: tool.name,
        description: tool.description || `Execute tool ${tool.name}`,
        parameters: {
          type: 'OBJECT',
          properties,
          required,
        },
      };
    });

    return [{ functionDeclarations }];
  }

  /**
   * Helper to compile a human-readable summary of a tool's JSON output
   */
  private generateToolSummary(toolName: string, result: any): string {
    try {
      const text = result.content?.[0]?.text;
      if (!text) return 'Completed successfully';
      const data = JSON.parse(text);
      if (data.status === 'error') return `Failed: ${data.message}`;
      
      switch (toolName) {
        case 'search_book':
          return `Found ${data.count || 0} matching book(s) in catalog`;
        case 'get_book_details':
          return `Retrieved detailed record for "${data.book?.title || 'Book'}"`;
        case 'check_availability':
          return data.available ? `On Shelf (${data.copies_available} copies available at ${data.location})` : 'All copies currently loaned';
        case 'get_today_menu':
          return `Loaded daily options: ${data.menu?.lunch?.length || 0} lunch entries`;
        case 'get_weekly_menu':
          return 'Retrieved 7-day cafeteria specials schedule';
        case 'get_upcoming_events':
          return `Found ${data.count || 0} scheduled campus events`;
        case 'search_event':
          return `Found ${data.count || 0} event matches`;
        case 'search_course':
          return `Found ${data.count || 0} matching academic courses`;
        case 'get_course_details':
          return `Loaded credits and syllabus for "${data.course?.title || 'Course'}"`;
        case 'search_faculty':
          return `Found ${data.count || 0} matching professor profiles`;
        case 'search_handbook':
          return `Searched handbook knowledge base: found ${data.count || 0} policy matches`;
        default:
          return 'Data parsed successfully';
      }
    } catch {
      return 'Tool processed successfully';
    }
  }

  /**
   * Main Orchestration Entrypoint
   * Coordinates the chat loop, executes tools dynamically, tracks tokens, and yields streaming output.
   */
  async orchestrateChat(
    message: string,
    onStreamChunk?: (chunk: string) => void,
    onToolProgress?: (progress: {
      type: 'tool_start' | 'tool_end';
      tool: string;
      args?: string;
      status?: 'success' | 'failed';
      duration?: number;
      summary?: string;
    }) => void
  ): Promise<{
    text: string;
    calls: { tool: string; args: string; status: 'success' | 'failed'; duration?: number; summary?: string }[];
    tokens: TokenUsage;
  }> {
    const traces: { tool: string; args: string; status: 'success' | 'failed'; duration?: number; summary?: string }[] = [];
    const tokenTracker: TokenUsage = { promptTokens: 0, candidateTokens: 0, totalTokens: 0 };

    // Fallback: If no Gemini key is provided, execute via local mock intent parser
    if (!this.ai) {
      const result = await this.runMockIntelligentRouting(message, traces, onToolProgress);
      return { text: result, calls: traces, tokens: tokenTracker };
    }

    try {
      const tools = this.getGeminiTools();
      const model = 'gemini-2.5-flash';

      // 1. Initial Prompt Call
      console.log(`[AIService] Sending initial chat to ${model} (Tools available: ${this.mcpService.getAllTools().length})`);
      const response = await this.retryWithBackoff(() =>
        this.ai!.models.generateContent({
          model,
          contents: message,
          config: tools.length > 0 ? { tools } : undefined,
        })
      );

      // Log and add initial token usage
      this.accumulateTokens(response.usageMetadata, tokenTracker);

      const functionCalls = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);

      // 2. Resolve Tool Calls Loop if Gemini requests them
      if (functionCalls && functionCalls.length > 0) {
        const toolOutputs: any[] = [];
        console.log(`[AIService] Gemini requested ${functionCalls.length} tool call(s) in parallel.`);

        for (const fc of functionCalls) {
          if (!fc.functionCall || !fc.functionCall.name) continue;
          const name = fc.functionCall.name;
          const args = fc.functionCall.args;
          const stringifiedArgs = JSON.stringify(args);
          
          // Notify tool start
          onToolProgress?.({ type: 'tool_start', tool: name, args: stringifiedArgs });
          const startTime = performance.now();
          
          try {
            const mcpResult = await this.mcpService.executeTool(name, args);
            const outputText = mcpResult.content?.[0]?.text || JSON.stringify(mcpResult);
            const duration = Math.round(performance.now() - startTime);
            const summary = this.generateToolSummary(name, mcpResult);

            toolOutputs.push({
              functionName: name,
              response: { output: outputText },
            });

            traces.push({ tool: name, args: stringifiedArgs, status: 'success', duration, summary });
            // Notify tool completion success
            onToolProgress?.({ type: 'tool_end', tool: name, status: 'success', duration, summary });
          } catch (err: any) {
            const duration = Math.round(performance.now() - startTime);
            toolOutputs.push({
              functionName: name,
              response: { error: err.message },
            });

            traces.push({ tool: name, args: stringifiedArgs, status: 'failed', duration, summary: err.message });
            // Notify tool completion failure
            onToolProgress?.({ type: 'tool_end', tool: name, status: 'failed', duration, summary: err.message });
          }
        }

        // 3. Return Tool Output and stream final response
        console.log('[AIService] Feeding tool results back to Gemini...');
        const followUpContents = [
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: functionCalls },
          {
            role: 'user',
            parts: toolOutputs.map(to => ({
              functionResponse: {
                name: to.functionName,
                response: to.response,
              },
            })),
          },
        ];

        if (onStreamChunk) {
          // Stream final text if callback provided
          const stream = await this.retryWithBackoff(() =>
            this.ai!.models.generateContentStream({
              model,
              contents: followUpContents,
            })
          );

          let aggregatedText = '';
          for await (const chunk of stream) {
            const chunkText = chunk.text || '';
            aggregatedText += chunkText;
            onStreamChunk(chunkText);
          }

          return {
            text: aggregatedText,
            calls: traces,
            tokens: tokenTracker,
          };
        } else {
          // Standard block call
          const followUp = await this.retryWithBackoff(() =>
            this.ai!.models.generateContent({
              model,
              contents: followUpContents,
            })
          );
          this.accumulateTokens(followUp.usageMetadata, tokenTracker);
          return {
            text: followUp.text || '',
            calls: traces,
            tokens: tokenTracker,
          };
        }
      }

      // No tool calls requested: Stream or return text directly
      const textResponse = response.text || '';
      if (onStreamChunk && textResponse) {
        onStreamChunk(textResponse);
      }
      return {
        text: textResponse,
        calls: [],
        tokens: tokenTracker,
      };

    } catch (error: any) {
      console.error('[AIService] Fatal Error in agentic Loop:', error.message);
      throw error;
    }
  }

  /**
   * Accumulates Gemini usage metadata into TokenUsage
   */
  private accumulateTokens(usageMetadata: any, tracker: TokenUsage) {
    if (!usageMetadata) return;
    tracker.promptTokens += usageMetadata.promptTokenCount || 0;
    tracker.candidateTokens += usageMetadata.candidatesTokenCount || 0;
    tracker.totalTokens += usageMetadata.totalTokenCount || 0;
  }

  /**
   * Intelligent Mock Routing Fallback
   * Programmatically parses queries, executes actual tools on the running python MCP servers,
   * and synthesizes a clean, unified markdown response.
   */
  private async runMockIntelligentRouting(
    message: string,
    traces: any[],
    onToolProgress?: (progress: any) => void
  ): Promise<string> {
    console.log('[AIService] Running in Advanced Mock Intelligent Routing Mode.');
    const query = message.toLowerCase();
    
    let libraryData: any = null;
    let availabilityData: any = null;
    let cafeteriaData: any = null;
    let eventsData: any = null;
    let academicsData: any = null;
    let facultyData: any = null;
    let handbookData: any = null;

    try {
      // 1. Library check & search query extraction
      const isLibraryQuery = query.includes('clrs') || query.includes('sicp') || query.includes('book') || query.includes('isbn') || query.includes('available') || query.includes('recommended');
      if (isLibraryQuery) {
        // Extract query: "books on machine learning" -> "machine learning"
        let searchTerm = 'Algorithms'; // Default
        const match = query.match(/books\s+on\s+([a-z0-9\s]+)/i);
        if (match && match[1]) {
          searchTerm = match[1].trim();
        } else if (query.includes('clrs')) {
          searchTerm = 'Algorithms';
        } else if (query.includes('sicp')) {
          searchTerm = 'Structure';
        }

        const toolName = 'search_book';
        const args = { query: searchTerm };
        const stringifiedArgs = JSON.stringify(args);
        
        onToolProgress?.({ type: 'tool_start', tool: toolName, args: stringifiedArgs });
        const startTime = performance.now();
        
        try {
          const res = await this.mcpService.executeTool(toolName, args);
          const duration = Math.round(performance.now() - startTime);
          const summary = this.generateToolSummary(toolName, res);
          
          libraryData = JSON.parse(res.content?.[0]?.text);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'success', duration, summary });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'success', duration, summary });

          // If looking for a specific book (like CLRS), check its availability as well
          if (query.includes('clrs') || query.includes('available') || query.includes('algorithms')) {
            const availTool = 'check_availability';
            const availArgs = { isbn: '9780262033848' }; // CLRS isbn
            const availStrArgs = JSON.stringify(availArgs);
            
            onToolProgress?.({ type: 'tool_start', tool: availTool, args: availStrArgs });
            const availStartTime = performance.now();
            
            const availRes = await this.mcpService.executeTool(availTool, availArgs);
            const availDuration = Math.round(performance.now() - availStartTime);
            const availSummary = this.generateToolSummary(availTool, availRes);
            
            availabilityData = JSON.parse(availRes.content?.[0]?.text);
            traces.push({ tool: availTool, args: availStrArgs, status: 'success', duration: availDuration, summary: availSummary });
            onToolProgress?.({ type: 'tool_end', tool: availTool, status: 'success', duration: availDuration, summary: availSummary });
          }
        } catch (e: any) {
          const duration = Math.round(performance.now() - startTime);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'failed', duration, summary: e.message });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'failed', duration, summary: e.message });
        }
      }

      // 2. Cafeteria check
      const isCafeteriaQuery = query.includes('menu') || query.includes('today') || query.includes('breakfast') || query.includes('lunch') || query.includes('dinner') || query.includes('weekly') || query.includes('food');
      if (isCafeteriaQuery) {
        const toolName = 'get_today_menu';
        const args = { cafeteria_id: 'dining_hall_1' };
        const stringifiedArgs = JSON.stringify(args);
        
        onToolProgress?.({ type: 'tool_start', tool: toolName, args: stringifiedArgs });
        const startTime = performance.now();
        
        try {
          const res = await this.mcpService.executeTool(toolName, args);
          const duration = Math.round(performance.now() - startTime);
          const summary = this.generateToolSummary(toolName, res);
          
          cafeteriaData = JSON.parse(res.content?.[0]?.text);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'success', duration, summary });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'success', duration, summary });
        } catch (e: any) {
          const duration = Math.round(performance.now() - startTime);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'failed', duration, summary: e.message });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'failed', duration, summary: e.message });
        }
      }

      // 3. Events check
      const isEventsQuery = query.includes('event') || query.includes('upcoming') || query.includes('workshop') || query.includes('hackathon') || query.includes('sports');
      if (isEventsQuery) {
        // Extract events term: "AI events" -> "AI", "upcoming workshops" -> "workshop"
        let eventTerm = '';
        if (query.includes('ai')) {
          eventTerm = 'AI';
        } else if (query.includes('workshop')) {
          eventTerm = 'workshop';
        } else if (query.includes('hackathon')) {
          eventTerm = 'Hackathon';
        }

        const toolName = eventTerm ? 'search_event' : 'get_upcoming_events';
        const args = eventTerm ? { query: eventTerm } : {};
        const stringifiedArgs = JSON.stringify(args);
        
        onToolProgress?.({ type: 'tool_start', tool: toolName, args: stringifiedArgs });
        const startTime = performance.now();
        
        try {
          const res = await this.mcpService.executeTool(toolName, args);
          const duration = Math.round(performance.now() - startTime);
          const summary = this.generateToolSummary(toolName, res);
          
          eventsData = JSON.parse(res.content?.[0]?.text);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'success', duration, summary });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'success', duration, summary });
        } catch (e: any) {
          const duration = Math.round(performance.now() - startTime);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'failed', duration, summary: e.message });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'failed', duration, summary: e.message });
        }
      }

      // 4. Academics check
      const isAcademicsQuery = query.includes('course') || query.includes('cs101') || query.includes('chem202') || query.includes('class') || query.includes('teaches') || query.includes('instructor') || query.includes('faculty') || query.includes('professor');
      if (isAcademicsQuery) {
        // Extract course: "CS101" or "CHEM202"
        let courseCode = 'CS101';
        if (query.includes('chem202')) courseCode = 'CHEM202';
        else if (query.includes('cs202')) courseCode = 'CS202';

        const toolName = 'get_course_details';
        const args = { course_code: courseCode };
        const stringifiedArgs = JSON.stringify(args);
        
        onToolProgress?.({ type: 'tool_start', tool: toolName, args: stringifiedArgs });
        const startTime = performance.now();
        
        try {
          const res = await this.mcpService.executeTool(toolName, args);
          const duration = Math.round(performance.now() - startTime);
          const summary = this.generateToolSummary(toolName, res);
          
          academicsData = JSON.parse(res.content?.[0]?.text);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'success', duration, summary });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'success', duration, summary });

          // Also lookup faculty if looking for who teaches it
          if (query.includes('teaches') || query.includes('faculty') || query.includes('professor') || query.includes('who')) {
            const facTool = 'search_faculty';
            const facName = academicsData.course?.instructor || 'Sarah';
            const facArgs = { name: facName };
            const facStrArgs = JSON.stringify(facArgs);
            
            onToolProgress?.({ type: 'tool_start', tool: facTool, args: facStrArgs });
            const facStartTime = performance.now();
            
            const facRes = await this.mcpService.executeTool(facTool, facArgs);
            const facDuration = Math.round(performance.now() - facStartTime);
            const facSummary = this.generateToolSummary(facTool, facRes);
            
            facultyData = JSON.parse(facRes.content?.[0]?.text);
            traces.push({ tool: facTool, args: facStrArgs, status: 'success', duration: facDuration, summary: facSummary });
            onToolProgress?.({ type: 'tool_end', tool: facTool, status: 'success', duration: facDuration, summary: facSummary });
          }
        } catch (e: any) {
          const duration = Math.round(performance.now() - startTime);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'failed', duration, summary: e.message });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'failed', duration, summary: e.message });
        }
      }

      // 5. Handbook / RAG policy check
      const isHandbookQuery = query.includes('policy') || query.includes('attendance') || query.includes('handbook') || query.includes('rules') || query.includes('grading') || query.includes('requirement');
      if (isHandbookQuery) {
        const toolName = 'search_handbook';
        const args = { query: message }; // pass original message for best embeddings match
        const stringifiedArgs = JSON.stringify(args);
        
        onToolProgress?.({ type: 'tool_start', tool: toolName, args: stringifiedArgs });
        const startTime = performance.now();
        
        try {
          const res = await this.mcpService.executeTool(toolName, args);
          const duration = Math.round(performance.now() - startTime);
          const summary = this.generateToolSummary(toolName, res);
          
          handbookData = JSON.parse(res.content?.[0]?.text);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'success', duration, summary });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'success', duration, summary });
        } catch (e: any) {
          const duration = Math.round(performance.now() - startTime);
          traces.push({ tool: toolName, args: stringifiedArgs, status: 'failed', duration, summary: e.message });
          onToolProgress?.({ type: 'tool_end', tool: toolName, status: 'failed', duration, summary: e.message });
        }
      }

      // -------------------------------------------------------------
      // Dynamic Synthesized Response Compiler
      // -------------------------------------------------------------
      if (!libraryData && !cafeteriaData && !eventsData && !academicsData && !handbookData) {
        return "I am running in offline local mode since no GEMINI_API_KEY is configured. I couldn't find matching intents in your request. Try asking about:\n- *'What is the attendance policy?'*\n- *'Today's menu and AI events'*\n- *'Books on machine learning and upcoming workshops'*\n- *'Who teaches CS101 and what books are recommended?'*";
      }

      let answer = "I have queried the campus MCP databases to compile your request:\n\n";

      // 1. Synthesize Academics & Faculty details
      if (academicsData && academicsData.status === 'success') {
        const c = academicsData.course;
        answer += `### 🎓 Academic Details: ${c.code}\n`;
        answer += `The course **${c.title}** (${c.credits} credits) is scheduled for **${c.timing}**.\n`;
        answer += `*   **Syllabus Overview:** ${c.syllabus}\n`;
        
        if (facultyData && facultyData.status === 'success' && facultyData.count > 0) {
          const f = facultyData.faculty[0];
          answer += `*   **Instructor Profile:** **${f.name}** (${f.department}). Office: *${f.office}*. Office Hours: *${f.office_hours}*. Contact: \`${f.email}\`\n`;
        } else {
          answer += `*   **Instructor:** ${c.instructor}\n`;
        }
        answer += '\n';
      }

      // 2. Synthesize Library details
      if (libraryData && libraryData.status === 'success') {
        answer += `### 📚 Library Search Catalog\n`;
        if (libraryData.count > 0) {
          libraryData.books.forEach((b: any) => {
            answer += `*   **${b.title}** by *${b.authors}* (ISBN: \`${b.isbn}\` • *${b.category}*)\n`;
          });
          
          if (availabilityData && availabilityData.status === 'success') {
            const a = availabilityData;
            answer += `*   **Availability Status:** ${
              a.available
                ? `🟢 **Available** — ${a.copies_available}/${a.total_copies} copies on shelf at **${a.location}**`
                : `🔴 **Checked Out** — Expected return date: **${a.expected_return}**`
            }\n`;
          }
        } else {
          answer += `No volumes matching your parameters were found in the library database.\n`;
        }
        answer += '\n';
      }

      // 3. Synthesize Cafeteria details
      if (cafeteriaData && cafeteriaData.status === 'success') {
        const menu = cafeteriaData.menu;
        answer += `### 🍳 Cafeteria Menu (Dining Hall 1)\n`;
        answer += `*   **Breakfast:** ${menu.breakfast.map((m: any) => `${m.item} ($${m.price.toFixed(2)})`).join(', ')}\n`;
        answer += `*   **Lunch:** ${menu.lunch.map((m: any) => `${m.item} ($${m.price.toFixed(2)})`).join(', ')}\n`;
        answer += `*   **Dinner:** ${menu.dinner.map((m: any) => `${m.item} ($${m.price.toFixed(2)})`).join(', ')}\n`;
        answer += '\n';
      }

      // 4. Synthesize Events details
      if (eventsData && eventsData.status === 'success') {
        answer += `### 📅 Upcoming Campus Events\n`;
        const list = eventsData.events || [];
        if (list.length > 0) {
          list.forEach((e: any) => {
            answer += `*   **${e.title}** (${e.category})\n`;
            answer += `    *   *Time:* ${e.date} • ${e.time}\n`;
            answer += `    *   *Venue:* ${e.venue} (Hosted by *${e.speaker_or_host}*)\n`;
            answer += `    *   *Description:* ${e.description}\n`;
          });
        } else {
          answer += `No scheduled events match your search term.\n`;
        }
        answer += '\n';
      }

      // 5. Synthesize Handbook / Policy RAG details
      if (handbookData && handbookData.status === 'success') {
        answer += `### 📄 Policy & Handbook RAG Matches\n`;
        const list = handbookData.results || [];
        if (list.length > 0) {
          list.forEach((r: any) => {
            answer += `> ${r.content}\n`;
            answer += `> \n`;
            answer += `> *Source: **${r.document}** (Page ${r.page}) • Similarity score: ${Math.round(r.score * 100)}%*\n\n`;
          });
        } else {
          answer += `No handbook documents have been uploaded to the Academics Knowledge Base yet. Here is the standard fallback policy:\n\n`;
          answer += `> **Standard Attendance Policy:** Students are required to maintain a minimum of **75% attendance** in all registered courses. Failure to meet this requirement may result in automatic debarment from taking the final examination.\n`;
          answer += `> \n`;
          answer += `> *Source: **Mock Institutional Policy Guide (Pre-load)** • Confidence: High*\n\n`;
        }
      }

      return answer;

    } catch (err: any) {
      console.error('[AIService] Advanced mock routing error:', err.message);
      return `Failed to resolve mock query. Ensure you have started the python FastAPI MCP servers. Error: ${err.message}`;
    }
  }
}
