import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vram-oom',
  unit: 4,
  order: 4,
  title: 'VRAM이 부족하면 OOM이 발생한다',
  summary: '배치와 정밀도를 조절해 메모리 예산을 맞춥니다.',
  scenario:
    '가중치, 활성값, 기울기, 옵티마이저 상태를 나눠 메모리 사용량을 계산합니다. 활동에서 마이크로 배치와 정밀도를 바꿔 GPU 메모리를 초과한 원인과 줄일 수 있는 항목을 확인해 보세요.',
  concepts: ['배치 데이터', 'GPU 메모리', '학습 결과'],
  assessment: {
    question: '모델과 배치가 VRAM에 들어가지 않을 때 먼저 시도할 방법은?',
    options: ['마이크로 배치를 줄이고 메모리 사용을 다시 확인한다', '배치 크기를 더 키운다'],
    correct: 0,
    explanation:
      '배치를 줄이면 배치에 비례하는 활성값 메모리가 줄어듭니다. 유효 배치를 유지하려면 기울기 누적을 함께 쓰고, 혼합 정밀도로 활성값을 더 줄일 수 있습니다. 배치를 줄여도 OOM이 계속되면 모델 상태 자체가 큰 것이므로 상태 분할을 검토합니다.',
  },
  advanced: [
    {
      title: '심화 · FP16과 BF16의 차이',
      body: 'FP16은 지수 5비트·가수 10비트, BF16은 지수 8비트·가수 7비트를 씁니다. BF16은 FP32와 지수 비트가 같아 표현 범위가 넓으므로 작은 기울기가 0이 되는 일이 드물어 loss scaling이 보통 필요 없습니다. 대신 가수가 짧아 정밀도는 FP16보다 낮습니다. A100 이후 GPU는 BF16을 지원하고, T4처럼 이전 세대 GPU는 FP16만 Tensor Core로 가속합니다.',
    },
    {
      title: '심화 · 메모리 단편화',
      body: 'PyTorch의 캐싱 할당기는 해제된 블록을 재사용하지만, 크기가 제각각인 텐서를 자주 만들고 지우면 빈 공간이 조각나 큰 텐서를 할당하지 못할 수 있습니다. 이때는 reserved가 allocated보다 크게 남아 있는데도 OOM이 납니다. torch.cuda.memory_summary()로 상태를 확인하고, PYTORCH_CUDA_ALLOC_CONF 환경 변수로 할당 방식을 조정할 수 있습니다.',
    },
  ],
  caution:
    '혼합 정밀도는 주로 활성값과 연산 시간을 줄이며, FP32로 유지되는 가중치·기울기·옵티마이저 상태는 그대로 남습니다. empty_cache()는 빈 캐시만 반납하므로 참조 중인 텐서 때문에 생긴 OOM을 해결하지 못합니다.',
  reflection:
    '배치를 1로 줄였는데도 OOM이 납니다. 무엇이 VRAM을 차지하고 있다고 보겠으며, 다음으로 어떤 방법을 고르겠습니까?',
  references: [
    {
      title: '원문 · MLOps 3주차 · 실제 도구 실습',
      url: 'https://www.notion.so/5f3ebb1cb38a83f4a40181082cca16c0',
    },
    {
      title: '공식 자료 · PyTorch Automatic Mixed Precision',
      url: 'https://docs.pytorch.org/docs/stable/amp.html',
    },
    {
      title: '공식 자료 · PyTorch CUDA semantics (메모리 관리)',
      url: 'https://docs.pytorch.org/docs/stable/notes/cuda.html',
    },
    {
      title: '논문 · Mixed Precision Training',
      url: 'https://arxiv.org/abs/1710.03740',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
  activityView: {
    type: 'numbers',
    title: '유효 배치를 유지하면서 OOM을 피할 수 있을까요?',
    instruction: '같은 VRAM에서 마이크로 배치를 줄이고 기울기 누적을 늘려 보세요.',
    note: '이 모형은 고정 상태와 활성값만 더합니다. 실제 학습의 임시 공간과 할당기 오버헤드는 별도입니다.',
  },
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
