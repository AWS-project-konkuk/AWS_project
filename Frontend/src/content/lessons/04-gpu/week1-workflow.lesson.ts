import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week1-workflow',
  unit: 4,
  order: 8,
  title: 'GPU 두 장으로 큰 모델 학습하기',
  summary:
    '주차 종합 실습 · GPU 수의 합계와 한 장에 필요한 메모리는 다릅니다. 무엇을 분할하고 어떤 결과를 주고받는지가 전략을 결정합니다.',
  minutes: 18,
  scenario:
    '모델·데이터를 할당하고 워커의 출력을 연결하세요. 데이터 병렬의 실패를 관찰한 뒤 레이어 또는 텐서 분할로 메모리를 맞추고 통신 비용을 비교하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 빠른 저장 공간이며 Shared Memory는 블록 안에서 협력하는 스레드가 공유합니다. Global Memory는 장치 전체에서 접근할 수 있는 큰 메모리입니다. Local Memory는 이름과 달리 장치 메모리에 놓일 수 있습니다. Grid·Block·Thread라는 실행 조직과 물리 코어를 일대일로 대응시키지 않습니다.',
    },
  ],
  caution:
    '일반 데이터 병렬은 모델을 복제합니다. 모델·텐서 병렬은 모델 내부를 나누지만 전송·동기화 비용도 고려해야 합니다.',
  reflection: 'GPU를 두 장으로 늘렸는데 데이터 병렬에서 OOM이 계속 난 이유는?',
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
  workflow: 'week1-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'data',
      title: '학습 데이터',
      detail: '64개 표본을 워커에 할당합니다.',
    },
    {
      id: 'model',
      title: '초기 모델',
      detail: '학습 상태를 복제하거나 분할합니다.',
    },
    {
      id: 'split',
      title: '작업 할당',
      detail: '전략에 따라 데이터·레이어·행렬을 분할합니다.',
    },
    {
      id: 'gpu1',
      title: 'GPU 워커 1',
      detail: '할당된 부분을 계산하고 결과를 전달합니다.',
    },
    {
      id: 'gpu2',
      title: 'GPU 워커 2',
      detail: '두 번째 장치의 실제 입력을 확인하세요.',
    },
    {
      id: 'merge',
      title: '결과 동기화',
      detail: '기울기 평균 또는 부분 결과를 결합합니다.',
    },
    {
      id: 'save',
      title: '체크포인트',
      detail: '완료한 모델 상태를 보관합니다.',
    },
  ],
  fields: [
    {
      id: 'strategy',
      label: '분산 전략',
      initial: 'data',
      options: [
        {
          value: 'data',
          label: '데이터 병렬',
        },
        {
          value: 'model',
          label: '모델 병렬 · 레이어 분할',
        },
        {
          value: 'tensor',
          label: '텐서 병렬',
        },
      ],
      help: '전략을 바꾸면 워커가 주고받아야 할 자료와 연결도 달라집니다.',
    },
    {
      id: 'vram',
      label: 'GPU당 VRAM (GiB)',
      initial: 16,
      min: 4,
      max: 48,
      step: 1,
      help: '각 워커 한 장의 용량입니다.',
    },
    {
      id: 'model',
      label: '모델 학습 상태 (GiB)',
      initial: 24,
      min: 4,
      max: 64,
      step: 1,
      help: '가중치·기울기·옵티마이저 등을 합친 예시입니다.',
    },
    {
      id: 'communication',
      label: '장치 간 통신 비용',
      initial: 4,
      min: 0,
      max: 24,
      step: 1,
      help: '상대 시간이며 실제 성능 측정치가 아닙니다.',
    },
  ],
});
