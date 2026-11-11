import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'docker-commands',
  unit: 1,
  order: 3,
  title: 'Docker란?',
  minutes: 12,
  summary:
    'Dockerfile로 이미지를 만들고 컨테이너를 실행하는 과정을 통해 Docker의 역할을 이해합니다.',
  scenario:
    'Dockerfile·이미지·컨테이너·레지스트리를 구분하고, build와 run이 바꾸는 대상을 설명합니다.',
  concepts: ['Docker Engine', 'Dockerfile', '이미지', '레지스트리', 'build·run'],
  assessment: {
    question: 'docker build로 이미지를 만든 직후의 상태를 올바르게 설명한 것은?',
    options: [
      '이미지를 만들면 서버도 자동으로 계속 실행된다',
      '이미지가 준비됐으며, 서버 실행에는 컨테이너를 만들어 시작하는 과정이 필요하다',
    ],
    correct: 1,
    explanation:
      'build는 이미지 제작, run은 새 컨테이너 생성과 시작입니다. 빌드한 이미지가 있다는 사실만으로 앱이 실행되는 것은 아닙니다.',
  },
  caution:
    'build와 run, RUN과 CMD의 실행 시점을 구분합니다. EXPOSE는 호스트 포트를 공개하는 설정이 아닙니다.',
  reflection: 'Dockerfile, 이미지, 컨테이너, 레지스트리의 관계를 실행 순서대로 설명해 보세요.',
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
      title: 'Docker 공식 · 개요와 구성 요소',
      url: 'https://docs.docker.com/get-started/docker-overview/',
    },
    {
      title: 'Docker 공식 · Dockerfile 작성',
      url: 'https://docs.docker.com/get-started/docker-concepts/building-images/writing-a-dockerfile/',
    },
    {
      title: 'Docker 공식 · 포트 공개',
      url: 'https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Dockerfile',
      detail: 'Docker란? · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: '이미지',
      detail: 'Docker란? · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: '실행 컨테이너',
      detail: 'Docker란? · 3번째 구성 요소',
      tone: '#739fc0',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
