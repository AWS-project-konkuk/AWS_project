import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'blue-green',
  unit: 7,
  order: 4,
  title: 'Blue·Green: 준비 후 한 번에 전환',
  summary: '기존·신규 환경을 준비하고 트래픽 경로를 전환합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['요청 라우터', '기존 Blue', '신규 Green'],
  assessment: {
    question: 'Blue·Green에서 새 모델로 사용자 요청을 보내는 시점은?',
    options: ['새 환경 준비를 확인한 뒤 경로를 전환할 때', '새 환경이 아직 시작되지 않았을 때'],
    correct: 0,
    explanation: '준비 확인과 명시적인 경로 전환을 분리합니다.',
  },
  caution: '준비 확인과 명시적인 경로 전환을 분리합니다.',
  reflection: 'Blue·Green에서 새 모델로 사용자 요청을 보내는 시점은?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://grpc.io/docs/what-is-grpc/introduction/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  activity: {
    kind: 'release',
    variant: 'bluegreen',
    fields: [
      {
        id: 'phase',
        label: '전환 단계',
        initial: 'prepare',
        options: [
          {
            value: 'prepare',
            label: '새 환경 준비',
          },
          {
            value: 'switch',
            label: '전체 전환',
          },
          {
            value: 'rollback',
            label: '기존 환경으로 롤백',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'Blue·Green에서 새 모델로 사용자 요청을 보내는 시점은?',
    options: [
      {
        value: 'a',
        label: '새 환경 준비를 확인한 뒤 경로를 전환할 때',
      },
      {
        value: 'b',
        label: '새 환경이 아직 시작되지 않았을 때',
      },
    ],
    correct: 'a',
    explanation: '준비 확인과 명시적인 경로 전환을 분리합니다.',
    task: '준비·전환·롤백에서 실제 응답 모델을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '요청 라우터',
      detail: 'Blue·Green: 준비 후 한 번에 전환 · 1번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n1',
      title: '기존 Blue',
      detail: 'Blue·Green: 준비 후 한 번에 전환 · 2번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n2',
      title: '신규 Green',
      detail: 'Blue·Green: 준비 후 한 번에 전환 · 3번째 구성 요소',
      tone: '#bd8d78',
    },
  ],
  fields: [
    {
      id: 'phase',
      label: '전환 단계',
      initial: 'prepare',
      options: [
        {
          value: 'prepare',
          label: '새 환경 준비',
        },
        {
          value: 'switch',
          label: '전체 전환',
        },
        {
          value: 'rollback',
          label: '기존 환경으로 롤백',
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
      label: '요청 라우터 → 기존 Blue',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n0-n2',
      kind: 'edge',
      from: 'n0',
      to: 'n2',
      label: '요청 라우터 → 신규 Green',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n0', 'n2'],
  ],
});
