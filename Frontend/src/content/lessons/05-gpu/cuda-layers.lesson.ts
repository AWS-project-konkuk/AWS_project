import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cuda-layers',
  unit: 4,
  order: 3,
  title: 'CUDA는 프레임워크와 GPU를 잇는다',
  summary: 'PyTorch의 연산 요청이 GPU에 도달하는 계층을 따라갑니다.',
  scenario:
    '비교 활동에서 PyTorch, 연산 라이브러리, CUDA Runtime과 드라이버를 차례로 선택해 각 계층의 역할을 확인합니다. PyTorch가 사용하는 CUDA 버전과 드라이버가 지원하는 버전을 어떻게 읽는지도 살펴보세요.',
  concepts: ['PyTorch', 'CUDA 계층', 'NVIDIA GPU'],
  assessment: {
    question: 'CUDA 드라이버와 라이브러리의 역할에 맞는 설명은?',
    options: ['모델의 정확도를 자동으로 높인다', '프레임워크의 연산을 GPU 실행으로 연결한다'],
    correct: 1,
    explanation:
      'cuBLAS·cuDNN 같은 라이브러리는 연산을 GPU에 맞게 최적화해 제공하고, Runtime은 메모리 할당과 커널 실행을, Driver는 하드웨어 제어를 맡습니다. CUDA는 연산 실행 환경이며 모델의 정확도를 보장하지 않습니다.',
  },
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 가장 빠른 저장 공간이며 Shared Memory는 같은 Block 안의 스레드가 공유합니다. L2 캐시는 모든 SM이 공유하고, Global Memory(VRAM)는 장치 전체에서 접근할 수 있는 가장 큰 메모리입니다. Local Memory는 이름과 달리 레지스터가 부족할 때 VRAM에 놓이는 스레드 전용 공간입니다. Grid·Block·Thread라는 실행 조직을 물리 코어와 일대일로 대응시키지 않습니다.',
    },
    {
      title: '심화 · 컨테이너에서 GPU를 쓰는 방법',
      body: '컨테이너 이미지에는 프레임워크와 CUDA Runtime을 담고, 드라이버는 호스트의 것을 사용합니다. NVIDIA Container Toolkit이 컨테이너를 시작할 때 호스트의 드라이버 라이브러리와 장치 파일을 연결해 줍니다. 쿠버네티스에서는 NVIDIA Device Plugin이 노드의 GPU를 nvidia.com/gpu 자원으로 등록해야 파드가 GPU를 요청할 수 있습니다.',
    },
  ],
  caution:
    'nvidia-smi의 CUDA Version은 드라이버가 지원하는 최대 버전이며 설치된 Toolkit 버전이 아닙니다. 장치 인식 문제와 연산 실행 문제를 구분해 계층별로 확인합니다.',
  reflection:
    '컨테이너 안에서 torch.cuda.is_available()이 False입니다. 어느 계층부터 어떤 명령으로 확인하겠습니까?',
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
      title: '공식 자료 · PyTorch 설치 (CUDA 버전 선택)',
      url: 'https://pytorch.org/get-started/locally/',
    },
    {
      title: '공식 자료 · NVIDIA Container Toolkit',
      url: 'https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/index.html',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
  activityView: {
    type: 'structure',
    title: '프레임워크의 연산 요청은 어떻게 GPU까지 갈까요?',
    instruction: '계층을 고르면 전체 경로에서 그 위치가 강조됩니다.',
  },
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
