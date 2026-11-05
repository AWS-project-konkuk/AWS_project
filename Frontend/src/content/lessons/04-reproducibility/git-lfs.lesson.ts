import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'git-lfs',
  unit: 3,
  order: 4,
  title: 'Git LFS는 큰 파일을 포인터로 추적',
  summary: 'Git의 포인터와 별도 서버의 실제 파일을 구분합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['Git 포인터', 'LFS 저장소', '실제 파일'],
  assessment: {
    question: 'Git LFS를 쓰면 실제 대용량 파일은?',
    options: ['포인터로 바뀌며 내용이 필요 없어지는 것이다', '별도 저장소에 보관된다'],
    correct: 1,
    explanation: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
  },
  advanced: [
    {
      title: '심화 · 테이블 커밋과 보존',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
  reflection: 'Git LFS를 쓰면 실제 대용량 파일은?',
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
      url: 'https://git-lfs.com/',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  activity: {
    kind: 'lfs',
    fields: [
      {
        id: 'size',
        label: '파일 크기 (MiB)',
        initial: 100,
        min: 10,
        max: 1000,
        step: 1,
        help: '실제 데이터는 별도 저장소에 남습니다.',
      },
      {
        id: 'versions',
        label: '버전 수',
        initial: 5,
        min: 1,
        max: 20,
        step: 1,
        help: 'Git 포인터와 실물 데이터 용량을 구분합니다.',
      },
    ],
    question: 'Git LFS를 쓰면 실제 대용량 파일은?',
    options: [
      {
        value: 'b',
        label: '포인터로 바뀌며 내용이 필요 없어지는 것이다',
      },
      {
        value: 'a',
        label: '별도 저장소에 보관된다',
      },
    ],
    correct: 'a',
    explanation: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
    task: '이력 크기를 바꾸며 포인터·파일 위치를 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Git 포인터',
      detail: 'Git LFS는 큰 파일을 포인터로 추적 · 1번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'LFS 저장소',
      detail: 'Git LFS는 큰 파일을 포인터로 추적 · 2번째 구성 요소',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '실제 파일',
      detail: 'Git LFS는 큰 파일을 포인터로 추적 · 3번째 구성 요소',
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
      help: '실제 데이터는 별도 저장소에 남습니다.',
    },
    {
      id: 'versions',
      label: '버전 수',
      initial: 5,
      min: 1,
      max: 20,
      step: 1,
      help: 'Git 포인터와 실물 데이터 용량을 구분합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
