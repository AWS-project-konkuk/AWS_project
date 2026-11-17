import { Button } from './ui/button';

const descriptions: Partial<Record<number, string>> = {
  400: '요청 형식이 올바르지 않습니다.',
  401: '로그인이 필요합니다.',
  403: '이 페이지에 접근할 권한이 없습니다.',
  404: '페이지를 찾을 수 없습니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버에서 요청을 처리하는 중 문제가 발생했습니다.',
  502: '서버에서 올바른 응답을 받지 못했습니다.',
  503: '서비스를 일시적으로 이용할 수 없습니다.',
  504: '서버 응답 시간이 초과되었습니다.',
};

type ErrorPageProps = {
  code: number;
  description?: string;
  onRetry?: () => void;
};

export function ErrorPage({
  code,
  description = descriptions[code] ?? '요청을 처리하지 못했습니다.',
  onRetry,
}: ErrorPageProps) {
  return (
    <main className="grid min-h-[55svh] place-items-center px-5 py-10 text-center">
      <section className="w-full max-w-md rounded-lg border border-solid border-ui-rule-2 bg-ui-paper px-6 py-9 sm:py-12">
        <div role={onRetry ? 'alert' : undefined}>
          <h1 className="m-0 text-[clamp(3.5rem,10vw,5.5rem)] leading-none font-bold tracking-tight text-ui-accent">
            {code}
          </h1>
          <p className="mt-4 mb-6 text-lg leading-snug font-semibold break-keep text-ui-ink">
            {description}
          </p>
        </div>
        {onRetry ? (
          <Button variant="default" onClick={onRetry}>
            다시 시도
          </Button>
        ) : (
          <Button asChild variant="default" className="no-underline">
            <a href="#/learn">학습 과정으로 돌아가기</a>
          </Button>
        )}
      </section>
    </main>
  );
}
