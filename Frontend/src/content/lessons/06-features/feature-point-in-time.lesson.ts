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
    '노드 예제에서 학습과 서비스에 동일한 클릭 집계 기준을 적용합니다. 과거 학습 데이터를 만들 때 예측 시점 이후의 클릭까지 섞이면 평가가 어떻게 왜곡되는지도 확인해 보세요.',
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
  nodeExample: {
    id: 'feature-definition-two-paths',
    title: '같은 정의에서 갈라지는 두 피처 경로',
    prompt: '공통 피처 정의를 학습용 과거 피처와 서비스용 최신 피처에 각각 연결해 보세요.',
    nodes: [
      {
        id: 'definition',
        title: '공통 피처 정의',
        purpose: '최근 1시간 클릭 수의 집계 범위와 누락값 처리 기준을 관리합니다.',
        x: 0,
        y: 120,
      },
      {
        id: 'training',
        title: '학습용 과거 피처',
        purpose: '예측 시점에 이용 가능했던 값으로 학습 자료를 만듭니다.',
        x: 330,
        y: 0,
      },
      {
        id: 'serving',
        title: '서비스용 최신 피처',
        purpose: '같은 정의로 계산한 최신 값을 실시간 추론에 제공합니다.',
        x: 330,
        y: 240,
      },
    ],
    links: [
      {
        id: 'definition-training',
        source: 'definition',
        target: 'training',
        label: '같은 계산 기준',
        detail: '과거 시점의 입력에 공통 집계·전처리 정의를 적용합니다.',
        material: 'metadata',
      },
      {
        id: 'definition-serving',
        source: 'definition',
        target: 'serving',
        label: '같은 계산 기준',
        detail: '현재 입력에도 같은 집계·전처리 정의를 적용합니다.',
        material: 'metadata',
      },
    ],
    practiceHint:
      '두 경로가 모두 같은 공통 정의에서 시작하는지 확인하세요. 저장 시점은 달라도 피처의 의미는 같아야 합니다.',
    nextLesson: 'feature-store',
    kind: '자료 전달',
    afterSection: 3,
  },
});
