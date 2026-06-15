'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/app/providers';
import {
  LayoutDashboard,
  MessageSquareCode,
  Activity,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Bell,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Shield,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const baseNavigation: SidebarItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquareCode },
  { name: 'MCP Monitor', href: '/mcp-monitor', icon: Cpu },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-medium">
        Verifying secure access session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Construct dynamic navigation list
  const navigation = [...baseNavigation];
  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Console', href: '/admin', icon: Shield });
  }

  const systemStatus = {
    status: 'Operational',
    badge: 'success' as const,
    serversOnline: 3,
    totalServers: 3,
  };

  const mockNotifications = [
    { id: 1, title: 'MCP Academic Server Restored', desc: 'Latency stabilized at 12ms.', time: '5m ago', type: 'info' },
    { id: 2, title: 'AI Assistant Token Usage Peak', desc: '92% threshold reached in class analysis.', time: '1h ago', type: 'warning' },
    { id: 3, title: 'Shuttle Tracker MCP Configured', desc: 'New tools added: getBusLocation.', time: '3h ago', type: 'success' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card/45 backdrop-blur-xl z-20">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo / Header */}
          <div className="flex items-center flex-shrink-0 px-6 space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-md font-bold tracking-tight text-foreground">
              Campus<span className="text-primary font-black">Intel</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              <AvatarImage src={user?.role === 'admin' ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt="User" />
              <AvatarFallback>{user?.role === 'admin' ? 'AD' : 'ST'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role || 'Student'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/70 backdrop-blur-md px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Title or Breadcrumb */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Campus Intelligence Console</span>
            <span>/</span>
            <span className="capitalize">{pathname === '/' ? 'Overview' : pathname.replace('/', '').replace('-', ' ')}</span>
          </div>

          {/* Center Search bar */}
          <div className="flex-1 max-w-md mx-auto relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports, servers, student records..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-muted/65 hover:bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center space-x-2 border border-border/80 bg-muted/30 rounded-lg px-2.5 py-1 text-xs">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                MCP Core: <span className="text-emerald-500 font-semibold">{systemStatus.status}</span>
              </span>
            </div>

            {/* Notifications Trigger */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-primary" />
              </Button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="font-semibold text-xs">Alert Center</span>
                      <Button variant="link" size="sm" className="text-[10px] p-0 h-auto">Mark all read</Button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {mockNotifications.map((n) => (
                        <div key={n.id} className="flex gap-2 text-xs hover:bg-muted/30 p-1 rounded-lg transition-colors">
                          <div className="mt-0.5">
                            {n.type === 'warning' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[11px] text-foreground">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{n.desc}</p>
                            <span className="text-[9px] text-muted-foreground mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {/* Profile Menu for Mobile */}
            <Avatar className="h-8 w-8 ring-1 ring-border md:hidden">
              <AvatarImage src={user?.role === 'admin' ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt="User" />
              <AvatarFallback>{user?.role === 'admin' ? 'AD' : 'ST'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Mobile Navigation Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

            {/* Drawer */}
            <div className="relative flex w-full max-w-xs flex-col bg-card p-6 border-r border-border shadow-2xl animate-in slide-in-from-left duration-250">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="text-md font-bold tracking-tight text-foreground">CampusIntel</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-8 flex-1 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="border-t border-border pt-4 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar className="h-9 w-9 ring-1 ring-border">
                    <AvatarImage src={user?.role === 'admin' ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt="User" />
                    <AvatarFallback>{user?.role === 'admin' ? 'AD' : 'ST'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role || 'Student'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Children */}
        <main className="flex-1 overflow-y-auto bg-background/20">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
