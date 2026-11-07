import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'docker-image',
  unit: 1,
  order: 5,
  title: '이미지와 컨테이너의 관계',
  minutes: 12,
  summary:
    '하나의 이미지로 두 컨테이너를 만들고, 실행 상태와 파일 변경이 따로 관리되는 이유를 확인합니다.',
  scenario:
    '같은 이미지를 두 컨테이너에 연결하고 이미지 재사용, 쓰기 레이어, 중지와 삭제의 차이를 설명합니다.',
  concepts: ['이미지 레이어', '쓰기 레이어', '실행본', '태그·digest'],
  assessment: {
    question: '같은 이미지로 A와 B를 만들었습니다. 공유 볼륨 없이 A의 쓰기 레이어에 파일을 만들면?',
    options: [
      '원본 이미지와 B는 자동 변경되지 않는다',
      '같은 이미지이므로 B에도 즉시 같은 파일이 생긴다',
    ],
    correct: 0,
    explanation:
      '같은 이미지의 읽기 전용 레이어를 기반으로 해도 컨테이너별 쓰기 레이어는 별개입니다. 같은 볼륨을 공유하는 경우는 별도로 구분합니다.',
  },
  caution:
    '이미지를 재사용하는 것과 실행 상태를 공유하는 것은 다릅니다. 중지는 기존 컨테이너 삭제가 아닙니다.',
  reflection:
    'A를 중지했다가 시작하는 경우와 삭제한 뒤 같은 이미지로 새로 만드는 경우의 파일 상태는 어떻게 다를까요?',
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
      title: 'Docker 공식 · 이미지',
      url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/',
    },
    {
      title: 'Docker 공식 · 이미지 레이어',
      url: 'https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/',
    },
    {
      title: 'Docker 공식 · 컨테이너 저장소',
      url: 'https://docs.docker.com/engine/storage/',
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
