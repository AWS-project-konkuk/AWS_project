import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week3-workflow',
  unit: 2,
  order: 6,
  title: 'GPU까지 끊기지 않는 데이터 공급',
  summary:
    '앞에서 배운 파일 수명·저장소 선택·Object Storage·I/O 병목·PV와 PVC를 하나의 노드 흐름으로 연결하고, 설정을 바꿔 결과를 비교합니다.',
  minutes: 20,
  scenario:
    '원본에서 모델 보관까지 노드를 연결하세요. Pod 교체 시 캐시 손실을 먼저 확인하고, PVC 보존 경로와 캐시·샤딩 설정을 차례로 바꿔 GPU 공급 부족을 해결하세요.',
  concepts: [
    '파일 수명과 저장소 선택',
    'Object Storage와 모델 보관',
    'I/O 공급 병목',
    'PV·PVC 연결',
  ],
  advanced: [
    {
      title: '심화 · 보존 경로와 공급 경로를 따로 검증하기',
      body: 'Object Storage의 원본 버전, PVC로 연결한 캐시, 로더의 공급 속도를 각각 확인합니다. 원본을 복구할 수 있어도 학습 공급은 느릴 수 있고, 빠른 캐시가 있어도 원본 버전이 불명확하면 실험을 재현하기 어렵습니다.',
    },
  ],
  caution: '보관 효율과 학습 중 공급 성능은 다른 조건이며, PVC는 백업 기능이 아닙니다.',
  reflection: '원본을 Object Storage에 두면 GPU의 I/O 대기가 자동으로 없어질까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://cool-candle-658.notion.site/MLOps-4-02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'Kubernetes 공식 · PersistentVolume과 PersistentVolumeClaim',
      url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    },
    {
      title: 'AWS 공식 · EKS AI/ML 스토리지 선택',
      url: 'https://docs.aws.amazon.com/eks/latest/best-practices/aiml-storage.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  workflow: 'week3-workflow',
  experiment: '노드 연결 · 보존과 공급 비교',
  nodes: [
    {
      id: 'objects',
      title: 'Object Storage',
      detail: 'Object Storage에서 배운 원본 보관 역할입니다. train-v1 객체를 로더에 전달합니다.',
    },
    {
      id: 'pv',
      title: 'PV 볼륨',
      detail: '파일 수명에서 배운 Pod 밖의 저장 자원입니다. PVC에 캐시를 보관할 볼륨을 제공합니다.',
    },
    {
      id: 'pvc',
      title: 'PVC 요청',
      detail: 'PV·PVC에서 배운 저장 요청입니다. PV의 볼륨을 로더가 사용할 캐시 경로로 연결합니다.',
    },
    {
      id: 'loader',
      title: '데이터 로더',
      detail:
        'I/O 병목에서 배운 읽기·전처리 역할입니다. 캐시와 샤딩으로 GPU에 공급할 배치를 준비합니다.',
    },
    {
      id: 'gpu',
      title: 'GPU 학습',
      detail: '초당 100배치를 소비하는 학습 단계입니다. 공급량이 부족하면 데이터를 기다립니다.',
    },
    {
      id: 'artifact',
      title: '모델 보관',
      detail: '완성된 모델을 models/model-v1.bin 객체로 보관해 학습 Pod 밖에 결과를 남깁니다.',
    },
  ],
  fields: [
    {
      id: 'cache',
      label: '반복 읽기 캐시',
      initial: 'off',
      options: [
        {
          value: 'off',
          label: '사용 안 함',
        },
        {
          value: 'on',
          label: '사용 · 공급 2배 예시',
        },
      ],
      help: '샤딩을 끈 상태에서 캐시만 켜고 공급 30 → 60을 비교하세요. 첫 읽기와 실제 성능은 별도 측정 대상입니다.',
    },
    {
      id: 'shard',
      label: '작은 파일 묶음 읽기',
      initial: 'off',
      options: [
        {
          value: 'off',
          label: '개별 객체 읽기',
        },
        {
          value: 'on',
          label: '샤딩 · 공급 2배 예시',
        },
      ],
      help: '캐시를 켠 뒤 샤딩도 켜서 공급 60 → 120을 비교하세요. 작은 객체 요청 부담을 줄이는 교육용 가정입니다.',
    },
    {
      id: 'persistent',
      label: '캐시 보관 경로',
      initial: 'temporary',
      options: [
        {
          value: 'temporary',
          label: 'Pod 임시 공간',
        },
        {
          value: 'volume',
          label: 'PVC로 연결한 볼륨',
        },
      ],
      help: 'PV → PVC → 로더를 연결한 뒤 이 설정도 바꾸세요. 임시 공간의 캐시 손실과 볼륨 사용 결과를 비교합니다.',
    },
  ],
});
