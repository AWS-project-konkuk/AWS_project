import type { NodeKind, Port } from '../workflow/types';

export interface StageDefinition {
  kind: NodeKind;
  title: string;
  english: string;
  color: string;
  description: string;
  question: string;
  inputs: Port[];
  outputs: Port[];
  source: { title: string; url: string };
}

export const stages: StageDefinition[] = [
  {
    kind: 'dataset',
    title: '데이터셋',
    english: 'Dataset',
    color: '#518f81',
    description:
      '학습의 출발점입니다. 데이터의 출처와 버전을 기록해야 어떤 데이터로 모델을 만들었는지 추적하고 같은 실험을 재현할 수 있습니다.',
    question: '데이터가 바뀌었을 때, 이전 모델이 어떤 데이터로 만들어졌는지 알 수 있을까요?',
    inputs: [],
    outputs: [{ id: 'raw', label: '원본 데이터' }],
    source: { title: 'AWS · MLOps의 버전 관리', url: 'https://aws.amazon.com/what-is/mlops/' },
  },
  {
    kind: 'preprocess',
    title: '전처리',
    english: 'Preprocessing',
    color: '#718ba1',
    description:
      '원본을 학습 가능한 형태로 정리합니다. 이 과제에서는 데이터를 학습용과 평가용으로 나누고, 학습용 데이터로 정한 변환을 평가용에도 적용한 결과를 제공합니다. 평가용 데이터는 학습에 사용하지 않습니다.',
    question: '학습에 사용한 데이터로만 평가한다면, 새로운 데이터에서의 성능을 믿을 수 있을까요?',
    inputs: [{ id: 'raw', label: '원본 데이터' }],
    outputs: [
      { id: 'train', label: '학습용 데이터' },
      { id: 'test', label: '평가용 데이터' },
    ],
    source: {
      title: 'Google · ML 파이프라인',
      url: 'https://developers.google.com/machine-learning/managing-ml-projects/pipelines',
    },
  },
  {
    kind: 'training',
    title: '모델 학습',
    english: 'Training',
    color: '#a28a62',
    description:
      '학습용 데이터에서 패턴을 찾아 모델을 만듭니다. 데이터 버전, 학습 설정, 결과 모델을 함께 기록하면 실험을 비교하고 재현하기 쉬워집니다.',
    question: '정확도가 다른 두 모델을 비교하려면 어떤 기록이 함께 필요할까요?',
    inputs: [{ id: 'train', label: '학습용 데이터' }],
    outputs: [{ id: 'model', label: '학습된 모델' }],
    source: { title: 'AWS · 학습과 실험 추적', url: 'https://aws.amazon.com/what-is/mlops/' },
  },
  {
    kind: 'evaluation',
    title: '모델 평가',
    english: 'Evaluation',
    color: '#9a7ca4',
    description:
      '학습된 모델을 별도로 남겨둔 평가용 데이터로 검사합니다. 이 과제에서는 정확도가 설정한 기준 이상이어야 모델을 등록하도록 정했습니다. 실제 운영에서는 여러 지표와 검증 조건을 함께 고려합니다.',
    question: '새 모델을 만들었다는 이유만으로 바로 운영에 배포해도 될까요?',
    inputs: [
      { id: 'model', label: '학습된 모델' },
      { id: 'test', label: '평가용 데이터' },
    ],
    outputs: [{ id: 'approved', label: '기준 통과 모델' }],
    source: {
      title: 'Google · 모델 검증과 배포',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  },
  {
    kind: 'registry',
    title: '모델 등록',
    english: 'Model registry',
    color: '#758d66',
    description:
      '검증을 통과한 모델에 버전을 부여해 관리합니다. 어떤 평가 결과와 데이터에서 나온 모델인지 연결해두면 배포할 버전을 선택하거나 이전 버전으로 돌아갈 수 있습니다.',
    question: '운영 모델에 문제가 생겼을 때 어떤 버전으로 돌아가야 할까요?',
    inputs: [{ id: 'approved', label: '기준 통과 모델' }],
    outputs: [{ id: 'registered', label: '등록된 모델' }],
    source: { title: 'AWS · 모델 레지스트리', url: 'https://aws.amazon.com/what-is/mlops/' },
  },
  {
    kind: 'serving',
    title: '모델 서빙',
    english: 'Serving',
    color: '#b78068',
    description:
      '선택한 모델을 사용해 새로운 입력의 예측 결과를 제공합니다. 운영에서는 응답 속도와 오류뿐 아니라 모델 품질과 데이터 변화도 관찰하고 재학습 여부를 판단합니다.',
    question: '서비스가 정상 응답해도 예측 품질은 나빠질 수 있을까요?',
    inputs: [{ id: 'registered', label: '등록된 모델' }],
    outputs: [],
    source: { title: 'AWS · 모델 배포와 모니터링', url: 'https://aws.amazon.com/what-is/mlops/' },
  },
];

export const stageByKind = Object.fromEntries(stages.map((stage) => [stage.kind, stage])) as Record<
  NodeKind,
  StageDefinition
>;

export const quiz = [
  {
    question: '학습용 데이터와 평가용 데이터를 분리하는 이유는 무엇인가요?',
    answer: '학습에 사용하지 않은 데이터에 대한 일반화 성능을 확인하기 위해서입니다.',
  },
  {
    question: '평가 기준을 만족하지 못한 모델은 이 과제에서 어떻게 처리하나요?',
    answer: '모델 등록과 서빙을 중단하고 평가 결과를 확인합니다.',
  },
  {
    question: '데이터 버전과 모델 버전을 함께 기록하면 무엇이 좋은가요?',
    answer: '모델의 출처를 추적하고 실험을 재현하거나 이전 모델로 되돌릴 수 있습니다.',
  },
];
