import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cpu-gpu',
  unit: 4,
  order: 2,
  title: '딥러닝에서 GPU를 사용하는 이유',
  summary: '작업 수와 병렬 처리량을 바꿔 CPU·GPU의 처리 시간을 비교합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['입력 데이터', 'CPU 또는 GPU', '연산 결과'],
  assessment: {
    question: '병렬화 가능한 연산이 충분히 많아질 때 GPU가 유리한 이유는?',
    options: ['여러 연산을 동시에 처리하는 처리량', '어떤 작업도 준비 비용 없이 실행해서'],
    correct: 0,
    explanation: '병렬 처리로 준비 비용을 상쇄할 만큼 작업이 많아야 합니다.',
  },
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 빠른 저장 공간이며 Shared Memory는 블록 안에서 협력하는 스레드가 공유합니다. Global Memory는 장치 전체에서 접근할 수 있는 큰 메모리입니다. Local Memory는 이름과 달리 장치 메모리에 놓일 수 있습니다. Grid·Block·Thread라는 실행 조직과 물리 코어를 일대일로 대응시키지 않습니다.',
    },
  ],
  caution: '병렬 처리로 준비 비용을 상쇄할 만큼 작업이 많아야 합니다.',
  reflection: '병렬화 가능한 연산이 충분히 많아질 때 GPU가 유리한 이유는?',
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
