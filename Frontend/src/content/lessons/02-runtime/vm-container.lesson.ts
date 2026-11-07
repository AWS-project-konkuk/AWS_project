import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vm-container',
  unit: 1,
  order: 2,
  title: 'VM과 컨테이너의 차이',
  minutes: 10,
  summary:
    '각자 운영체제를 실행하는 VM과, 커널을 공유하며 프로세스를 격리하는 컨테이너를 비교합니다.',
  scenario:
    '커널·앱·라이브러리가 어느 층에 있는지 비교하고, EC2 안에서 컨테이너를 실행하는 구조를 설명합니다.',
  concepts: ['VM', '하이퍼바이저', '게스트 OS', '커널 공유'],
  assessment: {
    question: '일반적인 Linux 컨테이너들이 같은 호스트에서 공유하는 것은?',
    options: ['호스트의 Linux 커널', '모든 앱의 프로세스 메모리와 Python 라이브러리'],
    correct: 0,
    explanation:
      '컨테이너는 실행 호스트의 커널을 공유하면서 앱과 라이브러리 환경을 나눌 수 있습니다. VM은 게스트 운영체제와 커널을 별도로 실행합니다.',
  },
  caution:
    '커널 공유와 앱·라이브러리 환경 분리는 함께 가능합니다. VM 안에서 컨테이너를 실행할 수도 있습니다.',
  reflection: 'EC2가 VM인데 그 안에서 컨테이너를 실행해도 모순이 아닌 이유는 무엇인가요?',
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
      title: 'Docker 공식 · 컨테이너와 VM',
      url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  activity: {
    kind: 'virtual',
    fields: [
      {
        id: 'copies',
        label: '실행할 앱 수',
        initial: 1,
        min: 1,
        max: 3,
        step: 1,
        help: '앱마다 독립된 실행 환경을 하나씩 추가하고 각 VM의 커널과 컨테이너의 공유 커널을 셉니다.',
      },
    ],
    question: 'Linux 컨테이너들이 일반적으로 공유하는 것은?',
    options: [
      {
        value: 'a',
        label: '호스트 커널',
      },
      {
        value: 'b',
        label: '모든 앱의 프로세스 메모리',
      },
    ],
    correct: 'a',
    explanation: '커널 공유와 앱 메모리 격리는 양립할 수 있습니다.',
    task: '앱을 1개에서 3개로 늘리고 커널의 위치와 개수를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '하드웨어',
      detail: 'VM과 컨테이너의 차이 · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: '운영체제·커널',
      detail: 'VM과 컨테이너의 차이 · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: '격리된 앱',
      detail: 'VM과 컨테이너의 차이 · 3번째 구성 요소',
      tone: '#739fc0',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'copies',
      label: '실행할 앱 수',
      initial: 1,
      min: 1,
      max: 3,
      step: 1,
      help: '앱마다 독립된 실행 환경을 하나씩 추가하고 각 VM의 커널과 컨테이너의 공유 커널을 셉니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
