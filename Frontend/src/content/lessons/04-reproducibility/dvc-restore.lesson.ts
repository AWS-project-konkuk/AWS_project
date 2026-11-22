import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-restore',
  unit: 3,
  order: 5,
  title: '과거 코드와 데이터를 함께 복원하기',
  summary: '지난주 코드를 고른 뒤 내 캐시나 팀 보관소에서 지난주 데이터도 꺼내 봅니다.',
  scenario:
    '지난 실험의 Git 커밋으로 이동했지만 작업 공간에는 최신 데이터가 남아 있습니다. 메타데이터가 가리키는 내용을 캐시 또는 원격에서 찾아 정확한 버전으로 복원하세요.',
  concepts: ['Git checkout', 'dvc checkout', 'dvc pull', '캐시 적중·부재', '작업 공간 검증'],
  assessment: {
    question: 'Git 이동 후 데이터가 그대로라면?',
    options: ['Git 포인터를 읽었으므로 이미 복원된 것이다', 'DVC로 해당 데이터 버전을 복원한다'],
    correct: 1,
    explanation: '메타데이터와 실제 파일 상태를 둘 다 확인합니다.',
  },
  advanced: [
    {
      title: '심화 · 파일 복원과 실험 재현은 다릅니다',
      body: 'dvc checkout이나 dvc pull로 같은 데이터 파일을 복원해도 라이브러리 버전, 하드웨어, 난수 시드, 외부 서비스가 달라지면 학습 수치가 달라질 수 있습니다. 데이터 복원 성공을 먼저 검증한 뒤 코드·파라미터·실행 환경까지 같은 실험 식별자에 연결해야 합니다.',
    },
  ],
  caution: '메타데이터와 실제 파일 상태를 둘 다 확인합니다.',
  reflection: 'Git 이동 후 데이터가 그대로라면?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: 'DVC 공식 · dvc checkout',
      url: 'https://dvc.org/doc/command-reference/checkout',
    },
    {
      title: 'DVC 공식 · dvc pull',
      url: 'https://dvc.org/doc/command-reference/pull',
    },
    {
      title: 'DVC 공식 · .dvc 파일',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
    },
    {
      title: 'DVC · 데이터 추적과 Git 제외',
      url: 'https://doc.dvc.org/user-guide/how-to/stop-tracking-data',
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
      detail: '다시 사용할 코드와 데이터 이름표를 고릅니다.',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'DVC 캐시',
      detail: '내 컴퓨터에 보관한 지난 데이터를 찾습니다.',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '작업 공간 데이터',
      detail: '선택한 버전의 파일을 꺼내 학습에 사용합니다.',
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
  activityView: {
    type: 'scenario',
    title: '지난주 데이터를 다시 쓰려면?',
    instruction: '목표는 지난주 v1입니다. 현재 작업 폴더에는 이번 주 v2가 있습니다.',
    note: '복원에 필요한 파일을 원격에 보관했고 읽기 권한이 있다고 가정합니다.',
    cases: [
      {
        label: 'Git만 v1로 변경',
        result: '아직 코드와 데이터가 서로 다릅니다.',
        cards: [
          { title: '코드·이름표', value: 'v1', detail: '지난주 기록' },
          { title: '작업 데이터', value: 'v2', detail: '이번 주 파일이 남음' },
        ],
        reason: 'Git이 관리하지 않는 큰 데이터 파일은 따로 복원해야 합니다.',
      },
      {
        label: '캐시에 v1 있음',
        result: 'dvc checkout으로 내 보관본을 꺼냅니다.',
        cards: [
          { title: '가져오는 곳', value: '로컬 캐시 v1', detail: '내 컴퓨터에 이미 있음' },
          { title: '작업 데이터', value: 'v1', detail: '지난주 코드와 맞음' },
        ],
        reason: '필요한 파일이 가까이 있으므로 다시 내려받을 필요가 없습니다.',
      },
      {
        label: '캐시에 v1 없음',
        result: 'dvc pull로 팀 보관소에서 가져옵니다.',
        cards: [
          { title: '가져오는 곳', value: '데이터 원격 v1', detail: '캐시를 거쳐 복원' },
          { title: '작업 데이터', value: 'v1', detail: '지난주 코드와 맞음' },
        ],
        reason: '이름표만으로 데이터가 생기지는 않습니다. 실제 파일을 받아야 합니다.',
      },
    ],
  },
});
