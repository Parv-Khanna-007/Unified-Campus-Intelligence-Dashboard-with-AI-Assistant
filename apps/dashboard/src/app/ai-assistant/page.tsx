'use client';

import * as React from 'react';
import {
  Send,
  Sparkles,
  Terminal,
  Cpu,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
  Database,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/providers';
import { Skeleton } from '@/components/ui/skeleton';

interface ToolCall {
  tool: string;
  args: string;
  status: 'success' | 'running' | 'failed';
  duration?: number;
  summary?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  calls?: ToolCall[];
}

interface ConversationSession {
  id: string;
  title: string;
  messages: Message[];
}

const suggestedPrompts = [
  { text: 'Is CLRS available at the library?', category: 'Library' },
  { text: 'What is today\'s menu at Dining Hall?', category: 'Cafeteria' },
  { text: 'What is today\'s menu and upcoming events?', category: 'Mixed Query' },
  { text: 'What is the attendance policy?', category: 'RAG Policy' },
];

export default function AIAssistantPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = React.useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string>('');
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Connection state
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);

  // Trace list of the active generation
  const [activeTrace, setActiveTrace] = React.useState<ToolCall[]>([]);

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // 1. Load chat history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('campus_intel_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }

    // Initialize with a default session if empty
    const defaultSession: ConversationSession = {
      id: 'session-default',
      title: 'Welcome Chat',
      messages: [
        {
          id: '1',
          sender: 'ai',
          text: 'Hello, I am your Campus AI Assistant. I have active connections to the **Library**, **Cafeteria**, **Events**, and **Academics** MCP servers. How can I assist you today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSessions([defaultSession]);
    setActiveSessionId('session-default');
  }, []);

  // 2. Save chat history to localStorage
  React.useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('campus_intel_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // 3. Auto-scroll to the bottom of the feed during typing / streaming
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [sessions, isTyping, activeTrace]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Create a new empty chat thread
  const handleNewChat = () => {
    const newSession: ConversationSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      messages: [
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'Hello! I am ready to process queries. How can I search the library, class rosters, cafeteria menus, or upcoming events for you?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Delete a chat thread
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id && filtered.length > 0) {
      setActiveSessionId(filtered[0].id);
    } else if (filtered.length === 0) {
      const defaultSession: ConversationSession = {
        id: 'session-default',
        title: 'New Chat',
        messages: [
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: 'Hello! Ask me anything about books, classes, shuttle times, or cafeteria items.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      setSessions([defaultSession]);
      setActiveSessionId('session-default');
    }
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Mock Fallback Streaming simulation (runs when AI Orchestrator is offline)
  const simulateOfflineStreaming = (userQuery: string, sessionToUpdateId: string) => {
    setIsTyping(true);
    setIsOfflineMode(true);
    
    // Reset active trace for mock progress triggering
    setActiveTrace([]);

    const queryLower = userQuery.toLowerCase();
    
    // Simulate pipeline process timelines
    setTimeout(() => {
      // Step 1: Start Tool 1
      let tool1 = 'search_book';
      let args1: any = { query: 'Algorithms' };
      let summary1 = 'Found 3 matching book(s) in catalog';
      let latency1 = 120;
      
      if (queryLower.includes('menu') || queryLower.includes('today')) {
        tool1 = 'get_today_menu';
        args1 = { cafeteria_id: 'dining_hall_1' };
        summary1 = 'Loaded daily options: 2 lunch entries';
        latency1 = 180;
      } else if (queryLower.includes('event') || queryLower.includes('upcoming')) {
        tool1 = 'get_upcoming_events';
        args1 = {};
        summary1 = 'Found 4 scheduled campus events';
        latency1 = 150;
      }
      
      setActiveTrace([{ tool: tool1, args: JSON.stringify(args1), status: 'running' }]);
      
      setTimeout(() => {
        // Step 1 Complete, Check if another tool needed (Mixed Query)
        setActiveTrace([{ tool: tool1, args: JSON.stringify(args1), status: 'success', duration: latency1, summary: summary1 }]);
        
        const isMixed = queryLower.includes('menu') && queryLower.includes('event');
        if (isMixed) {
          const tool2 = 'get_upcoming_events';
          const args2 = {};
          const summary2 = 'Found 4 scheduled campus events';
          const latency2 = 140;
          
          setActiveTrace((prev) => [...prev, { tool: tool2, args: JSON.stringify(args2), status: 'running' }]);
          
          setTimeout(() => {
            setActiveTrace((prev) =>
              prev.map((t) =>
                t.tool === tool2 ? { ...t, status: 'success', duration: latency2, summary: summary2 } : t
              )
            );
            triggerFinalTextResponse(userQuery, sessionToUpdateId, [
              { tool: tool1, args: JSON.stringify(args1), status: 'success', duration: latency1, summary: summary1 },
              { tool: tool2, args: JSON.stringify(args2), status: 'success', duration: latency2, summary: summary2 }
            ]);
          }, 800);
        } else {
          // Standard Single Tool response
          triggerFinalTextResponse(userQuery, sessionToUpdateId, [
            { tool: tool1, args: JSON.stringify(args1), status: 'success', duration: latency1, summary: summary1 }
          ]);
        }
      }, 1000);
    }, 600);
  };

  const triggerFinalTextResponse = (userQuery: string, sessionToUpdateId: string, finalTraces: ToolCall[]) => {
    setIsTyping(false);
    
    let answerText = 'I checked, but no matching books or menus were found.';
    const queryLower = userQuery.toLowerCase();
    
    if (queryLower.includes('clrs') || queryLower.includes('book') || queryLower.includes('algorithms')) {
      answerText = 'According to the **Library MCP**, **Introduction to Algorithms** (CLRS) is available on **Shelf A-4** with **3 copies** ready for check out. Let me know if you would like me to check any other volumes!';
    } else if (queryLower.includes('menu') && queryLower.includes('event')) {
      answerText = 'Here is the summary of today\'s menus and events:\n\n**Cafeteria Menu (Dining Hall 1):**\n- **Lunch**: Grilled Chicken Breast & Quinoa ($8.50, 520 kcal)\n- **Dinner**: Baked Salmon with Asparagus ($11.00)\n\n**Upcoming Events:**\n- **Annual Campus Hackathon** (June 20, 09:00 AM) at *Engineering Auditorium Block C*.\n- **AI in Education Panel** (June 16, 02:00 PM) at *Science Block Hall 2*.';
    } else if (queryLower.includes('menu') || queryLower.includes('cafeteria') || queryLower.includes('today')) {
      answerText = 'Today\'s menu at **Dining Hall 1** features:\n- **Breakfast**: Oatmeal with Berries ($3.50, 280 kcal), Scrambled Eggs & Bacon ($5.25)\n- **Lunch**: Grilled Chicken Breast & Quinoa ($8.50, 520 kcal)\n- **Dinner**: Baked Salmon with Asparagus ($11.00)';
    } else if (queryLower.includes('event') || queryLower.includes('upcoming') || queryLower.includes('hackathon')) {
      answerText = 'Upcoming campus events retrieved via **Events MCP**:\n1. **Annual Campus Hackathon** (June 20, 09:00 AM) at *Engineering Auditorium Block C*.\n2. **AI in Education Panel Discussion** (June 16, 02:00 PM) at *Science Block Hall 2*.';
    }

    let currentText = '';
    const words = answerText.split(' ');
    let wordIndex = 0;

    const aiMsgId = `msg-ai-${Date.now()}`;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionToUpdateId
          ? {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: aiMsgId,
                  sender: 'ai',
                  text: '',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  calls: finalTraces,
                },
              ],
            }
          : s
      )
    );

    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionToUpdateId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, text: currentText } : m
                  ),
                }
              : s
          )
        );
        wordIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);
  };

  // Send query to AI Orchestrator endpoint
  const handleSend = async (textToSend?: string) => {
    const textToSubmit = textToSend || input;
    if (!textToSubmit.trim() || !activeSessionId) return;

    setInput('');
    setIsOfflineMode(false);

    // Create user message
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSubmit,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active session thread with User message and update title if default
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: s.title === 'New Conversation' || s.title === 'Welcome Chat' ? textToSubmit.slice(0, 24) + (textToSubmit.length > 24 ? '...' : '') : s.title,
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );

    setIsTyping(true);
    setActiveTrace([]);

    try {
      // Connect to AI Orchestrator SSE Streaming endpoint
      const response = await fetch('https://ai-orchestrator-a2yg.onrender.com/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSubmit, stream: true }),
      });

      if (!response.ok) {
        throw new Error('API server returned error status.');
      }

      if (!response.body) {
        throw new Error('No readable response stream.');
      }

      setIsTyping(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const aiMsgId = `msg-ai-${Date.now()}`;
      // Add empty AI message placeholder to load stream tokens
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: aiMsgId,
                    sender: 'ai',
                    text: '',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ],
              }
            : s
        )
      );

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              
              if (data.error) {
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSessionId
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, text: `Error: ${data.error}` } : m
                          ),
                        }
                      : s
                  )
                );
              } else if (data.type === 'tool_start') {
                // Add tool call node to activeTrace live
                const newTrace: ToolCall = { tool: data.tool, args: data.args, status: 'running' };
                setActiveTrace((prev) => {
                  const exists = prev.some((t) => t.tool === data.tool);
                  if (exists) {
                    return prev.map((t) => (t.tool === data.tool ? newTrace : t));
                  }
                  return [...prev, newTrace];
                });
              } else if (data.type === 'tool_end') {
                // Update tool call node status, duration and summary details live
                setActiveTrace((prev) =>
                  prev.map((t) =>
                    t.tool === data.tool
                      ? {
                          ...t,
                          status: data.status,
                          duration: data.duration,
                          summary: data.summary,
                        }
                      : t
                  )
                );
              } else if (data.done) {
                // Terminate and record full traces and metadata
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSessionId
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === aiMsgId
                              ? {
                                  ...m,
                                  text: data.text,
                                  calls: data.calls,
                                }
                              : m
                          ),
                        }
                      : s
                  )
                );
                if (data.calls) {
                  setActiveTrace(data.calls);
                }
              } else if (data.text) {
                // Append text chunk
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSessionId
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, text: m.text + data.text } : m
                          ),
                        }
                      : s
                  )
                );
              }
            } catch (err) {
              // Ignore JSON parse errors for incomplete line buffers
            }
          }
        }
      }

    } catch (error) {
      console.warn('Orchestrator offline. Falling back to local offline mock streaming simulation.', error);
      simulateOfflineStreaming(textToSubmit, activeSessionId);
    }
  };

  const activeCalls = activeSession?.messages[activeSession.messages.length - 1]?.calls || activeTrace;

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3.5 w-64" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-5 h-[calc(100vh-12.5rem)] min-h-[500px] items-stretch">
            {/* Sidebar Skeleton */}
            <Card className="lg:col-span-1 border border-border bg-card/45 backdrop-blur-md flex flex-col overflow-hidden max-h-full">
              <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between space-y-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-5 rounded-md" />
              </CardHeader>
              <CardContent className="flex-1 p-2 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>

            {/* Chat Skeleton */}
            <Card className="lg:col-span-3 flex flex-col border border-border bg-card/45 backdrop-blur-md overflow-hidden max-h-full">
              <CardHeader className="border-b border-border py-3 px-4 bg-muted/10">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="flex gap-3 max-w-[70%]">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-3 max-w-[70%] ml-auto flex-row-reverse">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border p-3 bg-muted/15 flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>

            {/* Trace Panel Skeleton */}
            <Card className="lg:col-span-1 border border-border bg-card/65 flex flex-col overflow-hidden max-h-full">
              <CardHeader className="border-b border-border bg-muted/20 py-2.5 px-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent className="flex-grow p-4 flex flex-col justify-center items-center">
                <Skeleton className="h-8 w-8 rounded-full mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center">
              AI Campus Assistant
              {isOfflineMode && (
                <Badge variant="warning" className="ml-2 text-[9px] py-0 px-1.5 font-normal uppercase">
                  Offline Demo
                </Badge>
              )}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Conversational query center running over independent FastAPI MCP resources.
            </p>
          </div>
        </div>

        {/* Chat Layout Workspace */}
        <div className="grid gap-4 lg:grid-cols-5 h-[calc(100vh-12.5rem)] min-h-[500px] items-stretch">
          {/* History Sidebar */}
          <Card className="lg:col-span-1 border border-border bg-card/45 backdrop-blur-md flex flex-col overflow-hidden max-h-full">
            <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between space-y-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chat Threads</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={handleNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-y-auto space-y-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setActiveTrace([]);
                  }}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-all duration-200',
                    activeSessionId === s.id
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">{s.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteChat(s.id, e)}
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Console */}
          <Card className="lg:col-span-3 flex flex-col border border-border bg-card/45 backdrop-blur-md overflow-hidden max-h-full">
            <CardHeader className="border-b border-border py-2.5 px-4 bg-muted/10 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold">ChatGPT-style Campus Broker</CardTitle>
                  <CardDescription className="text-[9px]">Model: Gemini 2.5 Flash • Connected via SSE</CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Message Pane */}
            <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSession?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 text-xs max-w-[85%] group/msg',
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                    {msg.sender === 'user' ? (
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-[10px]">U</AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        'p-3 rounded-xl shadow-sm leading-relaxed border relative',
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border'
                      )}
                    >
                      <MarkdownRenderer content={msg.text} />

                      {/* Copy message button overlay */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="absolute top-2 right-2 p-1 rounded bg-muted/60 opacity-0 group-hover/msg:opacity-100 transition-opacity border border-border hover:bg-muted"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <span className={cn('text-[9px] text-muted-foreground block px-1', msg.sender === 'user' ? 'text-right' : 'text-left')}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 text-xs mr-auto max-w-[80%] items-start animate-pulse">
                  <Avatar className="h-8 w-8 ring-1 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="bg-card text-foreground border border-border p-3 rounded-xl flex items-center space-x-1.5 h-9">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce duration-600" />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce duration-600 delay-150" />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce duration-600 delay-300" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>

            {/* Suggested prompts list */}
            {activeSession?.messages.length === 1 && (
              <div className="px-4 py-2 bg-muted/10 border-t border-border flex flex-wrap gap-2 items-center">
                <span className="text-[9px] text-muted-foreground flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Quick Ask:
                </span>
                {suggestedPrompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(p.text)}
                    className="text-[9px] font-medium bg-muted border border-border hover:border-primary/45 px-2.5 py-1 rounded-lg text-foreground transition-all duration-200"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <CardFooter className="border-t border-border p-3 bg-muted/15 flex gap-2">
              <input
                type="text"
                placeholder="Type a message (e.g. 'Is CLRS available?')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
                className="flex-1 text-xs bg-muted/65 hover:bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all disabled:opacity-50"
              />
              <Button size="icon" className="h-8 w-8 shrink-0 animate-in fade-in duration-200" onClick={() => handleSend()} disabled={isTyping || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Trace Log Panel: Custom Timeline Visualization */}
          <Card className="lg:col-span-1 border border-border bg-card/65 flex flex-col overflow-hidden max-h-full">
            <CardHeader className="border-b border-border bg-muted/20 py-2.5 px-3">
              <CardTitle className="text-[10px] font-bold flex items-center uppercase tracking-wider">
                <Cpu className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Execution Trace
              </CardTitle>
              <CardDescription className="text-[9px]">Server tools executed in active context.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-3 overflow-y-auto space-y-3">
              {activeCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-2">
                  <Database className="h-6 w-6 text-muted-foreground opacity-30 mb-1.5" />
                  <p className="text-[10px] text-muted-foreground font-bold">Idle State</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">Submit a message to monitor pipeline trace parameters.</p>
                </div>
              ) : (
                <ToolExecutionTimeline calls={activeCalls} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

// -------------------------------------------------------------
// Beautiful Vertical Timeline Visualization Component
// -------------------------------------------------------------
function ToolExecutionTimeline({ calls }: { calls: ToolCall[] }) {
  return (
    <div className="relative border-l-2 border-dashed border-border/80 pl-6 ml-3 py-2 space-y-6 animate-in fade-in duration-300">
      {calls.map((call, idx) => (
        <div key={idx} className="relative group/time text-[11px] leading-relaxed">
          {/* Timeline Status Node Dot */}
          <div className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm">
            {call.status === 'running' ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            ) : call.status === 'success' ? (
              <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 flex items-center justify-center animate-in zoom-in duration-200">
                <Check className="h-2.5 w-2.5 stroke-[3.5]" />
              </div>
            ) : (
              <div className="h-4 w-4 rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20 flex items-center justify-center animate-in zoom-in duration-200">
                <span className="text-[10px] font-bold">!</span>
              </div>
            )}
          </div>

          {/* Node Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono text-[10px] truncate max-w-[120px]">
                {call.tool}
              </span>
              {call.duration && (
                <Badge variant="secondary" className="text-[8px] font-mono font-semibold py-0 px-1 border border-border/60">
                  {call.duration}ms
                </Badge>
              )}
            </div>

            {call.summary && (
              <p className="text-muted-foreground text-[10px] italic leading-tight">
                {call.summary}
              </p>
            )}

            {/* Collapsible Tool Arguments */}
            <details className="text-[9px] text-muted-foreground cursor-pointer mt-1 group/details">
              <summary className="hover:text-foreground font-medium select-none flex items-center gap-0.5">
                <span>View payload</span>
                <ChevronDown className="h-2.5 w-2.5 transition-transform duration-200 group-open/details:rotate-180" />
              </summary>
              <pre className="mt-1 bg-black/10 dark:bg-black/40 p-2 rounded border border-border/40 overflow-x-auto text-[8px] font-mono leading-normal whitespace-pre-wrap max-h-24">
                {call.args}
              </pre>
            </details>
          </div>
        </div>
      ))}

      {/* Response Generated Node at the bottom */}
      {calls.every((c) => c.status === 'success') && (
        <div className="relative group/time text-[11px] animate-in slide-in-from-top-2 duration-300">
          <div className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm">
            <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5" />
            </div>
          </div>
          <div className="space-y-0.5 pt-0.5">
            <span className="font-bold text-foreground">Response generated</span>
            <p className="text-muted-foreground text-[10px]">Unified response compiled.</p>
          </div>
        </div>
      )}
    </div>
  );
}
