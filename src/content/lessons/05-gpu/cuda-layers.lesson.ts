import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cuda-layers',
  unit: 4,
  order: 3,
  title: 'CUDA는 프레임워크와 GPU를 잇는다',
  summary: 'PyTorch의 연산 요청이 GPU에 도달하는 계층을 따라갑니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['PyTorch', 'CUDA 계층', 'NVIDIA GPU'],
  assessment: {
    question: 'CUDA 드라이버와 라이브러리의 역할에 맞는 설명은?',
    options: ['모델의 정확도를 자동으로 높인다', '프레임워크의 연산을 GPU 실행으로 연결한다'],
    correct: 1,
    explanation: 'CUDA는 연산 실행 환경이며 정확도를 자동 보장하지 않습니다.',
  },
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 빠른 저장 공간이며 Shared Memory는 블록 안에서 협력하는 스레드가 공유합니다. Global Memory는 장치 전체에서 접근할 수 있는 큰 메모리입니다. Local Memory는 이름과 달리 장치 메모리에 놓일 수 있습니다. Grid·Block·Thread라는 실행 조직과 물리 코어를 일대일로 대응시키지 않습니다.',
    },
  ],
  caution: 'CUDA는 연산 실행 환경이며 정확도를 자동 보장하지 않습니다.',
  reflection: 'CUDA 드라이버와 라이브러리의 역할에 맞는 설명은?',
  references: [
    {
      title: '원문 · MLOps 3주차 · 실제 도구 실습',
      url: 'https://www.notion.so/5f3ebb1cb38a83f4a40181082cca16c0',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.pytorch.org/tutorials/beginner/dist_overview.html',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
  activity: {
    kind: 'layers',
    fields: [
      {
        id: 'layer',
        label: '살펴볼 계층',
        initial: 'framework',
        options: [
          {
            value: 'framework',
            label: 'ML 프레임워크',
          },
          {
            value: 'library',
            label: 'CUDA 라이브러리',
          },
          {
            value: 'runtime',
            label: 'CUDA Runtime',
          },
          {
            value: 'driver',
            label: 'CUDA Driver',
          },
          {
            value: 'hardware',
            label: 'GPU 하드웨어',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'CUDA 드라이버와 라이브러리의 역할에 맞는 설명은?',
    options: [
      {
        value: 'b',
        label: '모델의 정확도를 자동으로 높인다',
      },
      {
        value: 'a',
        label: '프레임워크의 연산을 GPU 실행으로 연결한다',
      },
    ],
    correct: 'a',
    explanation: 'CUDA는 연산 실행 환경이며 정확도를 자동 보장하지 않습니다.',
    task: '계층을 선택하고 연산 요청의 전달을 따라가세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'PyTorch',
      detail: 'CUDA는 프레임워크와 GPU를 잇는다 · 1번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n1',
      title: 'CUDA 계층',
      detail: 'CUDA는 프레임워크와 GPU를 잇는다 · 2번째 구성 요소',
      tone: '#9d85d7',
    },
    {
      id: 'n2',
      title: 'NVIDIA GPU',
      detail: 'CUDA는 프레임워크와 GPU를 잇는다 · 3번째 구성 요소',
      tone: '#9d85d7',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'layer',
      label: '살펴볼 계층',
      initial: 'framework',
      options: [
        {
          value: 'framework',
          label: 'ML 프레임워크',
        },
        {
          value: 'library',
          label: 'CUDA 라이브러리',
        },
        {
          value: 'runtime',
          label: 'CUDA Runtime',
        },
        {
          value: 'driver',
          label: 'CUDA Driver',
        },
        {
          value: 'hardware',
          label: 'GPU 하드웨어',
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
