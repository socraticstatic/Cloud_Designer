// App-level error boundary. A render exception anywhere in the designer
// shows a recoverable Flywheel-styled fallback instead of a blank page.
// "Reset designer data" clears browser-cached state for the cases where
// corrupted persisted data is what keeps crashing the render.

import { Component, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  private resetData = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('cloud-designer:') || k === 'savedTopologies')
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <AlertOctagon className="h-10 w-10 text-fw-error mx-auto" />
          <h2 className="mt-4 text-lg font-bold text-fw-heading">Something broke in the designer</h2>
          <p className="mt-2 text-sm text-fw-bodyLight">
            {this.state.error.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button
              onClick={this.resetData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border border-fw-border-error text-fw-error hover:bg-fw-error-bg transition-colors"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Reset designer data
            </button>
          </div>
          <p className="mt-4 text-[11px] text-fw-disabled">
            Reset clears browser-cached designs - use it if reloading keeps failing.
          </p>
        </div>
      </div>
    );
  }
}
