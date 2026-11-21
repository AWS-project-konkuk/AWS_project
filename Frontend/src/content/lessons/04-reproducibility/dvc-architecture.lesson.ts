import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-architecture',
  unit: 3,
  order: 3,
  title: 'DVC 아키텍처: Git·캐시·데이터 원격',
  summary: 'Git의 데이터 이름표, 내 컴퓨터의 캐시, 팀의 보관소가 하는 일을 구분합니다.',
  scenario:
    'Git에 남는 .dvc 기록과 로컬 캐시, 팀이 공유하는 DVC 원격을 비교합니다. 팀원이 같은 커밋에서 작업 폴더에 학습 사진을 가져오는 경로를 따라가 보세요.',
  concepts: ['데이터 이름표', '파일의 지문', '내 보관함', '팀 보관소', '작업 폴더'],
  assessment: {
    question: 'Git에 커밋하는 DVC 관련 정보는?',
    options: ['데이터 식별 정보를 담은 메타데이터', '항상 전체 데이터셋 바이너리'],
    correct: 0,
    explanation: '실제 데이터는 캐시와 원격 저장소가 담당합니다.',
  },
  advanced: [
    {
      title: '심화 · 내용 주소화와 캐시 재사용',
      body: 'DVC는 데이터 내용을 식별하는 해시를 이용해 캐시 경로와 메타데이터를 연결합니다. 같은 내용은 캐시에서 재사용할 수 있지만 원격에 해당 객체가 없거나 권한이 없다면 다른 환경에서 복원할 수 없습니다. 메타데이터를 커밋하는 것과 실제 데이터를 dvc push로 공유하는 것을 한 작업으로 착각하지 않아야 합니다.',
    },
  ],
  caution: '실제 데이터는 캐시와 원격 저장소가 담당합니다.',
  reflection: 'Git에 커밋하는 DVC 관련 정보는?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: 'DVC 공식 · .dvc 파일',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
    },
    {
      title: 'DVC · 데이터 추적과 Git 제외',
      url: 'https://doc.dvc.org/user-guide/how-to/stop-tracking-data',
    },
    {
      title: 'DVC 공식 · 시작하기',
      url: 'https://doc.dvc.org/start',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  activity: {
    kind: 'dvc',
    fields: [
      {
        id: 'direction',
        label: '동작',
        initial: 'push',
        options: [
          {
            value: 'push',
            label: 'dvc push · 공유',
          },
          {
            value: 'pull',
            label: 'dvc pull · 가져오기',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'Git에 커밋하는 DVC 관련 정보는?',
    options: [
      {
        value: 'a',
        label: '데이터 식별 정보를 담은 메타데이터',
      },
      {
        value: 'b',
        label: '항상 전체 데이터셋 바이너리',
      },
    ],
    correct: 'a',
    explanation: '실제 데이터는 캐시와 원격 저장소가 담당합니다.',
    task: 'push와 pull의 방향을 비교하고 경로를 연결하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Git 코드·포인터',
      detail: '코드와 어떤 데이터를 썼는지 적은 이름표입니다.',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'DVC 로컬 캐시',
      detail: '내 컴퓨터에 다시 쓸 데이터를 보관합니다.',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '데이터 원격 저장소',
      detail: '팀이 실제 데이터를 함께 보관합니다.',
      tone: '#b49b70',
    },
    {
      id: 'n3',
      title: '작업 공간',
      detail: '학습 코드가 실제로 읽는 파일을 준비합니다.',
      tone: '#b49b70',
    },
  ],
  fields: [
    {
      id: 'direction',
      label: '동작',
      initial: 'push',
      options: [
        {
          value: 'push',
          label: 'dvc push · 공유',
        },
        {
          value: 'pull',
          label: 'dvc pull · 가져오기',
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
      label: 'Git 코드·포인터 → DVC 로컬 캐시',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'DVC 로컬 캐시 → 데이터 원격 저장소',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n3',
      kind: 'edge',
      from: 'n1',
      to: 'n3',
      label: 'DVC 로컬 캐시 → 작업 공간',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
    ['n1', 'n3'],
  ],
  activityView: {
    type: 'structure',
    title: '공유할 때와 가져올 때, 어디로 이동할까요?',
    instruction: 'Git에는 데이터 이름표가 있고 실제 데이터는 내 컴퓨터와 팀 저장소에서 관리합니다.',
    note: '이 버튼은 동작을 설명합니다. 실제 Git 또는 DVC 명령을 실행하지 않습니다.',
    cases: [
      {
        label: '이름표 공유 · git push',
        flow: ['내 Git 기록의 코드와 .dvc 파일', '팀 Git 저장소에 공유'],
        result: '코드와 데이터 이름표를 Git 원격에 보냅니다.',
        cards: [
          { title: '출발', value: '내 Git 기록', detail: '코드와 .dvc 파일' },
          { title: '도착', value: '팀 Git 저장소', detail: '팀원이 버전을 확인' },
        ],
        reason: '이 동작만으로 큰 데이터 파일이 팀 저장소에 올라가지는 않습니다.',
      },
      {
        label: '데이터 공유 · dvc push',
        flow: ['내 캐시의 데이터 파일', '팀 데이터 원격에 보관'],
        result: '내 캐시의 실제 데이터를 팀 저장소에 보냅니다.',
        cards: [
          { title: '출발', value: '내 캐시', detail: '내 컴퓨터의 보관본' },
          { title: '도착', value: '데이터 원격', detail: 'S3 같은 팀 보관소' },
        ],
        reason: '팀원도 같은 파일을 받을 수 있도록 실제 내용을 공유합니다.',
      },
      {
        label: '데이터 받기 · dvc pull',
        flow: [
          '.dvc 파일로 필요한 내용 확인',
          '없는 파일만 원격에서 캐시로 받기',
          '캐시의 파일을 작업 폴더에 준비',
        ],
        result: '필요한 데이터를 받아 작업 폴더에 준비합니다.',
        cards: [
          { title: '찾을 기준', value: '.dvc 이름표', detail: '원하는 데이터 내용을 식별' },
          { title: '가져오는 곳', value: '원격 → 캐시', detail: '캐시에 없는 내용만 받기' },
          { title: '사용할 곳', value: '작업 폴더', detail: '학습 코드가 읽을 파일' },
        ],
        reason: '이미 캐시에 있는 내용은 재사용하고, 없는 내용은 데이터 원격에서 가져옵니다.',
      },
    ],
  },
});
