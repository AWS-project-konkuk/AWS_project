import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vm-container',
  unit: 1,
  order: 5,
  title: 'VM과 컨테이너는 무엇을 공유할까',
  summary: '가상화의 층과 커널 공유를 시각적으로 비교합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['하드웨어', '운영체제·커널', '격리된 앱'],
  assessment: {
    question: 'Linux 컨테이너들이 일반적으로 공유하는 것은?',
    options: ['호스트 커널', '모든 앱의 프로세스 메모리'],
    correct: 0,
    explanation: '커널 공유와 앱 메모리 격리는 양립할 수 있습니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution: '커널 공유와 앱 메모리 격리는 양립할 수 있습니다.',
  reflection: 'Linux 컨테이너들이 일반적으로 공유하는 것은?',
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
  activity: {
    kind: 'virtual',
    fields: [
      {
        id: 'copies',
        label: '실행할 앱 수',
        initial: 3,
        min: 1,
        max: 6,
        step: 1,
        help: '앱 수에 따른 게스트 OS 복제와 커널 공유를 비교합니다.',
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
    task: '앱 수를 바꾸며 VM과 컨테이너의 층을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '하드웨어',
      detail: 'VM과 컨테이너는 무엇을 공유할까 · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: '운영체제·커널',
      detail: 'VM과 컨테이너는 무엇을 공유할까 · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: '격리된 앱',
      detail: 'VM과 컨테이너는 무엇을 공유할까 · 3번째 구성 요소',
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
      initial: 3,
      min: 1,
      max: 6,
      step: 1,
      help: '앱 수에 따른 게스트 OS 복제와 커널 공유를 비교합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
