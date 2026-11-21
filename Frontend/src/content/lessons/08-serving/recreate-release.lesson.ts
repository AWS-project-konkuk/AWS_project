import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'recreate-release',
  unit: 7,
  order: 3,
  title: '중단 배포에서 요청은 어떻게 될까',
  summary: '기존 모델을 내리고 새 모델을 올리는 사이의 공백을 봅니다.',
  scenario:
    '비교 활동에서 새 모델의 준비 공백을 늘리거나 줄이며 그 사이 처리하지 못한 요청을 확인합니다. 서비스를 잠시 중단할 수 있는 조건과 다른 배포 방식이 필요한 조건을 구분해 보세요.',
  concepts: ['사용자 요청', '배포 전환', '모델 서비스'],
  assessment: {
    question: '기존 실행 중지 후 새 모델 준비 전에는?',
    options: [
      '항상 모든 요청이 자동 대기 후 성공한다',
      '요청을 처리하지 못하는 공백이 생길 수 있다',
    ],
    correct: 1,
    explanation: '대기열 등 별도 설계 없이는 공백 중 요청이 실패할 수 있습니다.',
  },
  caution: '대기열 등 별도 설계 없이는 공백 중 요청이 실패할 수 있습니다.',
  reflection: '기존 실행 중지 후 새 모델 준비 전에는?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy',
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
    title: '새 버전을 준비하는 동안 들어온 요청은 어떻게 될까요?',
    instruction: '중단 구간을 바꿔 전체 요청 중 실패한 수를 확인하세요.',
  },
  activity: {
    kind: 'release',
    variant: 'recreate',
    fields: [
      {
        id: 'gap',
        label: '준비 공백 (요청 수)',
        initial: 20,
        min: 0,
        max: 60,
        step: 1,
        help: '전체 100건 중 처리하지 못하는 요청 수의 예시입니다.',
      },
    ],
    question: '기존 실행 중지 후 새 모델 준비 전에는?',
    options: [
      {
        value: 'b',
        label: '항상 모든 요청이 자동 대기 후 성공한다',
      },
      {
        value: 'a',
        label: '요청을 처리하지 못하는 공백이 생길 수 있다',
      },
    ],
    correct: 'a',
    explanation: '대기열 등 별도 설계 없이는 공백 중 요청이 실패할 수 있습니다.',
    task: '준비 공백을 바꾸며 실패 요청을 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '사용자 요청',
      detail: '중단 배포에서 요청은 어떻게 될까 · 1번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n1',
      title: '배포 전환',
      detail: '중단 배포에서 요청은 어떻게 될까 · 2번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n2',
      title: '모델 서비스',
      detail: '중단 배포에서 요청은 어떻게 될까 · 3번째 구성 요소',
      tone: '#bd8d78',
    },
  ],
  fields: [
    {
      id: 'gap',
      label: '준비 공백 (요청 수)',
      initial: 20,
      min: 0,
      max: 60,
      step: 1,
      help: '전체 100건 중 처리하지 못하는 요청 수의 예시입니다.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '사용자 요청 → 배포 전환',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '배포 전환 → 모델 서비스',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
