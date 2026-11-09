import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'pv-pvc',
  unit: 2,
  order: 5,
  title: 'PV와 PVC로 Pod 밖의 데이터 연결',
  summary: '저장 요청과 실제 볼륨을 구분하고 Pod 교체를 관찰합니다.',
  scenario:
    '학습 Pod의 /checkpoints에 저장한 모델이 Pod 교체 후 사라졌습니다. PVC로 필요한 저장 조건을 요청하고 새 Pod가 같은 볼륨을 다시 마운트하도록 구성하세요.',
  concepts: ['Pod', 'PVC 요청', 'PV 볼륨'],
  assessment: {
    question: 'Pod 교체 후에도 기록 파일을 유지하려면?',
    options: [
      '같은 Pod 이름을 다시 사용하면 충분하다',
      '조건에 맞게 연결한 영구 볼륨을 사용한다',
      '새 Pod의 컨테이너 안에 같은 이름의 폴더만 만든다',
      'PVC를 생성하기만 하고 Pod의 볼륨과 마운트 설정은 생략한다',
    ],
    correct: 1,
    explanation:
      'Pod 이름을 재사용해도 컨테이너의 임시 파일은 이어지지 않습니다. Pod와 수명이 분리된 볼륨을 PVC로 참조해야 합니다.',
  },
  advanced: [
    {
      title: '심화 · 접근 모드와 CSI',
      body: 'RWO는 단일 노드의 읽기·쓰기 마운트 조건이며 Pod 하나를 뜻하지 않습니다. 단일 Pod 제한에는 CSI가 지원하는 RWOP를 검토합니다. ROX·RWX 지원 여부도 드라이버마다 다르므로 PVC 요청과 실제 스토리지 기능을 함께 확인합니다.',
    },
  ],
  caution:
    'PV와 PVC는 백업이 아닙니다. 실제 삭제·복구 동작은 기반 저장소와 reclaim policy에 달려 있습니다.',
  reflection: 'PVC가 Pending 상태라면 어떤 요청 조건과 제공 조건을 비교해야 할까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://cool-candle-658.notion.site/MLOps-4-02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'Kubernetes 공식 · PersistentVolume과 PersistentVolumeClaim',
      url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  nodeExample: {
    id: 'volume-binding',
    title: 'Pod가 저장소를 사용하는 세 관계',
    prompt:
      '이 그림은 실행 순서가 아니라 참조·바인딩·저장소 대응 관계입니다. 데이터 파일과 저장소 요청을 구분하세요.',
    nodes: [
      {
        id: 'pod',
        title: '학습 Pod',
        purpose: '마운트할 볼륨을 PVC 이름으로 참조합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'pvc',
        title: 'PVC',
        purpose: '필요한 용량과 접근 모드를 요청합니다.',
        x: 300,
        y: 0,
      },
      {
        id: 'pv',
        title: 'PV',
        purpose: '조건이 맞는 실제 저장소를 표현합니다.',
        x: 600,
        y: 0,
      },
    ],
    links: [
      {
        id: 'pod-pvc',
        source: 'pod',
        target: 'pvc',
        label: 'PVC 참조',
        detail: 'Pod 명세가 사용할 PVC를 지정합니다.',
        material: 'claim',
      },
      {
        id: 'pvc-pv',
        source: 'pvc',
        target: 'pv',
        label: '볼륨 바인딩',
        detail: 'PVC 요청과 PV 제공 조건이 맞아야 연결됩니다. 이 화살표는 파일 전송이 아닙니다.',
        material: 'volume',
      },
    ],
    practiceHint:
      'PVC의 요청에 맞는 PV와의 관계를 연결하세요. PVC를 만든 것만으로 파일이 보존되는 것은 아닙니다.',
    nextLesson: 'week3-workflow',
    kind: '구성 관계',
    afterSection: 1,
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Pod',
      detail: 'PV와 PVC로 Pod 밖의 데이터 연결 · 1번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n1',
      title: 'PVC 요청',
      detail: 'PV와 PVC로 Pod 밖의 데이터 연결 · 2번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n2',
      title: 'PV 볼륨',
      detail: 'PV와 PVC로 Pod 밖의 데이터 연결 · 3번째 구성 요소',
      tone: '#6eac9b',
    },
  ],
  fields: [
    {
      id: 'persistent',
      label: '저장 경로',
      initial: 'ephemeral',
      options: [
        {
          value: 'ephemeral',
          label: 'Pod 임시 저장',
        },
        {
          value: 'pv',
          label: 'PVC로 연결한 영구 볼륨',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: 'Pod → PVC 요청',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'PVC 요청 → PV 볼륨',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
