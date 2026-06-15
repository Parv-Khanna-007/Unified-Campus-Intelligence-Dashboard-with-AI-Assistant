'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Error Boundary Caught Exception]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Hard refresh to clear memory state and re-initialize layout
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-destructive/20 bg-card/65 backdrop-blur-xl p-8 text-center shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4 animate-bounce">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Restoration Panel</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            A rendering crash was caught by the enterprise boundary. The layout failed to mount safely.
            {this.state.error && (
              <span className="block mt-3 font-mono text-xs text-destructive bg-destructive/5 p-3 rounded border border-destructive/15 text-left overflow-auto max-h-32 select-text">
                {this.state.error.message}
              </span>
            )}
          </p>
          <Button onClick={this.handleReset} variant="outline" className="flex items-center gap-2 border-primary/20 hover:border-primary/50 text-foreground transition-all duration-200">
            <RefreshCw className="h-4 w-4 animate-spin-slow" /> Reset Layout
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
