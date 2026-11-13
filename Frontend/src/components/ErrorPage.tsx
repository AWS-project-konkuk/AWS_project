import { Link } from 'react-router';
import { Button } from './ui/button';

const descriptions = {
  400: '요청 형식이 올바르지 않습니다.',
  401: '로그인이 필요합니다.',
  403: '이 페이지에 접근할 권한이 없습니다.',
  404: '페이지를 찾을 수 없습니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '화면을 불러오는 중 문제가 발생했습니다.',
  502: '서버에서 올바른 응답을 받지 못했습니다.',
  503: '서비스를 일시적으로 이용할 수 없습니다.',
  504: '서버 응답 시간이 초과되었습니다.',
};

type ErrorPageProps = {
  code: keyof typeof descriptions;
  description?: string;
  onRetry?: () => void;
};

export function ErrorPage({ code, description = descriptions[code], onRetry }: ErrorPageProps) {
  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-[clamp(4rem,12vh,8rem)] pb-12 text-center">
      <div role={onRetry ? 'alert' : undefined}>
        <h1 className="m-0 text-5xl leading-none font-bold tracking-tight text-ui-accent">
          {code}
        </h1>
        <p className="mt-4 mb-6 text-base break-keep text-ui-ink-2">{description}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry}>다시 시도</Button>
      ) : (
        <Button asChild className="no-underline">
          <Link to="/learn">학습 과정으로 돌아가기</Link>
        </Button>
      )}
    </main>
  );
}
