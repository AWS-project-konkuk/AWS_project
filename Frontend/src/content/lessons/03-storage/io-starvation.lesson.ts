import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'io-starvation',
  unit: 2,
  order: 4,
  title: '데이터가 늦으면 GPU도 기다린다',
  summary: '공급 속도와 소비 속도를 맞춰 I/O 병목을 줄입니다.',
  scenario:
    '비교 활동에서 데이터 공급 속도와 GPU 소비 속도를 조절해 배치가 부족해지는 조건을 찾습니다. 저장소 읽기, CPU 전처리, GPU 전송을 따라가며 캐시·프리페치·병렬 로딩을 적용할 지점을 판단해 보세요.',
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
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
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
  nodeExample: {
    id: 'storage-cpu-gpu',
    title: '학습 데이터가 GPU에 도착하는 경로 연결하기',
    prompt:
      '저장소·CPU·GPU의 역할을 보고 데이터가 이동할 방향을 정하세요. 처음에는 연결선이 없습니다. 원하는 노드의 출력과 입력을 연결한 뒤 연결 확인을 눌러 보세요.',
    nodes: [
      {
        id: 'storage',
        title: '저장소',
        purpose: '학습에 사용할 원본 이미지나 텍스트 파일을 보관합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'cpu',
        title: 'CPU',
        purpose: '파일을 읽고 디코딩·전처리한 뒤, 배치를 호스트 메모리에 준비합니다.',
        x: 300,
        y: 0,
      },
      {
        id: 'gpu',
        title: 'GPU',
        purpose: '전달받은 배치로 모델의 학습 계산을 수행합니다.',
        x: 600,
        y: 0,
      },
    ],
    links: [
      {
        id: 'storage-cpu',
        source: 'storage',
        target: 'cpu',
        label: '원본 데이터',
        detail: 'CPU의 데이터 로더가 저장소에서 원본 파일을 읽어 디코딩과 전처리를 수행합니다.',
        material: 'data',
      },
      {
        id: 'cpu-gpu',
        source: 'cpu',
        target: 'gpu',
        label: '준비된 배치',
        detail: 'CPU에서 전처리해 호스트 메모리에 준비한 배치를 GPU 메모리로 전송합니다.',
        material: 'data',
      },
    ],
    practiceHint:
      '원본 파일을 학습용 배치로 바꾸는 역할과 그 배치로 계산하는 역할을 구분하세요. 각 노드의 출력과 입력을 연결한 뒤 연결 확인을 눌러 보세요.',
    nextLesson: 'pv-pvc',
    kind: '자료 전달',
    afterSection: 1,
  },
  activityView: {
    type: 'io',
    title: 'I/O 병목을 줄이는 네 가지 흐름',
    instruction:
      '방법을 고르고 배치를 준비하는 시간, 데이터를 읽는 위치, 파일 요청 횟수를 비교하세요.',
  },
  activity: {
    kind: 'io',
    fields: [],
    question: '현재 배치를 GPU가 계산하는 동안 다음 배치를 준비하는 방식은?',
    options: [
      {
        value: 'a',
        label: 'Prefetch · 현재 계산과 다음 배치 준비를 겹친다',
      },
      {
        value: 'b',
        label: '병렬 데이터 로더 · 여러 배치를 미리 읽고 전처리한다',
      },
      {
        value: 'c',
        label: 'Cache · 반복해서 읽는 데이터를 가까운 저장 공간에 보관한다',
      },
      {
        value: 'd',
        label: 'Sharding · 많은 작은 파일을 큰 묶음으로 구성해 요청 횟수를 줄인다',
      },
    ],
    correct: 'a',
    explanation:
      '정답은 Prefetch입니다. 병렬 데이터 로더의 핵심은 여러 배치의 읽기·전처리를 동시에 수행하는 것이고, Prefetch의 핵심은 현재 계산과 다음 배치 준비를 겹치는 것입니다. Cache는 가까운 저장 공간의 데이터를 재사용하고, Sharding은 작은 파일을 묶어 요청 횟수를 줄입니다. 네 방식은 함께 사용할 수도 있습니다.',
    task: '데이터 공급을 개선하는 네 가지 방법을 비교하세요.',
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
