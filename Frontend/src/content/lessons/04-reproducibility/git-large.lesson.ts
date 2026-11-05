import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'git-large',
  unit: 3,
  order: 3,
  title: 'Git에 큰 파일을 계속 넣으면',
  summary: '이력과 저장 용량의 관계를 관찰합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['코드·데이터', 'Git 이력', '원격 저장소'],
  assessment: {
    question: '현재 버전에서 큰 파일을 삭제하면?',
    options: [
      '과거 커밋의 데이터가 여전히 이력에 남을 수 있다',
      '과거의 모든 데이터도 즉시 사라진다',
    ],
    correct: 0,
    explanation: '현재 파일 목록과 저장소 전체 이력은 다릅니다.',
  },
  advanced: [
    {
      title: '심화 · 테이블 커밋과 보존',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution: '현재 파일 목록과 저장소 전체 이력은 다릅니다.',
  reflection: '현재 버전에서 큰 파일을 삭제하면?',
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
      url: 'https://git-scm.com/book/en/v2/Git-Internals-Git-Objects',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  activity: {
    kind: 'git',
    fields: [
      {
        id: 'size',
        label: '파일 크기 (MiB)',
        initial: 100,
        min: 10,
        max: 1000,
        step: 1,
        help: '대용량 바이너리 파일의 예시입니다.',
      },
      {
        id: 'versions',
        label: '변경 버전 수',
        initial: 5,
        min: 1,
        max: 20,
        step: 1,
        help: '이력에 보관되는 데이터의 크기를 비교합니다.',
      },
    ],
    question: '현재 버전에서 큰 파일을 삭제하면?',
    options: [
      {
        value: 'a',
        label: '과거 커밋의 데이터가 여전히 이력에 남을 수 있다',
      },
      {
        value: 'b',
        label: '과거의 모든 데이터도 즉시 사라진다',
      },
    ],
    correct: 'a',
    explanation: '현재 파일 목록과 저장소 전체 이력은 다릅니다.',
    task: '파일 크기와 변경 횟수를 바꿔 보세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '코드·데이터',
      detail: 'Git에 큰 파일을 계속 넣으면 · 1번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'Git 이력',
      detail: 'Git에 큰 파일을 계속 넣으면 · 2번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '원격 저장소',
      detail: 'Git에 큰 파일을 계속 넣으면 · 3번째 구성 요소',
      tone: '#b49b70',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'size',
      label: '파일 크기 (MiB)',
      initial: 100,
      min: 10,
      max: 1000,
      step: 1,
      help: '대용량 바이너리 파일의 예시입니다.',
    },
    {
      id: 'versions',
      label: '변경 버전 수',
      initial: 5,
      min: 1,
      max: 20,
      step: 1,
      help: '이력에 보관되는 데이터의 크기를 비교합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
