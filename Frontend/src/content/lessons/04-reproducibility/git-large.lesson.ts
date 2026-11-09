import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'git-large',
  unit: 3,
  order: 3,
  title: '큰 데이터 파일을 Git에 넣으면 어떻게 될까?',
  summary: 'Git blob과 커밋 이력에 큰 데이터 버전이 누적되는 이유를 이해합니다.',
  scenario:
    '10GB 데이터셋을 Git에 반복해서 저장하면 왜 저장소가 무거워지는지 확인하고 코드와 실제 데이터의 저장 위치를 나누어 보세요.',
  concepts: ['Git blob', '인덱스와 커밋', '대용량 데이터 이력', '코드·데이터 분리'],
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
      title: '심화 · 현재 파일 삭제와 과거 객체 보존',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution: '현재 파일 목록과 저장소 전체 이력은 다릅니다.',
  reflection: '현재 버전에서 큰 파일을 삭제해도 저장소 크기가 바로 줄지 않는 이유는 무엇일까요?',
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
