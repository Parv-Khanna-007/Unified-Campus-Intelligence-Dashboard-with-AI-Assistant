'use client';

import * as React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  FileText,
  Filter,
  HardDrive,
  MessageSquare,
  RefreshCw,
  Search,
  Server,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Mock telemetry data representing queries, active users, and latency over last 24h
const queriesAndLatencyTimeline = [
  { time: '00:00', queries: 25, activeUsers: 12, latency: 195 },
  { time: '02:00', queries: 14, activeUsers: 8, latency: 180 },
  { time: '04:00', queries: 8, activeUsers: 5, latency: 175 },
  { time: '06:00', queries: 18, activeUsers: 10, latency: 190 },
  { time: '08:00', queries: 65, activeUsers: 34, latency: 220 },
  { time: '10:00', queries: 145, activeUsers: 82, latency: 250 },
  { time: '12:00', queries: 198, activeUsers: 110, latency: 275 },
  { time: '14:00', queries: 162, activeUsers: 95, latency: 260 },
  { time: '16:00', queries: 180, activeUsers: 105, latency: 265 },
  { time: '18:00', queries: 115, activeUsers: 72, latency: 235 },
  { time: '20:00', queries: 95, activeUsers: 58, latency: 220 },
  { time: '22:00', queries: 54, activeUsers: 28, latency: 210 },
];

// Mock data representing usage of each MCP server node
const mcpServerUsage = [
  { name: 'Library MCP', Success: 452, Failures: 3, total: 455 },
  { name: 'Cafeteria MCP', Success: 384, Failures: 0, total: 384 },
  { name: 'Events MCP', Success: 298, Failures: 5, total: 303 },
  { name: 'Academics MCP', Success: 212, Failures: 1, total: 213 },
];

// Mock data representing the most requested resources on campus
const mostRequestedResources = [
  { name: 'CLRS Algorithms Book', value: 320, category: 'Library' },
  { name: 'Dining Hall Today Menu', value: 284, category: 'Cafeteria' },
  { name: 'CS101 Course Details', value: 195, category: 'Academics' },
  { name: 'Campus Hackathon Details', value: 165, category: 'Events' },
  { name: 'SICP Programming Book', value: 92, category: 'Library' },
  { name: 'Dr. Sarah Jenkins Profile', value: 85, category: 'Academics' },
];

// HSL theme coordinated colors for charts
const COLORS = [
  'hsl(var(--primary))',  // Purple/Indigo Accent
  '#10b981',              // Emerald
  '#3b82f6',              // Blue
  '#f59e0b',              // Amber
  '#8b5cf6',              // Violet
  '#ec4899',              // Pink
];

// Mock latency trends breakdown over the week
const mcpLatencyBreakdown = [
  { day: 'Mon', Library: 42, Cafeteria: 28, Events: 48, Academics: 51, Orchestration: 110 },
  { day: 'Tue', Library: 45, Cafeteria: 31, Events: 52, Academics: 55, Orchestration: 120 },
  { day: 'Wed', Library: 48, Cafeteria: 35, Events: 58, Academics: 60, Orchestration: 135 },
  { day: 'Thu', Library: 44, Cafeteria: 30, Events: 50, Academics: 56, Orchestration: 125 },
  { day: 'Fri', Library: 43, Cafeteria: 29, Events: 49, Academics: 54, Orchestration: 120 },
  { day: 'Sat', Library: 40, Cafeteria: 28, Events: 45, Academics: 50, Orchestration: 95 },
  { day: 'Sun', Library: 41, Cafeteria: 28, Events: 46, Academics: 52, Orchestration: 105 },
];

interface MCPServerCardProps {
  name: string;
  port: number;
  status: 'online' | 'offline';
  latency: number;
  uptime: string;
  memory: string;
  cpu: string;
  tools: string[];
}

function MCPServerCard({
  name,
  port,
  status,
  latency,
  uptime,
  memory,
  cpu,
  tools,
}: MCPServerCardProps) {
  return (
    <Card className="overflow-hidden border border-border/80 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      <CardHeader className="p-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-card border border-border">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">{name}</h4>
              <p className="text-[10px] text-muted-foreground font-mono">Port {port} • /mcp/sse</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 font-bold uppercase">
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded bg-muted/40 border border-border/40">
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Avg Latency</span>
            <span className="font-bold text-foreground font-mono text-xs">{latency}ms</span>
          </div>
          <div className="p-2 rounded bg-muted/40 border border-border/40">
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Uptime</span>
            <span className="font-bold text-foreground font-mono text-xs">{uptime}</span>
          </div>
          <div className="p-2 rounded bg-muted/40 border border-border/40">
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Memory</span>
            <span className="font-bold text-foreground font-mono text-xs">{memory}</span>
          </div>
          <div className="p-2 rounded bg-muted/40 border border-border/40">
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">CPU usage</span>
            <span className="font-bold text-foreground font-mono text-xs">{cpu}</span>
          </div>
        </div>

        <div>
          <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block mb-1.5">Registered Tools ({tools.length})</span>
          <div className="flex flex-wrap gap-1">
            {tools.map(tool => (
              <code key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono border border-border text-foreground/80">
                {tool}
              </code>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 850);
  };

  if (loading || isRefreshing) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>

          {/* Cards Stats Skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Skeletons */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3.5 w-64" />
                </CardHeader>
                <CardContent className="h-[280px] flex items-end gap-2 px-6 pb-6">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <Skeleton key={idx} className="w-full" style={{ height: `${30 + (idx % 4) * 15}%` }} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cluster Status Skeletons */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-56" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <div className="flex gap-1">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Page title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" /> AI & MCP Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Performance auditing dashboard for query counts, model invocation response times, and model context protocol server health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-8 px-2 sm:px-3">
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-2 sm:px-3">
              <Download className="h-3.5 w-3.5 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Aggregated indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Queries</span>
                <p className="text-2xl font-bold mt-1 font-mono">1,248</p>
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +15.4% vs last week
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Latency</span>
                <p className="text-2xl font-bold mt-1 font-mono">218 ms</p>
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-0.5" /> -24ms latency reduction
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Sessions</span>
                <p className="text-2xl font-bold mt-1 font-mono">142</p>
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +8.2% concurrent users
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Users className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tool Success Rate</span>
                <p className="text-2xl font-bold mt-1 font-mono">99.3%</p>
                <span className="text-[9px] text-muted-foreground font-semibold flex items-center mt-1">
                  9 tool errors in 24 hours
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Query Throughput and Latency Timeline */}
          <Card className="border-border/60 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" /> Query Volume & Network Latency
              </CardTitle>
              <CardDescription className="text-xs">
                Hourly log profile correlating client queries with orchestrator end-to-end response latency.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={queriesAndLatencyTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Queries Count', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--primary))', fontSize: '9px', fontWeight: 'bold' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: '9px', fontWeight: 'bold' } }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="queries" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} name="Queries Invoked" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} name="Avg Response Latency (ms)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* MCP Server Call Frequency and success rate */}
          <Card className="border-border/60 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Database className="h-4 w-4 text-primary" /> MCP Server Usage Frequency
              </CardTitle>
              <CardDescription className="text-xs">
                Total API tool calls completed successfully vs failed executions per FastAPI node.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mcpServerUsage} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Success" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Successful Queries" stackId="a" />
                  <Bar dataKey="Failures" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Failed Invocation Errors" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Most Requested Resources - Pie Chart */}
          <Card className="border-border/60 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Most Requested Campus Resources
              </CardTitle>
              <CardDescription className="text-xs">
                Top database search objects extracted from semantic AI parsing and tools call routing.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-[50%] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mostRequestedResources}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mostRequestedResources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        fontSize: '11px',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-[50%] space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Resource Breakdown</span>
                <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {mostRequestedResources.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate font-semibold text-foreground/80">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[9px] ml-2 shrink-0">{item.value} hits</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed latency breakdown stacked area chart */}
          <Card className="border-border/60 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Latency Breakdown Profile (ms)
              </CardTitle>
              <CardDescription className="text-xs">
                Weekly latency overhead (FastAPI query time vs Express LLM orchestration routing).
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mcpLatencyBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyLib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="latencyCafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="latencyOrch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Library" stroke="hsl(var(--primary))" strokeWidth={1.5} fillOpacity={1} fill="url(#latencyLib)" name="Library Node" stackId="1" />
                  <Area type="monotone" dataKey="Cafeteria" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#latencyCafe)" name="Cafeteria Node" stackId="1" />
                  <Area type="monotone" dataKey="Orchestration" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#latencyOrch)" name="LLM / Router Overhead" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* MCP Server Health Indicators Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">MCP Node Clusters Health status</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MCPServerCard
              name="Library MCP"
              port={8001}
              status="online"
              latency={42}
              uptime="12d 4h"
              memory="15.8 MB"
              cpu="0.4%"
              tools={['search_book', 'get_book_details', 'check_availability']}
            />
            <MCPServerCard
              name="Cafeteria MCP"
              port={8002}
              status="online"
              latency={29}
              uptime="12d 4h"
              memory="14.2 MB"
              cpu="0.2%"
              tools={['get_today_menu', 'get_weekly_menu']}
            />
            <MCPServerCard
              name="Events MCP"
              port={8003}
              status="online"
              latency={48}
              uptime="12d 4h"
              memory="16.5 MB"
              cpu="0.5%"
              tools={['get_upcoming_events', 'search_event']}
            />
            <MCPServerCard
              name="Academics MCP"
              port={8004}
              status="online"
              latency={54}
              uptime="12d 4h"
              memory="17.1 MB"
              cpu="0.6%"
              tools={['search_course', 'get_course_details', 'search_faculty']}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
