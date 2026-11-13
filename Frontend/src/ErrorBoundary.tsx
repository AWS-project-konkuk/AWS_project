import { Component, type ReactNode } from 'react';
import { ErrorPage } from './components/ErrorPage';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <ErrorPage code={500} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
