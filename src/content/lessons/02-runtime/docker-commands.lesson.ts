import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'docker-commands',
  unit: 1,
  order: 4,
  title: 'Docker 명령으로 상태 바꾸기',
  summary: '명령을 선택하고 이미지·컨테이너 상태를 관찰합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['Dockerfile', '이미지', '실행 컨테이너'],
  assessment: {
    question: 'stop을 수행한 후의 컨테이너는?',
    options: ['이미지까지 자동으로 모두 삭제된다', '종료 상태로 남아 있으며 rm으로 제거할 수 있다'],
    correct: 1,
    explanation: '컨테이너 중지·삭제와 이미지 삭제는 서로 다릅니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution: '컨테이너 중지·삭제와 이미지 삭제는 서로 다릅니다.',
  reflection: 'stop을 수행한 후의 컨테이너는?',
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
    kind: 'commands',
    fields: [],
    question: 'stop을 수행한 후의 컨테이너는?',
    options: [
      {
        value: 'b',
        label: '이미지까지 자동으로 모두 삭제된다',
      },
      {
        value: 'a',
        label: '종료 상태로 남아 있으며 rm으로 제거할 수 있다',
      },
    ],
    correct: 'a',
    explanation: '컨테이너 중지·삭제와 이미지 삭제는 서로 다릅니다.',
    task: 'build → run → logs → stop → rm을 선택해 변화를 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Dockerfile',
      detail: 'Docker 명령으로 상태 바꾸기 · 1번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n1',
      title: '이미지',
      detail: 'Docker 명령으로 상태 바꾸기 · 2번째 구성 요소',
      tone: '#739fc0',
    },
    {
      id: 'n2',
      title: '실행 컨테이너',
      detail: 'Docker 명령으로 상태 바꾸기 · 3번째 구성 요소',
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
