import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private handleGlobalError = (event: ErrorEvent) => {
    event.preventDefault();
    this.setState({ hasError: true, error: event.error || new Error(event.message) });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.setState({ hasError: true, error });
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "An unexpected error occurred.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            message = parsed.error;
          }
        } else {
           message = this.state.error?.message || message;
        }
      } catch (e) {
        message = this.state.error?.message || message;
      }
      
      // Specially handle unhelpful "Failed to fetch"
      if (message === 'Failed to fetch') {
         message = "Unable to connect. Please check your internet connection or third-party adblockers. If the problem persists, Firebase config or the Bible API may be unreachable.";
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-background)] text-[var(--color-text)]">
          <div className="glass-card p-8 rounded-2xl max-w-lg w-full text-center space-y-4 border border-[var(--color-border-subtle)]">
            <h2 className="text-2xl font-bold text-red-500">Something went wrong</h2>
            <p className="text-[var(--color-text-muted)]">{message}</p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95"
              >
                Dismiss
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[var(--color-text)]/10 text-[var(--color-text)] font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

