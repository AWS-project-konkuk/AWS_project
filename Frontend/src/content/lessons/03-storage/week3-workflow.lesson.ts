import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week3-workflow',
  unit: 2,
  order: 6,
  title: 'GPU까지 끊기지 않는 데이터 공급',
  summary:
    '주차 종합 실습 · Object Storage는 원본 보관, 로더·캐시는 공급 최적화, PV·PVC는 실행 단위 밖의 저장 연결을 담당합니다.',
  minutes: 18,
  scenario:
    '원본 객체·읽기 경로·PVC·GPU를 구분해 연결하세요. 데이터 대기와 임시 캐시 손실을 확인한 뒤 공급과 보존을 개선하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
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
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'objects',
      title: 'Object Storage',
      detail: '원본 이미지 데이터셋의 공통 보관소입니다.',
    },
    {
      id: 'pv',
      title: 'PV 볼륨',
      detail: 'Pod와 독립적으로 존재하는 저장 자원입니다.',
    },
    {
      id: 'pvc',
      title: 'PVC 요청',
      detail: '필요한 저장 조건을 PV에 결합합니다.',
    },
    {
      id: 'loader',
      title: '데이터 로더',
      detail: '원본을 읽고 배치를 만들어 공급합니다.',
    },
    {
      id: 'gpu',
      title: 'GPU 학습',
      detail: '배치가 준비되지 않으면 기다립니다.',
    },
    {
      id: 'artifact',
      title: '모델 보관',
      detail: '완료한 모델 파일을 객체로 보관합니다.',
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
      help: '캐시를 켜도 첫 읽기 비용과 실제 성능은 별도 측정이 필요합니다.',
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
      help: '요청 개수와 지연 부담을 줄이는 예시입니다.',
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
      help: 'Pod를 교체한 뒤 cache.bin이 남는지 확인합니다.',
    },
  ],
});
