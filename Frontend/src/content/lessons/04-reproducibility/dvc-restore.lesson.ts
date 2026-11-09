import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-restore',
  unit: 3,
  order: 6,
  title: '과거 코드와 데이터를 함께 되돌리기',
  summary: 'Git 포인터 선택, 로컬 캐시 복원, 데이터 원격 다운로드를 구분합니다.',
  scenario:
    'Git을 과거 버전으로 바꾼 뒤 DVC 캐시와 원격 저장소에서 같은 버전의 실제 데이터도 복원해 보세요.',
  concepts: ['Git 포인터 버전', 'dvc checkout', 'dvc pull', '로컬 캐시', '작업 공간'],
  assessment: {
    question: 'Git 이동 후 데이터가 그대로라면?',
    options: ['Git 포인터를 읽었으므로 이미 복원된 것이다', 'DVC로 해당 데이터 버전을 복원한다'],
    correct: 1,
    explanation: '메타데이터와 실제 파일 상태를 둘 다 확인합니다.',
  },
  advanced: [
    {
      title: '심화 · 데이터 복원과 실험 재현의 차이',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution: '메타데이터와 실제 파일 상태를 둘 다 확인합니다.',
  reflection: 'Git을 과거 커밋으로 이동한 뒤 작업 데이터가 그대로라면 무엇을 확인해야 할까요?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
    },
    {
      title: 'DVC · 데이터 추적과 Git 제외',
      url: 'https://doc.dvc.org/user-guide/how-to/stop-tracking-data',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://doc.dvc.org/start',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  nodeExample: {
    id: 'dvc-cache-miss',
    title: '포인터만 복원한 뒤 실제 데이터 찾기',
    prompt:
      'Git 포인터는 v1이지만 캐시에 v1 파일이 없는 상황입니다. 어떤 자료를 어디서 가져와야 할까요?',
    nodes: [
      {
        id: 'git',
        title: 'Git 메타데이터',
        purpose: '과거 커밋의 .dvc가 데이터 v1 해시를 가리킵니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'remote',
        title: '데이터 원격',
        purpose: '실제 데이터 v1 파일을 보관합니다.',
        x: 0,
        y: 260,
      },
      {
        id: 'cache',
        title: '로컬 캐시',
        purpose: '필요한 해시의 실제 내용을 확보합니다.',
        x: 330,
        y: 110,
      },
      {
        id: 'workspace',
        title: '작업 파일',
        purpose: 'v1 내용으로 작업 공간을 복원합니다.',
        x: 660,
        y: 110,
      },
    ],
    links: [
      {
        id: 'git-cache',
        source: 'git',
        target: 'cache',
        label: 'v1 해시',
        detail: '작은 메타데이터가 복원할 데이터 내용을 식별합니다.',
        material: 'metadata',
      },
      {
        id: 'remote-cache',
        source: 'remote',
        target: 'cache',
        label: 'v1 실제 파일',
        detail: '캐시에 없는 내용은 dvc pull 등으로 원격에서 가져옵니다.',
        material: 'data',
      },
      {
        id: 'cache-workspace',
        source: 'cache',
        target: 'workspace',
        label: 'v1 작업 데이터',
        detail: '확보한 캐시 내용을 작업 공간에 반영합니다.',
        material: 'data',
      },
    ],
    practiceHint:
      '해시만으로 파일 내용이 생기지는 않습니다. 캐시의 실제 데이터를 작업 파일로 반영하는 경로를 연결하세요.',
    nextLesson: 'week4-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activity: {
    kind: 'restore',
    fields: [
      {
        id: 'version',
        label: 'Git에서 선택한 버전',
        initial: 'v1',
        options: [
          {
            value: 'v1',
            label: 'v1',
          },
          {
            value: 'v2',
            label: 'v2',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
      {
        id: 'checkout',
        label: '데이터 복원',
        initial: 'none',
        options: [
          {
            value: 'none',
            label: 'Git 이동만',
          },
          {
            value: 'checkout',
            label: 'dvc checkout 실행',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'Git 이동 후 데이터가 그대로라면?',
    options: [
      {
        value: 'b',
        label: 'Git 포인터를 읽었으므로 이미 복원된 것이다',
      },
      {
        value: 'a',
        label: 'DVC로 해당 데이터 버전을 복원한다',
      },
    ],
    correct: 'a',
    explanation: '메타데이터와 실제 파일 상태를 둘 다 확인합니다.',
    task: 'Git 이동만 한 결과와 dvc checkout 후를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Git 버전',
      detail: '과거 코드와 데이터를 함께 복원 · 1번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'DVC 캐시',
      detail: '과거 코드와 데이터를 함께 복원 · 2번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '작업 공간 데이터',
      detail: '과거 코드와 데이터를 함께 복원 · 3번째 구성 요소',
      tone: '#b49b70',
    },
  ],
  fields: [
    {
      id: 'version',
      label: 'Git에서 선택한 버전',
      initial: 'v1',
      options: [
        {
          value: 'v1',
          label: 'v1',
        },
        {
          value: 'v2',
          label: 'v2',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
    {
      id: 'checkout',
      label: '데이터 복원',
      initial: 'none',
      options: [
        {
          value: 'none',
          label: 'Git 이동만',
        },
        {
          value: 'checkout',
          label: 'dvc checkout 실행',
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
      label: 'Git 버전 → DVC 캐시',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'DVC 캐시 → 작업 공간 데이터',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
