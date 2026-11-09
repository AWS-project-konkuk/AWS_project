import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-architecture',
  unit: 3,
  order: 5,
  title: 'DVC는 데이터 버전을 어떻게 관리할까?',
  summary: 'Git의 .dvc 메타데이터와 내용 해시로 관리되는 실제 데이터 경로를 나눕니다.',
  scenario:
    'Git에는 데이터 정보만 남기고 실제 데이터는 캐시와 원격 저장소에 보관하는 DVC의 구조를 알아보세요.',
  concepts: ['.dvc 메타데이터', '내용 해시', 'DVC 로컬 캐시', '데이터 원격', '작업 공간'],
  assessment: {
    question: 'Git에 커밋하는 DVC 관련 정보는?',
    options: ['데이터 식별 정보를 담은 메타데이터', '항상 전체 데이터셋 바이너리'],
    correct: 0,
    explanation: '실제 데이터는 캐시와 원격 저장소가 담당합니다.',
  },
  advanced: [
    {
      title: '심화 · Git 원격과 DVC 원격의 독립성',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution: '실제 데이터는 캐시와 원격 저장소가 담당합니다.',
  reflection: 'Git에 .dvc 파일만 커밋했을 때 실제 데이터를 다른 컴퓨터에서 받을 수 있을까요?',
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
      detail: 'DVC의 Git·캐시·원격 저장소 · 1번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'DVC 로컬 캐시',
      detail: 'DVC의 Git·캐시·원격 저장소 · 2번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '데이터 원격 저장소',
      detail: 'DVC의 Git·캐시·원격 저장소 · 3번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n3',
      title: '작업 공간',
      detail: 'DVC의 Git·캐시·원격 저장소 · 4번째 구성 요소',
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
});
