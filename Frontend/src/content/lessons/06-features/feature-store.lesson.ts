import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-store',
  unit: 5,
  order: 2,
  title: 'Feature Store는 왜 필요할까요?',
  summary:
    '피처를 한 번 정의해 학습과 서비스에서 함께 쓰고, 팀 사이에서 재사용하는 방법을 알아봅니다.',
  scenario:
    '본문 활동에서 등록부, 변환, 저장소를 차례로 살펴보세요. 학습과 실시간 추론을 선택해 같은 클릭 집계 정의가 과거 값과 최신 값의 조회 경로에 각각 어떻게 쓰이는지 추적합니다.',
  concepts: ['피처 재사용', 'Transform', 'Storage·Serving', 'Monitoring', 'Registry'],
  assessment: {
    question: '학습·서빙 불일치를 줄이려면?',
    options: ['피처 정의와 집계 시점을 일관되게 관리한다', '온라인 조회 속도만 높인다'],
    correct: 0,
    explanation:
      '공통 피처 정의와 버전을 등록하고, 학습용 과거 값과 서비스용 최신 값에 같은 의미를 적용해야 합니다. 빠른 조회만으로 계산 방식의 차이는 해결되지 않습니다.',
  },
  caution:
    'Feature Store는 단순한 데이터베이스가 아닙니다. 피처 계산·저장·제공·등록·관찰을 함께 관리하지만, 잘못된 정의나 늦은 갱신까지 자동으로 고쳐 주지는 않습니다.',
  reflection: 'Feature Store가 단순한 데이터베이스와 다른 이유를 설명해 보세요.',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: 'Databricks · What is a Feature Store?',
      url: 'https://www.databricks.com/blog/what-is-a-feature-store',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
  activityView: {
    type: 'feature-store',
    title: 'Feature Store 안에서는 무슨 일이 일어날까요?',
    instruction: '경로와 구성 요소를 골라 최신 값과 과거 이력이 어디로 전달되는지 확인하세요.',
  },
  activity: {
    kind: 'features',
    fields: [],
    question: 'Feature Store에서 피처 정의와 버전을 관리하는 구성 요소는?',
    options: [
      {
        value: 'a',
        label: 'Registry',
      },
      {
        value: 'b',
        label: 'Model API',
      },
    ],
    correct: 'a',
    explanation: 'Registry가 피처의 정의, 버전, 자료형, 소유자 같은 메타데이터를 관리합니다.',
    task: 'Feature Store의 구성 요소와 실시간 추론·모델 학습 경로를 살펴보세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Registry·공통 정의',
      detail: '피처의 이름, 계산 방법, 버전과 담당자를 관리합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: 'Offline Store',
      detail: '학습에 필요한 대량의 과거 피처를 보관합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: 'Online Store',
      detail: '서비스 요청에 최신 피처를 빠르게 제공합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n3',
      title: '학습·서빙',
      detail: '목적은 달라도 같은 의미의 피처를 모델에 전달합니다.',
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
