import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'k8s-basics',
  unit: 1,
  order: 6,
  title: 'Kubernetes란?',
  minutes: 12,
  summary:
    '여러 컨테이너 실행본을 관리할 때 필요한 Pod·Deployment·Service와 원하는 상태의 의미를 배웁니다.',
  scenario:
    '두 실행본을 유지하라는 선언이 장애 뒤 새 Pod 생성으로 이어지는 이유와 Service의 역할을 설명합니다.',
  concepts: ['클러스터·노드', 'Pod', 'Deployment·ReplicaSet', 'Service'],
  assessment: {
    question:
      'Deployment가 관리하는 Pod 하나가 삭제됐습니다. 복제본 두 개를 선언했다면 기대하는 동작은?',
    options: [
      '모델을 자동으로 다시 학습하고 이전 메모리도 복원한다',
      '실행 조건이 충족되면 부족한 Pod를 새로 만들어 원하는 수에 맞춘다',
    ],
    correct: 1,
    explanation:
      '컨트롤러가 원하는 실행 상태와 실제 상태의 차이를 조정합니다. 실행본을 다시 만드는 일과 이전 메모리·학습 상태를 복원하는 일은 다르며, 부하 기반 자동 확장은 HPA 등의 별도 구성이 필요합니다.',
  },
  caution: 'Pod 복구, 컨테이너 재시작, 데이터 복원, 부하 기반 자동 확장은 서로 다른 동작입니다.',
  reflection:
    '리뷰 서버를 두 개 유지하는 일과 사용자 요청을 그 서버로 전달하는 일을 각각 누가 담당하나요?',
  references: [
    {
      title: '원문 · MLOps 2주차 · 컨테이너 원리와 Kubernetes 실습',
      url: 'https://www.notion.so/f14ebb1cb38a82d6b28501d3693fd20e',
    },
    {
      title: '원문 · DevOps 6차시 · Docker와 AWS 컨테이너 서비스',
      url: 'https://www.notion.so/392ebb1cb38a8286b9b501e0da4e0fdc',
    },
    {
      title: '원문 · Docker에 대한 상세 · 실행 환경과 명령',
      url: 'https://www.notion.so/36cebb1cb38a802d8d0fec8b47a33a22',
    },
    {
      title: 'Kubernetes 공식 · 개요',
      url: 'https://kubernetes.io/docs/concepts/overview/',
    },
    {
      title: 'Kubernetes 공식 · Pod',
      url: 'https://kubernetes.io/docs/concepts/workloads/pods/',
    },
    {
      title: 'Kubernetes 공식 · Deployment',
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
      detail: 'Kubernetes란? · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: 'Pod 집합',
      detail: 'Kubernetes란? · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: 'Service',
      detail: 'Kubernetes란? · 3번째 구성 요소',
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
