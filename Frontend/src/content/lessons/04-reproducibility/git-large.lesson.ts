import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'git-large',
  unit: 3,
  order: 1,
  title: 'Git에 대용량 데이터를 넣으면 생기는 문제',
  summary: '큰 파일의 과거 버전이 쌓이면 저장 공간과 다운로드 부담이 늘어나는 이유를 알아봅니다.',
  scenario:
    '10GB 데이터셋을 Git에 커밋한다고 가정하고 작업 공간, .git 객체 저장소, 원격 저장소에 어떤 부담이 생기는지 설명해 보세요.',
  concepts: ['Git 객체 저장소', '대용량 바이너리', '버전 이력', '복제·전송 비용'],
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
      title: '심화 · Git 객체와 저장소 크기',
      body: 'Git은 파일 내용을 객체로 저장하고 커밋이 그 객체를 참조합니다. 큰 파일을 현재 브랜치에서 삭제해도 과거 커밋이 참조하는 동안 이력에는 남을 수 있습니다. 실제 증가량은 파일 형식, 압축 가능성, 변경 방식에 따라 달라지므로 단순히 파일 크기와 버전 수를 곱한 값은 상한을 이해하기 위한 교육용 근사치로 봅니다.',
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
      title: 'Git 공식 · Git Objects',
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
      detail: '지금 수정하고 있는 코드와 데이터입니다.',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'Git 이력',
      detail: '과거 파일 내용을 다시 찾을 수 있게 보관합니다.',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '원격 저장소',
      detail: '팀원이 함께 받는 Git 기록입니다.',
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
  activityView: {
    type: 'scenario',
    title: '10GB 파일을 여러 번 저장하면?',
    instruction: '내용이 달라진 데이터셋을 버전마다 Git에 저장한다고 생각해 보세요.',
    note: '버전마다 10GB를 따로 보관한다고 가정한 비교입니다. 실제 Git 용량은 압축과 파일 내용에 따라 달라집니다.',
    cases: [
      {
        label: '처음 저장',
        result: '현재 파일과 Git 이력에 데이터가 있습니다.',
        cards: [
          { title: '작업 폴더', value: '10GB', detail: '지금 사용하는 파일' },
          { title: 'Git 이력', value: '약 10GB', detail: '첫 버전을 보관' },
        ],
        reason: 'Git은 현재 파일과 별도로 과거 내용을 되찾을 수 있게 저장합니다.',
      },
      {
        label: '새 버전 두 번 저장',
        result: '현재 파일은 하나여도 과거 버전은 쌓입니다.',
        cards: [
          { title: '작업 폴더', value: '10GB', detail: '최신 파일 하나' },
          { title: 'Git 이력', value: '약 30GB', detail: '서로 내용이 다른 파일 세 버전' },
        ],
        reason: '이전 버전을 다시 꺼내려면 그 내용도 남겨야 합니다.',
      },
      {
        label: '현재 파일 삭제',
        result: '현재 파일을 지워도 과거 이력은 남습니다.',
        cards: [
          { title: '작업 폴더', value: '0GB', detail: '파일을 삭제한 상태' },
          { title: 'Git 이력', value: '약 30GB', detail: '과거 커밋이 여전히 참조' },
        ],
        reason: '현재 목록에서 삭제하는 것과 과거 기록을 지우는 것은 별개의 작업입니다.',
      },
    ],
  },
});
