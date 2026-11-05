import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'k8s-basics',
  unit: 1,
  order: 6,
  title: 'Kubernetes는 컨테이너의 실행을 관리한다',
  summary: '원하는 복제본 수를 선언하고 장애 후 복구를 관찰합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['Deployment', 'Pod 집합', 'Service'],
  assessment: {
    question: '복제본 하나가 사라졌을 때 Deployment의 목표는?',
    options: ['모델을 자동으로 다시 학습한다', '선언한 복제본 수로 다시 맞춘다'],
    correct: 1,
    explanation: '실행 상태를 복구하는 것이며 모델 학습을 대신하지 않습니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution: '실행 상태를 복구하는 것이며 모델 학습을 대신하지 않습니다.',
  reflection: '복제본 하나가 사라졌을 때 Deployment의 목표는?',
  references: [
    {
      title: '원문 · MLOps 2주차 · 실제 도구 실습',
      url: 'https://www.notion.so/f14ebb1cb38a82d6b28501d3693fd20e',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/overview/components/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  activity: {
    kind: 'replicas',
    fields: [
      {
        id: 'replicas',
        label: '원하는 복제본 수',
        initial: 3,
        min: 1,
        max: 6,
        step: 1,
        help: '한 Pod가 사라진 뒤 원하는 수로 복구되는 과정을 봅니다.',
      },
    ],
    question: '복제본 하나가 사라졌을 때 Deployment의 목표는?',
    options: [
      {
        value: 'b',
        label: '모델을 자동으로 다시 학습한다',
      },
      {
        value: 'a',
        label: '선언한 복제본 수로 다시 맞춘다',
      },
    ],
    correct: 'a',
    explanation: '실행 상태를 복구하는 것이며 모델 학습을 대신하지 않습니다.',
    task: '복제본 수를 바꾸고 장애·복구 단계를 진행하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Deployment',
      detail: 'Kubernetes는 컨테이너의 실행을 관리한다 · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: 'Pod 집합',
      detail: 'Kubernetes는 컨테이너의 실행을 관리한다 · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: 'Service',
      detail: 'Kubernetes는 컨테이너의 실행을 관리한다 · 3번째 구성 요소',
      tone: '#739fc0',
    },
  ],
  fields: [
    {
      id: 'replicas',
      label: '원하는 복제본 수',
      initial: 3,
      min: 1,
      max: 6,
      step: 1,
      help: '한 Pod가 사라진 뒤 원하는 수로 복구되는 과정을 봅니다.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: 'Deployment → Pod 집합',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'Pod 집합 → Service',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
