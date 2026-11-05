import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="recovery" role="alert">
          <h1>학습실을 다시 열어주세요</h1>
          <p>화면 처리 중 문제가 발생했습니다. 브라우저에 저장된 구성은 유지됩니다.</p>
          <button onClick={() => window.location.reload()}>저장된 구성으로 다시 열기</button>
        </main>
      );
    }
    return this.props.children;
  }
}
