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
    '본문 코드에서 유효 배치 32를 마이크로배치 8씩 네 번 계산하는 과정을 따라갑니다. VRAM, 메모리 대역폭, 연산 처리량, GPU 간 연결이 각각 어떤 제약을 설명하는지도 구분합니다.',
  concepts: ['GPU로 학습하기', 'GPU 사양과 유효 배치 크기 읽기'],
  assessment: {
    question: '기울기 누적이 직접 줄이려는 부담은?',
    options: [
      '한 번에 처리하는 마이크로 배치의 활성값 메모리',
      '모델 파라미터와 옵티마이저 상태가 차지하는 메모리',
    ],
    correct: 0,
    explanation:
      '큰 배치를 마이크로배치로 나누어 순차 처리하면 동시에 메모리에 있는 활성값이 마이크로배치 한 개 몫으로 줄어듭니다. 파라미터·기울기·옵티마이저 상태는 배치 크기와 무관해 그대로 남습니다. 유효 배치는 마이크로배치 × 누적 횟수이고, 데이터 병렬이면 GPU 수도 곱합니다.',
  },
  advanced: [
    {
      title: '심화 · 배치를 키우면 학습률도 바뀐다',
      body: '유효 배치를 k배로 키우면 한 epoch의 step 수가 1/k로 줄어듭니다. 대규모 배치 학습에서는 학습률을 배치에 비례해 키우는 선형 스케일링과, 학습 초반 몇 epoch 동안 학습률을 서서히 올리는 warmup을 함께 쓰는 것이 일반적입니다. 배치가 지나치게 크면 일반화 성능이 떨어진다는 보고도 있어, 처리량만 보고 배치를 정하지 않고 검증 성능을 함께 확인합니다.',
    },
    {
      title: '심화 · 활성값 재계산 (activation checkpointing)',
      body: '순전파 중 일부 레이어의 활성값을 저장하지 않고 버린 뒤, 역전파 때 해당 구간의 순전파를 다시 계산하는 방법입니다. 기울기 누적처럼 활성값 메모리를 줄이지만, 마이크로배치를 줄이지 않고도 적용할 수 있습니다. 대신 순전파를 한 번 더 하므로 계산 시간이 대략 20~30% 늘어납니다. PyTorch에서는 torch.utils.checkpoint로 사용합니다.',
    },
  ],
  caution:
    '기울기 누적은 활성값 메모리만 줄입니다. 파라미터·기울기·옵티마이저 상태는 배치와 무관하게 남고, 혼합 정밀도도 전체 메모리를 절반으로 줄이지는 않습니다. 일반 데이터 병렬은 모델 상태를 GPU마다 복제하므로 상태를 나누는 전략과 통신 비용을 함께 비교해야 합니다.',
  reflection:
    '배치를 4배로 늘렸더니 OOM이 납니다. 마이크로배치와 누적 횟수를 어떻게 정하겠으며, 그래도 OOM이 난다면 무엇을 의심하겠습니까?',
  references: [
    {
      title: '원문 · MLOps 3주차 · 실제 도구 실습',
      url: 'https://www.notion.so/5f3ebb1cb38a83f4a40181082cca16c0',
    },
    {
      title: '공식 자료 · NVIDIA H100',
      url: 'https://www.nvidia.com/en-us/data-center/h100/',
    },
    {
      title: '공식 자료 · NVIDIA H200',
      url: 'https://www.nvidia.com/en-us/data-center/h200/',
    },
    {
      title: '논문 · 대규모 배치 학습과 학습률 조정 (Goyal 외)',
      url: 'https://arxiv.org/abs/1706.02677',
    },
    {
      title: '공식 자료 · PyTorch 분산 학습 개요',
      url: 'https://docs.pytorch.org/tutorials/beginner/dist_overview.html',
    },
  ],
  sourceWeek: 3,
  mapStages: ['training'],
});
