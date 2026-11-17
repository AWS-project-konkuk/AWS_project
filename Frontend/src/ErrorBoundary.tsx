import { Component, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { ErrorPage } from './components/ErrorPage';

interface ErrorState {
  code: number | null;
  description?: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorState> {
  state: ErrorState = { code: null };

  static getDerivedStateFromError(error: unknown): ErrorState {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status && status >= 400 && status <= 599) return { code: status };
    return { code: 500, description: '화면을 불러오는 중 문제가 발생했습니다.' };
  }

  render() {
    if (this.state.code !== null) {
      return (
        <ErrorPage
          code={this.state.code}
          description={this.state.description}
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
