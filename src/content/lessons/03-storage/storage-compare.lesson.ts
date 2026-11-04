import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'storage-compare',
  unit: 2,
  order: 2,
  title: 'Block·File·Object의 접근 방식',
  summary: '저장소의 형태와 요청 크기를 함께 비교합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['저장 요청', '접근 인터페이스', '데이터'],
  assessment: {
    question: '스토리지 성능을 비교할 때 함께 봐야 하는 것은?',
    options: ['접근 방식·요청 크기·지연·처리량', '서비스 이름 하나만'],
    correct: 0,
    explanation: '워크로드 조건에 따라 적합한 저장소가 달라집니다.',
  },
  advanced: [
    {
      title: '심화 · CSI와 JuiceFS',
      body: 'CSI는 저장소 플러그인이 볼륨 생성·연결·마운트 등을 구현하는 표준 인터페이스입니다. JuiceFS는 파일 메타데이터 엔진, 객체 저장소의 데이터, 클라이언트 캐시를 결합합니다. 캐시 적중과 최초 읽기를 구분하며 용량·일관성·장애 복구 비용도 함께 판단합니다.',
    },
  ],
  caution: '워크로드 조건에 따라 적합한 저장소가 달라집니다.',
  reflection: '스토리지 성능을 비교할 때 함께 봐야 하는 것은?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/storage-services.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  activity: {
    kind: 'storage',
    fields: [
      {
        id: 'requests',
        label: '요청 개수',
        initial: 100,
        min: 1,
        max: 500,
        step: 1,
        help: '같은 크기의 요청을 순차 처리하는 예시입니다.',
      },
      {
        id: 'size',
        label: '요청당 크기 (MiB)',
        initial: 1,
        min: 1,
        max: 64,
        step: 1,
        help: '크기를 늘려 지연과 처리량의 비중을 비교하세요.',
      },
    ],
    question: '스토리지 성능을 비교할 때 함께 봐야 하는 것은?',
    options: [
      {
        value: 'a',
        label: '접근 방식·요청 크기·지연·처리량',
      },
      {
        value: 'b',
        label: '서비스 이름 하나만',
      },
    ],
    correct: 'a',
    explanation: '워크로드 조건에 따라 적합한 저장소가 달라집니다.',
    task: '작은 요청 여러 개와 큰 요청의 결과를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '저장 요청',
      detail: 'Block·File·Object의 접근 방식 · 1번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n1',
      title: '접근 인터페이스',
      detail: 'Block·File·Object의 접근 방식 · 2번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n2',
      title: '데이터',
      detail: 'Block·File·Object의 접근 방식 · 3번째 구성 요소',
      tone: '#6eac9b',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'requests',
      label: '요청 개수',
      initial: 100,
      min: 1,
      max: 500,
      step: 1,
      help: '같은 크기의 요청을 순차 처리하는 예시입니다.',
    },
    {
      id: 'size',
      label: '요청당 크기 (MiB)',
      initial: 1,
      min: 1,
      max: 64,
      step: 1,
      help: '크기를 늘려 지연과 처리량의 비중을 비교하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
