import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'io-starvation',
  unit: 2,
  order: 4,
  title: '데이터가 늦으면 GPU도 기다린다',
  summary: '공급 속도와 소비 속도를 맞춰 I/O 병목을 줄입니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['원본 데이터', '로더·캐시', 'GPU'],
  assessment: {
    question: 'GPU가 다음 배치를 오래 기다리면 먼저 확인할 것은?',
    options: ['데이터 공급과 전처리 병목', 'GPU 개수만 무조건 늘리기'],
    correct: 0,
    explanation: '대기 원인을 관측한 뒤 데이터 공급 경로를 개선합니다.',
  },
  advanced: [
    {
      title: '심화 · CSI와 JuiceFS',
      body: 'CSI는 저장소 플러그인이 볼륨 생성·연결·마운트 등을 구현하는 표준 인터페이스입니다. JuiceFS는 파일 메타데이터 엔진, 객체 저장소의 데이터, 클라이언트 캐시를 결합합니다. 캐시 적중과 최초 읽기를 구분하며 용량·일관성·장애 복구 비용도 함께 판단합니다.',
    },
  ],
  caution: '대기 원인을 관측한 뒤 데이터 공급 경로를 개선합니다.',
  reflection: 'GPU가 다음 배치를 오래 기다리면 먼저 확인할 것은?',
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
      url: 'https://docs.pytorch.org/docs/stable/data.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  activity: {
    kind: 'io',
    fields: [
      {
        id: 'supply',
        label: '데이터 공급 속도',
        initial: 30,
        min: 10,
        max: 200,
        step: 1,
        help: '초당 배치 수의 교육용 예시입니다.',
      },
      {
        id: 'demand',
        label: 'GPU 소비 속도',
        initial: 100,
        min: 10,
        max: 200,
        step: 1,
        help: 'GPU가 처리할 수 있는 초당 배치 수입니다.',
      },
      {
        id: 'cache',
        label: '반복 읽기 캐시',
        initial: 'off',
        options: [
          {
            value: 'off',
            label: '사용 안 함',
          },
          {
            value: 'on',
            label: '사용 · 공급 2배 가정',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'GPU가 다음 배치를 오래 기다리면 먼저 확인할 것은?',
    options: [
      {
        value: 'a',
        label: '데이터 공급과 전처리 병목',
      },
      {
        value: 'b',
        label: 'GPU 개수만 무조건 늘리기',
      },
    ],
    correct: 'a',
    explanation: '대기 원인을 관측한 뒤 데이터 공급 경로를 개선합니다.',
    task: '공급·소비 속도를 바꾸며 대기 비율을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '원본 데이터',
      detail: '데이터가 늦으면 GPU도 기다린다 · 1번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n1',
      title: '로더·캐시',
      detail: '데이터가 늦으면 GPU도 기다린다 · 2번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n2',
      title: 'GPU',
      detail: '데이터가 늦으면 GPU도 기다린다 · 3번째 구성 요소',
      tone: '#6eac9b',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'supply',
      label: '데이터 공급 속도',
      initial: 30,
      min: 10,
      max: 200,
      step: 1,
      help: '초당 배치 수의 교육용 예시입니다.',
    },
    {
      id: 'demand',
      label: 'GPU 소비 속도',
      initial: 100,
      min: 10,
      max: 200,
      step: 1,
      help: 'GPU가 처리할 수 있는 초당 배치 수입니다.',
    },
    {
      id: 'cache',
      label: '반복 읽기 캐시',
      initial: 'off',
      options: [
        {
          value: 'off',
          label: '사용 안 함',
        },
        {
          value: 'on',
          label: '사용 · 공급 2배 가정',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
