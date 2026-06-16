'use client';

import * as React from 'react';
import {
  Cpu,
  Server,
  Activity,
  Search,
  Code2,
  Terminal,
  Play,
  RotateCw,
  PlusCircle,
  Database,
  HelpCircle,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  latency: number;
  uptime: string;
  toolsCount: number;
  latencyHistory: { ms: number }[];
  tools: {
    name: string;
    desc: string;
    schema: string;
  }[];
}

const initialServers: MCPServer[] = [
  {
    id: '1',
    name: 'Campus Operations MCP',
    url: '',
    status: 'online',
    latency: 12,
    uptime: '99.98%',
    toolsCount: 3,
    latencyHistory: [{ ms: 10 }, { ms: 14 }, { ms: 11 }, { ms: 15 }, { ms: 12 }, { ms: 13 }, { ms: 12 }],
    tools: [
      { name: 'getShuttleLocations', desc: 'Retrieve GPS coordinates and routes of all active shuttles.', schema: '{"routeId?: string"}' },
      { name: 'getFacilityStatus', desc: 'Fetch occupancy count and operational metrics for campus facilities.', schema: '{"facilityId: string"}' },
      { name: 'triggerIncidentReport', desc: 'Create a new maintenance or security ticket.', schema: '{"category: string, desc: string, block: string"}' },
    ],
  },
  {
    id: '2',
    name: 'Academic Registrar MCP',
    url: '',
    status: 'online',
    latency: 8,
    uptime: '99.95%',
    toolsCount: 2,
    latencyHistory: [{ ms: 8 }, { ms: 7 }, { ms: 9 }, { ms: 8 }, { ms: 6 }, { ms: 8 }, { ms: 8 }],
    tools: [
      { name: 'getGradesAnalysis', desc: 'Find grade anomalies and students performing below a specific grade threshold.', schema: '{"classId: string, threshold: number"}' },
      { name: 'syncAttendance', desc: 'Synchronize lecture attendance log for a class.', schema: '{"classId: string, date: string"}' },
    ],
  },
  {
    id: '3',
    name: 'Facilities Telemetry MCP',
    url: '',
    status: 'online',
    latency: 19,
    uptime: '99.99%',
    toolsCount: 2,
    latencyHistory: [{ ms: 15 }, { ms: 22 }, { ms: 18 }, { ms: 24 }, { ms: 19 }, { ms: 20 }, { ms: 19 }],
    tools: [
      { name: 'getEnergyTelemetry', desc: 'Extract energy usage in kWh and carbon offsets from smart meters.', schema: '{"block: string, duration: string"}' },
      { name: 'setEcoMode', desc: 'Enable energy-saving duty cycles on climate blocks.', schema: '{"block: string, state: boolean"}' },
    ],
  },
  {
    id: '4',
    name: 'Library Systems MCP',
    url: '',
    status: 'online',
    latency: 7,
    uptime: '94.22%',
    toolsCount: 1,
    latencyHistory: [{ ms: 17 }, { ms: 21 }, { ms: 15 }, { ms: 24 }, { ms: 19 }, { ms: 20 }, { ms: 25 }],
    tools: [
      { name: 'getOccupancyCounter', desc: 'Query live student turnaround data from Turnstile APIs.', schema: '{"gateId: string"}' },
    ],
  },
];

const mockLogs = [
  { time: '11:58:24 AM', server: 'Campus-MCP', text: 'Binding tool getShuttleLocations successfully.' },
  { time: '11:59:10 AM', server: 'Academic-MCP', text: 'Executing getGradesAnalysis for CS101... returned 2 items.' },
  { time: '12:00:00 PM', server: 'System', text: 'Core Connection established. Protocol: MCP v1.0.4.' },
  { time: '12:01:45 PM', server: 'Facilities-MCP', text: 'Telemetry sync completed for Science Block B. Latency: 19ms.' },
];

export default function MCPMonitorPage() {
  const [servers, setServers] = React.useState<MCPServer[]>(initialServers);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedServer, setSelectedServer] = React.useState<MCPServer | null>(initialServers[0]);
  const [logs, setLogs] = React.useState(mockLogs);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          latency: s.status === 'online' ? Math.floor(Math.random() * 15) + 5 : 0,
        }))
      );
      setLogs((l) => [
        {
          time: new Date().toLocaleTimeString(),
          server: 'System',
          text: 'Triggered global diagnostic refresh across all registered schemas.',
        },
        ...l,
      ]);
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredTools = selectedServer?.tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">MCP Monitor</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure and trace Model Context Protocol connections.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RotateCw className={cn('h-3.5 w-3.5 mr-2', isRefreshing && 'animate-spin')} />
              Sync Status
            </Button>
            <Button size="sm">
              <PlusCircle className="h-3.5 w-3.5 mr-2" />
              Register Server
            </Button>
          </div>
        </div>

        {/* Server Diagnostic Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servers.map((s) => (
            <Card
              key={s.id}
              onClick={() => setSelectedServer(s)}
              className={cn(
                'cursor-pointer border transition-all duration-200 hover:shadow-md',
                selectedServer?.id === s.id
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Server className={cn('h-4 w-4', s.status === 'online' ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <Badge variant={s.status === 'online' ? 'success' : 'destructive'} className="text-[8px] px-1 py-0 uppercase">
                    {s.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Latency: <strong className="text-foreground">{s.status === 'online' ? `${s.latency}ms` : 'N/A'}</strong></span>
                  <span>Uptime: <strong className="text-foreground">{s.uptime}</strong></span>
                </div>

                {/* Micro Sparkline */}
                {s.status === 'online' && (
                  <div className="h-8 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={s.latencyHistory}>
                        <Line type="monotone" dataKey="ms" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Details and Tools Inspector */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Server Config & Tools List */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-bold">{selectedServer?.name}</CardTitle>
                  <CardDescription className="text-xs font-mono text-muted-foreground mt-0.5">{selectedServer?.url}</CardDescription>
                </div>
                <Badge variant={selectedServer?.status === 'online' ? 'success' : 'destructive'} className="uppercase">
                  {selectedServer?.status}
                </Badge>
              </div>

              {/* Tool search bar */}
              {selectedServer?.status === 'online' && (
                <div className="relative mt-4">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter registered tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-grow p-4 space-y-4">
              {selectedServer?.status === 'offline' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="h-10 w-10 text-muted-foreground opacity-30 mb-2" />
                  <p className="text-xs font-bold text-foreground">Server Offline</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                    Verify host network availability, local port configurations, and try reloading the connection.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Registered Bindings ({filteredTools?.length || 0})
                  </span>
                  {filteredTools?.map((tool, tIdx) => (
                    <div key={tIdx} className="border border-border rounded-lg p-3 bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Code2 className="h-3.5 w-3.5 text-primary" />
                          <span className="font-bold text-foreground font-mono">{tool.name}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{tool.desc}</p>
                      </div>

                      {/* Argument Schema preview */}
                      <div className="bg-black/10 dark:bg-black/40 p-2 rounded border border-border/40 font-mono text-[10px] min-w-[140px] text-muted-foreground max-w-[200px] truncate">
                        <div className="flex justify-between items-center pb-1 border-b border-border/30 mb-1 text-[8px] font-semibold uppercase">
                          <span>args schema</span>
                          <HelpCircle className="h-2.5 w-2.5" />
                        </div>
                        {tool.schema}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logging Terminal */}
          <Card className="flex flex-col border border-border bg-card/65">
            <CardHeader className="border-b border-border pb-3 bg-muted/10">
              <CardTitle className="text-xs font-bold flex items-center">
                <Terminal className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Live MCP Transaction Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 font-mono text-[10px] bg-black/5 dark:bg-black/30 text-muted-foreground overflow-y-auto space-y-2 h-[350px]">
              {logs.map((log, lIdx) => (
                <div key={lIdx} className="space-y-0.5 border-b border-border/20 pb-1.5 last:border-b-0">
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="text-primary font-bold">{log.server}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{log.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
