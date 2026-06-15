'use client';

import * as React from 'react';
import { useAuth } from '@/app/providers';
import {
  User,
  Sliders,
  Cpu,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface MCPEndpoint {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'testing';
  latency?: number;
}

export default function SettingsPage() {
  const { user } = useAuth();

  const [profile, setProfile] = React.useState({
    name: user?.name || 'Jane Doe',
    email: user?.username === 'admin' ? 'admin@university.edu' : 'student@university.edu',
    role: user?.role === 'admin' ? 'Administrator • IT Center' : 'Student • Campus Portal',
  });

  const [aiConfig, setAiConfig] = React.useState({
    model: 'Gemini 2.5 Flash',
    apiKey: '••••••••••••••••••••••••',
    temperature: 0.2,
    enableOrchestrator: true,
  });

  const [endpoints, setEndpoints] = React.useState<MCPEndpoint[]>([
    { id: '1', name: 'Library MCP', url: 'http://localhost:8001/mcp/sse', status: 'active', latency: 42 },
    { id: '2', name: 'Cafeteria MCP', url: 'http://localhost:8002/mcp/sse', status: 'active', latency: 29 },
    { id: '3', name: 'Events MCP', url: 'http://localhost:8003/mcp/sse', status: 'active', latency: 48 },
    { id: '4', name: 'Academics MCP', url: 'http://localhost:8004/mcp/sse', status: 'active', latency: 54 },
  ]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const handleTestConnection = (id: string) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'testing' as const } : e))
    );

    setTimeout(() => {
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: 'active' as const,
                latency: Math.floor(Math.random() * 20) + 25,
              }
            : e
        )
      );
    }, 1200);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your profile, AI parameters, and registered MCP server endpoints.
          </p>
        </div>

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center space-x-3 border-b border-border/80 pb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold">Profile Administration</CardTitle>
                <CardDescription className="text-[10px]">Update administrative identity and email coordinates.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground text-[10px] uppercase">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/65 hover:bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground text-[10px] uppercase">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/65 hover:bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <label className="font-semibold text-muted-foreground text-[10px] uppercase">Administrative Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled={true}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center space-x-3 border-b border-border/80 pb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold">AI Orchestration & LLM Settings</CardTitle>
                <CardDescription className="text-[10px]">Customize model selection and API integration scopes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground text-[10px] uppercase">LLM Model Service</label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/65 hover:bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                  >
                    <option>Gemini 2.5 Flash</option>
                    <option>Gemini 2.5 Pro</option>
                    <option>Gemini 3.5 Flash</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground text-[10px] uppercase">Gemini API Key</label>
                  <input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/65 hover:bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all font-mono"
                  />
                </div>
              </div>

              {/* Slider & Switch options */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center max-w-md">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground text-[11px]">Temperature</span>
                    <p className="text-[10px] text-muted-foreground">Controls randomness: lower is more deterministic.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiConfig.temperature}
                      onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                      className="w-24 cursor-pointer accent-primary"
                    />
                    <span className="font-mono font-bold w-6 text-right">{aiConfig.temperature}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center max-w-md pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground text-[11px]">Enable AI Agent Router</span>
                    <p className="text-[10px] text-muted-foreground">Allows AI to dynamically call MCP servers without prompting.</p>
                  </div>
                  <Switch
                    checked={aiConfig.enableOrchestrator}
                    onCheckedChange={(val) => setAiConfig({ ...aiConfig, enableOrchestrator: val })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MCP Host Registry */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center space-x-3 border-b border-border/80 pb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold">MCP Server Endpoints</CardTitle>
                <CardDescription className="text-[10px]">Configure socket connection paths for MCP resource brokers.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-xs">
              {endpoints.map((ep) => (
                <div key={ep.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-border p-3 rounded-lg bg-muted/10 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-foreground font-mono">{ep.name}</span>
                      <Badge variant={ep.status === 'active' ? 'success' : ep.status === 'testing' ? 'warning' : 'destructive'} className="text-[8px] px-1 py-0 uppercase">
                        {ep.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono block">{ep.url}</span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {ep.status === 'active' && ep.latency && (
                      <span className="text-[10px] text-muted-foreground">
                        Latency: <strong className="text-foreground">{ep.latency}ms</strong>
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(ep.id)}
                      disabled={ep.status === 'testing'}
                      className="h-8 text-[10px]"
                    >
                      {ep.status === 'testing' ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Testing
                        </>
                      ) : (
                        'Test Link'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            {showToast && (
              <div className="flex items-center text-xs text-emerald-500 font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Changes saved successfully!
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="shadow-md">
            <Save className="h-3.5 w-3.5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
