import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'io-starvation',
  unit: 2,
  order: 4,
  title: '데이터가 늦으면 GPU도 기다린다',
  summary: '공급 속도와 소비 속도를 맞춰 I/O 병목을 줄입니다.',
  scenario:
    'GPU는 초당 100배치를 처리할 수 있지만 데이터 로더는 30배치만 준비합니다. 저장소 읽기·CPU 전처리·장치 전송을 나누어 측정하고 가장 느린 구간을 개선하세요.',
  concepts: ['원본 데이터', '로더·캐시', 'GPU'],
  assessment: {
    question: 'GPU가 다음 배치를 오래 기다리면 먼저 확인할 것은?',
    options: [
      '데이터 공급과 전처리 병목',
      'GPU 개수만 무조건 늘리기',
      '데이터를 옮기지 않고 저장소 용량만 늘리기',
      'CPU와 메모리 사용량을 확인하지 않고 로더 worker 수를 최대로 늘리기',
    ],
    correct: 0,
    explanation:
      'GPU 사용률만 보고 장치를 늘리지 말고 배치 대기 시간, 저장소 읽기, CPU 전처리와 GPU 전송 시간을 나누어 확인해야 합니다.',
  },
  advanced: [
    {
      title: '심화 · 로더 병렬성과 작은 파일',
      body: 'worker 수를 늘리면 읽기와 전처리를 겹칠 수 있지만 CPU·메모리·스토리지 경쟁도 커집니다. 작은 샘플 파일을 shard로 묶으면 요청 수와 메타데이터 부담을 줄일 수 있습니다. 변경 전후의 배치 대기 시간과 처리량을 같은 조건에서 비교하세요.',
    },
  ],
  caution: '캐시는 반복 읽기에만 유리하며 첫 읽기와 CPU 전처리 병목까지 해결하지는 않습니다.',
  reflection:
    'GPU 사용률이 낮을 때 저장소, CPU 전처리, GPU 중 병목 위치를 어떻게 구분할 수 있을까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://cool-candle-658.notion.site/MLOps-4-02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'AWS 공식 · EKS AI/ML 스토리지 최적화',
      url: 'https://docs.aws.amazon.com/eks/latest/best-practices/aiml-storage.html',
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
      {
        value: 'c',
        label: '데이터를 옮기지 않고 저장소 용량만 늘리기',
      },
      {
        value: 'd',
        label: 'CPU와 메모리 사용량을 확인하지 않고 로더 worker 수를 최대로 늘리기',
      },
    ],
    correct: 'a',
    explanation:
      'GPU 사용률만 보고 장치를 늘리지 말고 배치 대기 시간, 저장소 읽기, CPU 전처리와 GPU 전송 시간을 나누어 확인해야 합니다.',
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
