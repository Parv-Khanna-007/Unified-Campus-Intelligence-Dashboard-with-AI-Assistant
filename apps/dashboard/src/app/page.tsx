'use client';

import * as React from 'react';
import {
  TrendingUp,
  Cpu,
  Zap,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

// Mock chart data
const campusActivityData = [
  { time: '08:00', students: 120, energy: 45, library: 25 },
  { time: '10:00', students: 480, energy: 85, library: 180 },
  { time: '12:00', students: 890, energy: 95, library: 240 },
  { time: '14:00', students: 750, energy: 90, library: 310 },
  { time: '16:00', students: 620, energy: 80, library: 280 },
  { time: '18:00', students: 310, energy: 60, library: 190 },
  { time: '20:00', students: 180, energy: 50, library: 95 },
];

const alertLogs = [
  { id: 1, type: 'critical', desc: 'HVAC fan malfunction in Science Block B', time: '10m ago' },
  { id: 2, type: 'warning', desc: 'Shuttle Route 3 delayed by 15 mins (traffic)', time: '30m ago' },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          {/* Welcome Section Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3.5 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-64" />
              </CardHeader>
              <CardContent className="h-[280px] flex items-end gap-3 px-6 pb-6">
                {Array.from({ length: 14 }).map((_, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${25 + (i % 3) * 20}%` }} />
                ))}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="border-destructive/10 bg-destructive/5">
                <CardHeader className="pb-3 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Overview</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Welcome back, {firstName}. Campus Intelligence operations are normal. 4 servers online.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/ai-assistant">
              <Button size="sm" className="shadow-md">
                Ask AI Assistant
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">Total Live Energy Savings</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,248 kWh</div>
              <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                <TrendingUp className="text-emerald-500 mr-1 h-3.5 w-3.5" />
                <span className="text-emerald-500 font-semibold mr-1">+14.2%</span> from last week
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">Active Campus Occupancy</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,420</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Library capacity: <span className="font-semibold text-foreground">78%</span> occupied
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary opacity-20 group-hover:opacity-40 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">AI Orchestrator Loads</CardTitle>
              <Cpu className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,842 runs</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Average latency: <span className="font-semibold text-foreground">420ms</span> • 99% accuracy
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">MCP Server Status</CardTitle>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 / 3 Online</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Campus, Academic, Facilities: <span className="font-semibold text-emerald-500">Active</span>
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            </CardContent>
          </Card>
        </div>

        {/* Charts and Alerts layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Activity Area Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Campus Dynamics Timeline</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of student activity, library visits, and energy optimization.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={campusActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" name="Active Students" />
                  <Area type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" name="Energy Optimization" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Incident Response Center & Active Alerts */}
          <div className="space-y-6">
            <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Active System Alerts
                </CardTitle>
                <CardDescription className="text-[11px] text-destructive/80">
                  Critical systems requiring administrative attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertLogs.map((alert) => (
                  <div key={alert.id} className="flex justify-between items-start gap-2 p-2.5 rounded-lg bg-card border border-destructive/25 text-xs">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-[11px]">{alert.desc}</p>
                      <span className="text-[10px] text-muted-foreground block mt-1">{alert.time}</span>
                    </div>
                    <Badge variant={alert.type === 'critical' ? 'destructive' : 'warning'} className="text-[9px] px-1.5 py-0">
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Quick Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Science Block HVAC
                  </span>
                  <Badge variant="warning">Alert State</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" /> Main Gate Counter
                  </span>
                  <Badge variant="success">980/s load</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" /> LLM API Latency
                  </span>
                  <Badge variant="secondary">380ms</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Secondary Info Layout: Bar Chart + Operations Logs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Energy usage by Facility Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Resource Optimization By Sector</CardTitle>
              <CardDescription className="text-xs">Saved energy block distribution via smart scheduler.</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Library', saved: 320, loss: 45 },
                  { name: 'Hostels', saved: 480, loss: 110 },
                  { name: 'Sci Labs', saved: 250, loss: 80 },
                  { name: 'Auditorium', saved: 190, loss: 20 },
                  { name: 'Sports', saved: 120, loss: 30 },
                ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="saved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Saved (kWh)" />
                  <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} name="Loss (kWh)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Operations Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Recent Orchestrator Activity</CardTitle>
              <CardDescription className="text-xs">Live executions logs from AI agents and MCP tools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: '11:42 AM', title: 'Route Scheduling Correction', desc: 'AI rescheduled Shuttle 3 via Shuttle-MCP to bypass traffic bottleneck.', code: 'Shuttle-MCP::rescheduleRoute' },
                { time: '11:25 AM', title: 'HVAC Duty Cycle Update', desc: 'Set Science Block HVAC to eco-conservation state based on classroom usage metrics.', code: 'Facilities-MCP::setEcoMode' },
                { time: '10:50 AM', title: 'Class Register Snapshot', desc: 'Prof jane synced CS101 lecture sheet and extracted attendance anomaly warnings.', code: 'Academic-MCP::syncAttendance' },
              ].map((log, index) => (
                <div key={index} className="flex items-start justify-between border-b border-border pb-3 last:border-b-0 last:pb-0 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{log.title}</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">{log.desc}</p>
                    <span className="text-[10px] text-primary font-mono mt-1 block">{log.code}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{log.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
