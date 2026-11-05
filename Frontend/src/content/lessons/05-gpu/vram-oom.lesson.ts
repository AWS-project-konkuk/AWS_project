import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vram-oom',
  unit: 4,
  order: 4,
  title: 'VRAM이 부족하면 OOM이 발생한다',
  summary: '배치와 정밀도를 조절해 메모리 예산을 맞춥니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['배치 데이터', 'GPU 메모리', '학습 결과'],
  assessment: {
    question: '모델과 배치가 VRAM에 들어가지 않을 때 먼저 시도할 방법은?',
    options: ['마이크로 배치를 줄이고 메모리 사용을 다시 확인한다', '배치 크기를 더 키운다'],
    correct: 0,
    explanation: '배치를 줄이면 활성값 메모리를 줄일 수 있습니다.',
  },
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 빠른 저장 공간이며 Shared Memory는 블록 안에서 협력하는 스레드가 공유합니다. Global Memory는 장치 전체에서 접근할 수 있는 큰 메모리입니다. Local Memory는 이름과 달리 장치 메모리에 놓일 수 있습니다. Grid·Block·Thread라는 실행 조직과 물리 코어를 일대일로 대응시키지 않습니다.',
    },
  ],
  caution: '배치를 줄이면 활성값 메모리를 줄일 수 있습니다.',
  reflection: '모델과 배치가 VRAM에 들어가지 않을 때 먼저 시도할 방법은?',
  references: [
    {
      title: '원문 · MLOps 3주차 · 실제 도구 실습',
      url: 'https://www.notion.so/5f3ebb1cb38a83f4a40181082cca16c0',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.pytorch.org/tutorials/beginner/dist_overview.html',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
  activity: {
    kind: 'memory',
    fields: [
      {
        id: 'batch',
        label: '마이크로 배치',
        initial: 32,
        min: 1,
        max: 64,
        step: 1,
        help: '배치를 줄여 활성값 크기를 비교하세요.',
      },
      {
        id: 'vram',
        label: 'VRAM (GiB)',
        initial: 8,
        min: 4,
        max: 32,
        step: 1,
        help: '총 메모리 예산입니다.',
      },
      {
        id: 'precision',
        label: '정밀도',
        initial: 'fp32',
        options: [
          {
            value: 'fp32',
            label: 'FP32',
          },
          {
            value: 'amp',
            label: '혼합 정밀도',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
      {
        id: 'accumulation',
        label: '기울기 누적 횟수',
        initial: 1,
        min: 1,
        max: 8,
        step: 1,
        help: '유효 배치 = 마이크로 배치 × 누적 횟수',
      },
    ],
    question: '모델과 배치가 VRAM에 들어가지 않을 때 먼저 시도할 방법은?',
    options: [
      {
        value: 'a',
        label: '마이크로 배치를 줄이고 메모리 사용을 다시 확인한다',
      },
      {
        value: 'b',
        label: '배치 크기를 더 키운다',
      },
    ],
    correct: 'a',
    explanation: '배치를 줄이면 활성값 메모리를 줄일 수 있습니다.',
    task: 'OOM 상태와 메모리에 들어가는 상태를 각각 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '배치 데이터',
      detail: 'VRAM이 부족하면 OOM이 발생한다 · 1번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n1',
      title: 'GPU 메모리',
      detail: 'VRAM이 부족하면 OOM이 발생한다 · 2번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n2',
      title: '학습 결과',
      detail: 'VRAM이 부족하면 OOM이 발생한다 · 3번째 구성 요소',
      tone: '#9d85d7',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'batch',
      label: '마이크로 배치',
      initial: 32,
      min: 1,
      max: 64,
      step: 1,
      help: '배치를 줄여 활성값 크기를 비교하세요.',
    },
    {
      id: 'vram',
      label: 'VRAM (GiB)',
      initial: 8,
      min: 4,
      max: 32,
      step: 1,
      help: '총 메모리 예산입니다.',
    },
    {
      id: 'precision',
      label: '정밀도',
      initial: 'fp32',
      options: [
        {
          value: 'fp32',
          label: 'FP32',
        },
        {
          value: 'amp',
          label: '혼합 정밀도',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
    {
      id: 'accumulation',
      label: '기울기 누적 횟수',
      initial: 1,
      min: 1,
      max: 8,
      step: 1,
      help: '유효 배치 = 마이크로 배치 × 누적 횟수',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
