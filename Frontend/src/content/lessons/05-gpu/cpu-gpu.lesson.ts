import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cpu-gpu',
  unit: 4,
  order: 2,
  title: '딥러닝에서 GPU를 사용하는 이유',
  summary: '작업 수와 병렬 처리량을 바꿔 CPU·GPU의 처리 시간을 비교합니다.',
  scenario:
    '비교 활동에서 연산 개수와 GPU 준비 비용을 바꾸고, 데이터 전송을 포함한 전체 시간을 비교합니다. 어떤 조건에서 GPU의 병렬 처리가 준비 비용을 상쇄하는지 확인해 보세요.',
  concepts: ['입력 데이터', 'CPU 또는 GPU', '연산 결과'],
  assessment: {
    question: '병렬화 가능한 연산이 충분히 많아질 때 GPU가 유리한 이유는?',
    options: ['여러 연산을 동시에 처리하는 처리량', '어떤 작업도 준비 비용 없이 실행해서'],
    correct: 0,
    explanation:
      'GPU는 워프 단위로 같은 명령을 수많은 스레드에 동시에 적용해 처리량을 높입니다. 개별 코어가 CPU보다 빠른 것은 아니며, 데이터 전송과 커널 실행 준비 비용이 있으므로 그 비용을 상쇄할 만큼 작업이 많아야 이득이 납니다.',
  },
  advanced: [
    {
      title: '심화 · Tensor Core는 무엇을 한 번에 계산하나',
      body: 'Tensor Core는 작은 행렬 조각(예: 4×4 또는 그보다 큰 타일)에 대해 D = A × B + C를 한 번의 명령으로 계산하는 전용 장치입니다. 큰 행렬 곱셈은 cuBLAS 같은 라이브러리가 행렬을 타일로 나누어 이 연산을 반복해 계산합니다. 세대마다 지원 정밀도가 늘어 Volta는 FP16, Ampere는 BF16·TF32, Hopper는 FP8, Blackwell은 FP4를 지원합니다.',
    },
    {
      title: '심화 · 워프 분기 발산 (warp divergence)',
      body: '한 워프의 32개 스레드는 같은 명령을 함께 실행합니다. 코드에 if 분기가 있고 워프 안의 스레드가 서로 다른 경로를 타면, GPU는 한 경로를 실행하는 동안 다른 경로의 스레드를 쉬게 하고 이어서 다른 경로를 실행합니다. 분기가 많은 코드가 GPU에서 느린 이유이며, 딥러닝 연산처럼 모든 원소에 같은 계산을 하는 작업이 GPU에 잘 맞는 이유이기도 합니다.',
    },
  ],
  caution:
    'GPU는 같은 연산을 많은 데이터에 동시에 적용할 때 빠릅니다. 작은 작업에서는 데이터 전송과 커널 실행 준비 비용이 이득보다 클 수 있으므로 전체 실행 시간으로 비교합니다.',
  reflection:
    'CPU로 10ms 걸리는 작은 전처리를 GPU로 옮겼더니 오히려 느려졌습니다. 어떤 비용이 늘었을지, 무엇을 측정해 확인하겠습니까?',
  references: [
    {
      title: '원문 · MLOps 3주차 · 실제 도구 실습',
      url: 'https://www.notion.so/5f3ebb1cb38a83f4a40181082cca16c0',
    },
    {
      title: '공식 자료 · CUDA C++ Programming Guide',
      url: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html',
    },
    {
      title: '공식 자료 · CUDA C++ Best Practices Guide',
      url: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
  activityView: {
    type: 'numbers',
    title: '언제 GPU의 준비 비용을 상쇄할까요?',
    instruction: '연산 1개와 128개를 비교해 같은 작업의 상대 처리 시간이 어떻게 달라지는지 보세요.',
  },
  activity: {
    kind: 'compute',
    fields: [
      {
        id: 'jobs',
        label: '연산 개수',
        initial: 32,
        min: 1,
        max: 128,
        step: 1,
        help: '작은 작업과 큰 작업을 비교하세요.',
      },
      {
        id: 'width',
        label: 'GPU 병렬 처리 폭',
        initial: 16,
        min: 1,
        max: 32,
        step: 1,
        help: '한 번에 처리하는 작업 수의 예시입니다.',
      },
      {
        id: 'setup',
        label: 'GPU 준비 비용',
        initial: 5,
        min: 0,
        max: 30,
        step: 1,
        help: '전송과 커널 실행 준비를 단순화했습니다.',
      },
    ],
    question: '병렬화 가능한 연산이 충분히 많아질 때 GPU가 유리한 이유는?',
    options: [
      {
        value: 'a',
        label: '여러 연산을 동시에 처리하는 처리량',
      },
      {
        value: 'b',
        label: '어떤 작업도 준비 비용 없이 실행해서',
      },
    ],
    correct: 'a',
    explanation: '병렬 처리로 준비 비용을 상쇄할 만큼 작업이 많아야 합니다.',
    task: '연산 개수를 줄였다가 늘려 시간 차이를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '입력 데이터',
      detail: '딥러닝에서 GPU를 사용하는 이유 · 1번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n1',
      title: 'CPU 또는 GPU',
      detail: '딥러닝에서 GPU를 사용하는 이유 · 2번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n2',
      title: '연산 결과',
      detail: '딥러닝에서 GPU를 사용하는 이유 · 3번째 구성 요소',
      tone: '#9d85d7',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'jobs',
      label: '연산 개수',
      initial: 32,
      min: 1,
      max: 128,
      step: 1,
      help: '작은 작업과 큰 작업을 비교하세요.',
    },
    {
      id: 'width',
      label: 'GPU 병렬 처리 폭',
      initial: 16,
      min: 1,
      max: 32,
      step: 1,
      help: '한 번에 처리하는 작업 수의 예시입니다.',
    },
    {
      id: 'setup',
      label: 'GPU 준비 비용',
      initial: 5,
      min: 0,
      max: 30,
      step: 1,
      help: '전송과 커널 실행 준비를 단순화했습니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
