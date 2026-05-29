import { Icon } from '@iconify/react';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center max-w-md">
            <Icon
              icon="lucide:triangle-alert"
              className="mx-auto h-10 w-10 text-destructive"
            />
            <h2 className="mt-4 text-lg font-semibold">页面出错了</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error.message || '渲染时发生未知错误'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Icon icon="lucide:refresh-cw" className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
