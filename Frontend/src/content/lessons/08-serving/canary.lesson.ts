import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'canary',
  unit: 7,
  order: 5,
  title: 'Canary: 일부 실제 요청부터',
  summary: '신규 모델의 사용자 트래픽 비율을 점진적으로 늘립니다.',
  scenario:
    '노드 예제에서 기존 모델과 새 모델로 요청이 갈라지는 경로를 따라갑니다. 활동에서 새 모델의 요청 비율을 바꾸며 실제 응답 수를 확인하고, 오류·지연·품질을 보고 다음 확대 여부를 판단합니다.',
  concepts: ['요청 라우터', '기존 모델', 'Canary 모델'],
  assessment: {
    question: 'Canary의 새 모델 응답을 받는 사람은?',
    options: ['운영자만, 사용자는 절대 받지 않는다', '지정 비율의 실제 사용자'],
    correct: 1,
    explanation: '일부 실제 트래픽의 결과를 관찰하는 전략입니다.',
  },
  caution: '일부 실제 트래픽의 결과를 관찰하는 전략입니다.',
  reflection: 'Canary의 새 모델 응답을 받는 사람은?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://argo-rollouts.readthedocs.io/en/stable/features/canary/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  nodeExample: {
    id: 'canary-traffic',
    title: '일부 사용자는 어느 모델의 응답을 받을까',
    prompt:
      'Canary는 실제 요청 일부를 새 모델로 보냅니다. 요청 복제만 하는 Shadow와 무엇이 다른지 생각해보세요.',
    nodes: [
      {
        id: 'router',
        title: '요청 분배',
        purpose: '예시 요청 100건을 90:10으로 나눕니다.',
        x: 0,
        y: 110,
      },
      {
        id: 'old-model',
        title: '기존 모델',
        purpose: '90건에 실제 응답합니다.',
        x: 330,
        y: 0,
      },
      {
        id: 'new-model',
        title: '새 모델',
        purpose: '10건에 실제 응답합니다.',
        x: 330,
        y: 260,
      },
    ],
    links: [
      {
        id: 'router-old-model',
        source: 'router',
        target: 'old-model',
        label: '실제 요청 90건',
        detail: '기존 모델이 이 사용자들에게 응답합니다.',
        material: 'request',
      },
      {
        id: 'router-new-model',
        source: 'router',
        target: 'new-model',
        label: '실제 요청 10건',
        detail:
          '새 모델의 응답도 사용자에게 전달됩니다. 점진적 확대는 관측과 별도 승격 판단이 필요합니다.',
        material: 'request',
      },
    ],
    practiceHint:
      '새 모델도 실제 요청을 받는 경로를 연결하세요. 비교용 복제라고 해석하면 Shadow와 혼동하게 됩니다.',
    nextLesson: 'week6-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activityView: {
    type: 'release',
    title: '새 모델은 요청 몇 건에 응답할까요?',
    instruction: 'Canary 비율을 10%와 50%로 바꿔 신규 사용자 응답 수를 비교하세요.',
  },
  activity: {
    kind: 'release',
    variant: 'canary',
    fields: [
      {
        id: 'traffic',
        label: '신규 모델 트래픽 (%)',
        initial: 10,
        min: 0,
        max: 100,
        step: 1,
        help: '실제 사용자에게 전달되는 신규 응답의 비율입니다.',
      },
    ],
    question: 'Canary의 새 모델 응답을 받는 사람은?',
    options: [
      {
        value: 'b',
        label: '운영자만, 사용자는 절대 받지 않는다',
      },
      {
        value: 'a',
        label: '지정 비율의 실제 사용자',
      },
    ],
    correct: 'a',
    explanation: '일부 실제 트래픽의 결과를 관찰하는 전략입니다.',
    task: '10%와 50%에서 신규 응답 수를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '요청 라우터',
      detail: 'Canary: 일부 실제 요청부터 · 1번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n1',
      title: '기존 모델',
      detail: 'Canary: 일부 실제 요청부터 · 2번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n2',
      title: 'Canary 모델',
      detail: 'Canary: 일부 실제 요청부터 · 3번째 구성 요소',
      tone: '#bd8d78',
    },
  ],
  fields: [
    {
      id: 'traffic',
      label: '신규 모델 트래픽 (%)',
      initial: 10,
      min: 0,
      max: 100,
      step: 1,
      help: '실제 사용자에게 전달되는 신규 응답의 비율입니다.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '요청 라우터 → 기존 모델',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n0-n2',
      kind: 'edge',
      from: 'n0',
      to: 'n2',
      label: '요청 라우터 → Canary 모델',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n0', 'n2'],
  ],
});
