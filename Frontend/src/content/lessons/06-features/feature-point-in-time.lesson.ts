import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-point-in-time',
  unit: 5,
  order: 1,
  title: 'Training-Serving Skew: 학습과 서비스 입력 맞추기',
  summary:
    '학습할 때 만든 피처와 실제 서비스가 모델에 넣는 피처가 달라지는 이유와 해결 기준을 알아봅니다.',
  scenario:
    '학습에서는 최근 1시간 클릭 수를 사용했지만 서비스에서는 최근 24시간 클릭 수를 넣어 예측 품질이 낮아졌습니다.',
  concepts: ['Training-Serving Skew', '공통 전처리 정의', '데이터 변화', '시점 정확성'],
  assessment: {
    question: '학습과 서비스의 피처 불일치를 줄이는 가장 중요한 기준은?',
    options: ['같은 입력을 같은 피처 정의로 계산한다', '온라인 저장소의 크기만 늘린다'],
    correct: 0,
    explanation:
      '같은 원천 입력은 학습과 서비스에서 같은 전처리·집계 기준을 거쳐 같은 의미의 피처가 되어야 합니다. 저장소가 빠르기만 해서는 계산 정의의 차이를 해결할 수 없습니다.',
  },
  caution:
    'Training-Serving Skew와 Data Drift는 결과가 비슷해 보여도 원인이 다릅니다. 전자는 두 처리 경로의 불일치이고, 후자는 시간에 따라 실제 데이터 분포나 관계가 변하는 문제입니다.',
  reflection: '같은 고객 데이터가 학습과 서비스에서 서로 다른 피처가 되는 경우를 설명해 보세요.',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: 'JFrog ML · What is training-serving skew?',
      url: 'https://www.qwak.com/post/training-serving-skew-in-machine-learning',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
});
