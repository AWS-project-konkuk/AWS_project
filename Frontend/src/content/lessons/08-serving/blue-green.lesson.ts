import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'blue-green',
  unit: 7,
  order: 4,
  title: 'Blue·Green: 준비 후 한 번에 전환',
  summary: '기존·신규 환경을 준비하고 트래픽 경로를 전환합니다.',
  scenario:
    '활동에서 새 환경 준비, 전체 전환, 기존 환경으로의 롤백을 선택해 실제로 응답하는 모델을 비교합니다. 새 환경이 요청을 받을 준비가 됐는지 전환 전에 무엇으로 확인할지도 살펴보세요.',
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
      url: 'https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  activityView: {
    type: 'release',
    title: '준비·전환·롤백에서 누가 응답할까요?',
    instruction: '전환 단계를 골라 실제 사용자에게 응답하는 모델을 확인하세요.',
  },
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
