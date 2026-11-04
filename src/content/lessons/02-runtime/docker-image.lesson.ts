import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'docker-image',
  unit: 1,
  order: 3,
  title: '이미지와 컨테이너의 관계',
  summary: '실행 환경의 템플릿에서 격리된 프로세스를 실행합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['코드·의존성', '컨테이너 이미지', '실행 컨테이너'],
  assessment: {
    question: '이미지 하나로 가능한 것은?',
    options: ['여러 컨테이너 실행', '실행 중인 컨테이너 하나만 유지'],
    correct: 0,
    explanation: '이미지는 템플릿이며 여러 실행 인스턴스가 재사용합니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution: '이미지는 템플릿이며 여러 실행 인스턴스가 재사용합니다.',
  reflection: '이미지 하나로 가능한 것은?',
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
      url: 'https://docs.docker.com/get-started/docker-concepts/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  nodeExample: {
    id: 'image-reuse',
    title: '하나의 이미지로 두 실행 환경 만들기',
    prompt:
      '이미지는 실행 중인 컨테이너가 아닙니다. 같은 이미지에서 두 컨테이너를 시작하는 분기를 확인하세요.',
    nodes: [
      {
        id: 'image',
        title: '이미지 v1',
        purpose: '코드와 사용자 공간 의존성을 담은 실행 템플릿입니다.',
        x: 0,
        y: 110,
      },
      {
        id: 'container-a',
        title: '컨테이너 A',
        purpose: '이미지 v1로 시작한 첫 번째 프로세스입니다.',
        x: 330,
        y: 0,
      },
      {
        id: 'container-b',
        title: '컨테이너 B',
        purpose: '같은 이미지로 시작한 별도의 프로세스입니다.',
        x: 330,
        y: 260,
      },
    ],
    links: [
      {
        id: 'image-container-a',
        source: 'image',
        target: 'container-a',
        label: '이미지 v1 사용',
        detail: '컨테이너 A가 이 이미지를 실행의 기반으로 사용합니다.',
        material: 'image',
      },
      {
        id: 'image-container-b',
        source: 'image',
        target: 'container-b',
        label: '이미지 v1 사용',
        detail: '컨테이너 B도 같은 이미지를 사용하지만 실행 상태는 별개입니다.',
        material: 'image',
      },
    ],
    practiceHint:
      '컨테이너 B도 같은 템플릿을 사용하도록 연결하세요. A의 실행 상태를 B로 넘기는 연결은 아닙니다.',
    nextLesson: 'week2-workflow',
    kind: '구성 관계',
    afterSection: 1,
  },
  activity: {
    kind: 'container',
    fields: [
      {
        id: 'copies',
        label: '컨테이너 수',
        initial: 2,
        min: 1,
        max: 6,
        step: 1,
        help: '동일 이미지에서 실행 인스턴스가 늘어납니다.',
      },
    ],
    question: '이미지 하나로 가능한 것은?',
    options: [
      {
        value: 'a',
        label: '여러 컨테이너 실행',
      },
      {
        value: 'b',
        label: '실행 중인 컨테이너 하나만 유지',
      },
    ],
    correct: 'a',
    explanation: '이미지는 템플릿이며 여러 실행 인스턴스가 재사용합니다.',
    task: '컨테이너 수를 바꾸고 공유 이미지와 개별 실행 상태를 구분하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '코드·의존성',
      detail: '이미지와 컨테이너의 관계 · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: '컨테이너 이미지',
      detail: '이미지와 컨테이너의 관계 · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: '실행 컨테이너',
      detail: '이미지와 컨테이너의 관계 · 3번째 구성 요소',
      tone: '#739fc0',
    },
  ],
  fields: [
    {
      id: 'copies',
      label: '컨테이너 수',
      initial: 2,
      min: 1,
      max: 6,
      step: 1,
      help: '동일 이미지에서 실행 인스턴스가 늘어납니다.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '코드·의존성 → 컨테이너 이미지',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '컨테이너 이미지 → 실행 컨테이너',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
