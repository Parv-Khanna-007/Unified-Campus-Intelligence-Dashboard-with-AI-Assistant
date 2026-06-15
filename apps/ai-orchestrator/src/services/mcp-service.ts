import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import * as EventSourceModule from 'eventsource';

// Polyfill EventSource supporting CommonJS and ESM imports
if (typeof globalThis.EventSource === 'undefined') {
  (globalThis as any).EventSource = (EventSourceModule as any).EventSource || (EventSourceModule as any).default || EventSourceModule;
}

export interface MCPServerConfig {
  name: string;
  url: string;
}

export class MCPService {
  private servers: MCPServerConfig[];
  private connectedClients: Map<string, { client: Client; tools: any[] }> = new Map();

  constructor(servers: MCPServerConfig[]) {
    this.servers = servers;
  }

  /**
   * Connect to all registered MCP servers
   */
  async connectAll(): Promise<void> {
    for (const server of this.servers) {
      try {
        console.log(`[MCPService] Connecting to ${server.name} at ${server.url}...`);
        const transport = new SSEClientTransport(new URL(server.url));
        const client = new Client(
          { name: 'ai-orchestrator-client', version: '1.0.0' },
          { capabilities: { listTools: {}, callTool: {} } }
        );

        await client.connect(transport);
        const response = await client.listTools();
        const tools = response.tools || [];
        
        this.connectedClients.set(server.name, { client, tools });
        console.log(`[MCPService] Successfully connected to ${server.name} (${tools.length} tools registered).`);
      } catch (error: any) {
        console.error(`[MCPService] Error connecting to ${server.name} (${server.url}):`, error.message);
      }
    }
  }

  /**
   * List all registered tools across all connected servers
   */
  getAllTools(): any[] {
    const allTools: any[] = [];
    for (const [serverName, data] of this.connectedClients.entries()) {
      for (const tool of data.tools) {
        allTools.push({
          ...tool,
          serverName,
        });
      }
    }
    return allTools;
  }

  /**
   * Check if a specific tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.getAllTools().some(t => t.name === toolName);
  }

  /**
   * Execute a tool on the respective connected server
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    for (const [serverName, data] of this.connectedClients.entries()) {
      const toolExists = data.tools.some(t => t.name === toolName);
      if (toolExists) {
        try {
          console.log(`[MCPService] Calling tool "${toolName}" on server "${serverName}"`);
          const result = await data.client.callTool({
            name: toolName,
            arguments: args,
          });
          return result;
        } catch (error: any) {
          console.error(`[MCPService] Error executing tool "${toolName}" on "${serverName}":`, error.message);
          throw new Error(`MCP tool execution error on "${serverName}" for "${toolName}": ${error.message}`);
        }
      }
    }
    throw new Error(`Tool "${toolName}" is not registered on any connected MCP server.`);
  }

  /**
   * Disconnect all clients
   */
  async disconnectAll(): Promise<void> {
    for (const [name, data] of this.connectedClients.entries()) {
      try {
        await data.client.close();
        console.log(`[MCPService] Disconnected from ${name}`);
      } catch (err) {
        // Ignore close errors
      }
    }
    this.connectedClients.clear();
  }
}
