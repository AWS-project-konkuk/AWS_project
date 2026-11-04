import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'gpu-specs-accumulation',
  unit: 4,
  order: 1,
  title: 'GPU 사양과 유효 배치 크기 읽기',
  summary:
    '배치를 늘렸더니 OOM이 발생합니다. GPU 수를 늘리기 전에 어떤 메모리가 필요한지, 배치를 나누어 계산할 수 있는지 판단합니다.',
  scenario:
    '배치를 늘렸더니 OOM이 발생합니다. GPU 수를 늘리기 전에 어떤 메모리가 필요한지, 배치를 나누어 계산할 수 있는지 판단합니다.',
  concepts: ['GPU로 학습하기', 'GPU 사양과 유효 배치 크기 읽기'],
  assessment: {
    question: '기울기 누적이 직접 줄이려는 부담은?',
    options: [
      '한 번에 처리하는 마이크로 배치의 활성값 메모리',
      '각 GPU에 올라가는 모델 파라미터를 자동 분할하는 부담',
    ],
    correct: 0,
    explanation:
      '작은 마이크로 배치로 forward·backward를 여러 번 수행하고 그래디언트를 누적한 뒤 optimizer step을 수행할 수 있습니다. 단일 장치의 유효 배치는 마이크로 배치 × 누적 횟수로 이해합니다. 큰 배치와 완전히 같은 수치 결과를 항상 보장하지 않으며 정규화·학습률·처리량도 확인합니다.',
  },
  advanced: [
    {
      title: '심화 · CUDA 메모리 계층',
      body: 'Register는 스레드 전용의 빠른 저장 공간이며 Shared Memory는 블록 안에서 협력하는 스레드가 공유합니다. Global Memory는 장치 전체에서 접근할 수 있는 큰 메모리입니다. Local Memory는 이름과 달리 장치 메모리에 놓일 수 있습니다. Grid·Block·Thread라는 실행 조직과 물리 코어를 일대일로 대응시키지 않습니다.',
    },
  ],
  caution:
    '혼합 정밀도가 전체 메모리를 항상 절반으로 줄이지는 않습니다. 일반 데이터 병렬은 전체 모델 상태를 GPU마다 복제합니다. 모델 상태를 나누는 전략과 통신 비용을 함께 비교해야 합니다.',
  reflection: '기울기 누적이 직접 줄이려는 부담은?',
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
});
