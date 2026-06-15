'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Lock, User, ShieldAlert, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<'student' | 'admin'>('student');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('http://localhost:3010/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Authentication failed.');
      }

      const data = await res.json();
      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection issue. Ensure Orchestrator is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrefill = (role: 'student' | 'admin') => {
    setSelectedRole(role);
    setUsername(role);
    setPassword(role);
    setErrorMsg(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-medium">
        Loading secure credentials...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black p-4 relative overflow-hidden">
      {/* Dynamic ambient shapes */}
      <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 bg-card/30 backdrop-blur-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        {/* Top styling accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Campus Intelligence</CardTitle>
          <CardDescription className="text-xs">
            Authenticate to audit campus resources, schedule events, or query the policy knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg flex items-center gap-2 text-[11px] font-semibold animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Role selection tab row */}
          <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/60">
            {(['student', 'admin'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handlePrefill(role)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                  selectedRole === role
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {role === 'student' ? 'Student Portal' : 'Admin Console'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/70">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder={`Enter username e.g. '${selectedRole}'`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/40 hover:bg-muted/60 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background text-xs transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/70">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/40 hover:bg-muted/60 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background text-xs transition-all"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-4 font-bold shadow-md">
              {isSubmitting ? (
                'Verifying Secure Token...'
              ) : (
                <>
                  Enter Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Prefill helper badges */}
          <div className="pt-3 border-t border-border/50 text-center">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block mb-2">Pre-configured Accounts</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handlePrefill('student')}
                className="px-2 py-1 text-[9px] font-bold rounded border border-border bg-card/60 hover:bg-muted transition-colors text-foreground"
              >
                Student Pre-fill
              </button>
              <button
                onClick={() => handlePrefill('admin')}
                className="px-2 py-1 text-[9px] font-bold rounded border border-border bg-card/60 hover:bg-muted transition-colors text-foreground"
              >
                Admin Pre-fill
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
