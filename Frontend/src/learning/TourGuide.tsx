import { useState } from 'react';
import { Joyride, type Step } from 'react-joyride';
import { usePreferences } from '../settings/preferences';
export function TourGuide({
  prepare,
  workflow = false,
}: {
  prepare: () => void;
  workflow?: boolean;
}) {
  const tour = usePreferences((s) => s.tour),
    setTour = usePreferences((s) => s.setTour);
  const [run, setRun] = useState(tour === 'new'),
    [generation, setGeneration] = useState(0);
  const targets: [string, string, string][] = [
    [
      '[aria-controls="course-sidebar"]',
      '학습 목차',
      '분야별로 나뉜 짧은 학습을 원하는 순서로 살펴보세요.',
    ],
    [
      '[data-testid="lesson-reading"] h1',
      '학습 영역',
      '설명을 읽다가 본문 중간의 활동을 직접 조작해 보세요.',
    ],
    [
      '[aria-label="전체 워크플로우 지도"]',
      '전체 흐름',
      '현재 개념이 데이터·학습·추론·운영의 어디에 연결되는지 확인하세요.',
    ],
    ...(workflow
      ? []
      : ([
          [
            '[aria-label="이해 확인"]',
            '이해 확인',
            '상황에 맞는 판단을 고르고 해설과 비교하세요. 선택 활동은 완료 필수가 아닙니다.',
          ],
        ] as [string, string, string][])),
  ];
  const steps: Step[] = targets.map(([target, title, content]) => ({
    target,
    title,
    content,
    placement: 'auto',
    before: async () => {
      document.querySelector(target)?.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    },
  }));
  return (
    <>
      <button
        className="tour-button"
        onClick={() => {
          prepare();
          setGeneration((v) => v + 1);
          setRun(true);
        }}
      >
        학습 안내 다시 보기
      </button>
      <Joyride
        key={generation}
        run={run}
        continuous
        steps={steps}
        locale={{
          back: '이전',
          close: '닫기',
          last: '안내 마치기',
          next: '다음',
          nextWithProgress: '다음 ({current}/{total})',
          skip: '건너뛰기',
        }}
        options={{
          skipBeacon: true,
          buttons: ['back', 'primary', 'skip'],
          closeButtonAction: 'skip',
          showProgress: true,
          skipScroll: true,
          primaryColor: 'var(--accent)',
          backgroundColor: 'var(--panel)',
          textColor: 'var(--text)',
          zIndex: 2000,
          overlayClickAction: false,
        }}
        onEvent={(event) => {
          if (event.type === 'tour:end') {
            setRun(false);
            setTour(event.status === 'finished' ? 'done' : 'skipped');
          }
        }}
      />
    </>
  );
}
