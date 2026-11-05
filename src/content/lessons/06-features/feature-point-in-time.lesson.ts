import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-point-in-time',
  unit: 5,
  order: 1,
  title: '과거 시점에 알 수 있었던 피처만 사용하기',
  summary:
    '어제의 구매 예측을 학습하는데 오늘 확정된 결제 결과를 피처로 붙이면 오프라인 정확도가 비정상적으로 높아집니다.',
  scenario:
    '어제의 구매 예측을 학습하는데 오늘 확정된 결제 결과를 피처로 붙이면 오프라인 정확도가 비정상적으로 높아집니다.',
  concepts: ['학습과 추론의 피처 맞추기', '과거 시점에 알 수 있었던 피처만 사용하기'],
  assessment: {
    question: '1월 1일의 예측을 재현할 때 사용할 값은?',
    options: ['그 예측 시점에 실제로 이용 가능했던 피처', '정답을 포함한 현재 최신 피처'],
    correct: 0,
    explanation:
      '원천 이벤트 → 공통 피처 계산 → 과거 시점 학습 조회와 최신 온라인 조회로 분기합니다. Offline Store는 대량 과거 자료를, Online Store는 낮은 지연의 키 조회를 담당합니다. 배치 materialization이나 스트리밍 갱신의 주기는 요구 신선도에 맞추며 지연·누락을 관측합니다.',
  },
  caution:
    'Feature Store를 설치하는 것만으로 정의 불일치와 미래 정보 누출이 사라지지 않습니다. 과거 예측 시점에 실제로 알 수 있었던 값만 조인하고, 온라인 갱신의 지연·실패도 관측해야 합니다.',
  reflection: '1월 1일의 예측을 재현할 때 사용할 값은?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.feast.dev/getting-started/architecture/overview',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
});
