import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-store',
  unit: 5,
  order: 2,
  title: 'Feature Store로 학습과 서빙을 맞추기',
  summary: '오프라인·온라인 피처가 같은 정의를 사용하도록 구성합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['공통 피처 정의', '오프라인 스토어', '온라인 스토어', '학습·서빙'],
  assessment: {
    question: '학습·서빙 불일치를 줄이려면?',
    options: ['피처 정의와 집계 시점을 일관되게 관리한다', '온라인 조회 속도만 높인다'],
    correct: 0,
    explanation: '빠른 조회와 올바른 피처 정의는 서로 다른 조건입니다.',
  },
  caution: '빠른 조회와 올바른 피처 정의는 서로 다른 조건입니다.',
  reflection: '학습·서빙 불일치를 줄이려면?',
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
  nodeExample: {
    id: 'feature-two-paths',
    title: '같은 피처 정의, 다른 조회 경로',
    prompt:
      '대량의 과거 조회와 빠른 현재 조회는 다릅니다. 공통 피처 정의에서 두 사용 경로로 나눠보세요.',
    nodes: [
      {
        id: 'definition',
        title: '공통 피처 정의',
        purpose: '최근 1시간 클릭 수라는 의미를 공유합니다.',
        x: 0,
        y: 110,
      },
      {
        id: 'offline',
        title: '오프라인 피처',
        purpose: '과거 시점에 맞는 학습 자료를 제공합니다.',
        x: 310,
        y: 0,
      },
      {
        id: 'online',
        title: '온라인 피처',
        purpose: '갱신된 피처를 낮은 지연으로 조회합니다.',
        x: 310,
        y: 260,
      },
      {
        id: 'training',
        title: '모델 학습',
        purpose: '과거 자료로 학습합니다.',
        x: 620,
        y: 0,
      },
      {
        id: 'serving',
        title: '실시간 추론',
        purpose: '요청 시 현재 피처를 사용합니다.',
        x: 620,
        y: 260,
      },
    ],
    links: [
      {
        id: 'definition-offline',
        source: 'definition',
        target: 'offline',
        label: '피처 정의',
        detail: '학습 자료를 만들 때 공통 정의를 적용합니다.',
        material: 'metadata',
      },
      {
        id: 'offline-training',
        source: 'offline',
        target: 'training',
        label: '과거 시점 피처',
        detail: '예측 시점에 알 수 있었던 값으로 학습 자료를 구성합니다.',
        material: 'data',
      },
      {
        id: 'definition-online',
        source: 'definition',
        target: 'online',
        label: '피처 정의',
        detail: '온라인 갱신도 동일한 의미와 집계 기준을 따릅니다.',
        material: 'metadata',
      },
      {
        id: 'online-serving',
        source: 'online',
        target: 'serving',
        label: '현재 조회 피처',
        detail: '온라인 조회가 실제 요청의 모델 입력을 제공합니다.',
        material: 'data',
      },
    ],
    practiceHint:
      '실시간 추론에 필요한 조회 경로를 연결하세요. Feature Store가 모든 시점 불일치를 자동 해결하지는 않습니다.',
    nextLesson: 'feature-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activity: {
    kind: 'features',
    fields: [
      {
        id: 'definition',
        label: '온라인 피처 집계',
        initial: 'day',
        options: [
          {
            value: 'day',
            label: '최근 24시간',
          },
          {
            value: 'hour',
            label: '최근 1시간 · 학습 정의와 일치',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '학습·서빙 불일치를 줄이려면?',
    options: [
      {
        value: 'a',
        label: '피처 정의와 집계 시점을 일관되게 관리한다',
      },
      {
        value: 'b',
        label: '온라인 조회 속도만 높인다',
      },
    ],
    correct: 'a',
    explanation: '빠른 조회와 올바른 피처 정의는 서로 다른 조건입니다.',
    task: '온라인 집계 기준을 바꿔 학습 정의와 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '공통 피처 정의',
      detail: 'Feature Store로 학습과 서빙을 맞추기 · 1번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: '오프라인 스토어',
      detail: 'Feature Store로 학습과 서빙을 맞추기 · 2번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: '온라인 스토어',
      detail: 'Feature Store로 학습과 서빙을 맞추기 · 3번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n3',
      title: '학습·서빙',
      detail: 'Feature Store로 학습과 서빙을 맞추기 · 4번째 구성 요소',
      tone: '#a287bd',
    },
  ],
  fields: [
    {
      id: 'definition',
      label: '온라인 피처 집계',
      initial: 'day',
      options: [
        {
          value: 'day',
          label: '최근 24시간',
        },
        {
          value: 'hour',
          label: '최근 1시간 · 학습 정의와 일치',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '공통 피처 정의 → 오프라인 스토어',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n0-n2',
      kind: 'edge',
      from: 'n0',
      to: 'n2',
      label: '공통 피처 정의 → 온라인 스토어',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n3',
      kind: 'edge',
      from: 'n1',
      to: 'n3',
      label: '오프라인 스토어 → 학습·서빙',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n2-n3',
      kind: 'edge',
      from: 'n2',
      to: 'n3',
      label: '온라인 스토어 → 학습·서빙',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n0', 'n2'],
    ['n1', 'n3'],
    ['n2', 'n3'],
  ],
});
