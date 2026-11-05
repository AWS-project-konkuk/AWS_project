import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'ec2-compute',
  unit: 0,
  order: 2,
  title: 'EC2는 코드를 실행하는 컴퓨터',
  summary: '연산을 실행하는 곳과 결과를 보관하는 곳을 구분합니다.',
  scenario: 'EC2가 코드를 실행하는 역할을 설명하고, 프로그램 실행과 파일 저장을 구분해 보세요.',
  concepts: ['학습 코드', 'EC2', '결과 파일'],
  assessment: {
    question: '프로그램을 실행하는 역할은 무엇인가요?',
    options: ['EC2', 'S3 객체 자체'],
    correct: 0,
    explanation: 'EC2가 코드를 실행하고 S3는 결과 객체를 보관합니다.',
  },
  caution: 'EC2가 코드를 실행하고 S3는 결과 객체를 보관합니다.',
  reflection: '프로그램을 실행하는 역할은 무엇인가요?',
  references: [
    {
      title: '원문 · MLOps 1주차 · 실제 도구 실습',
      url: 'https://www.notion.so/896ebb1cb38a830b8ade81b394fce2f5',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html',
    },
  ],
  sourceWeek: 1,
  mapStages: ['data', 'training'],
  activity: {
    kind: 'machine',
    fields: [
      {
        id: 'power',
        label: '인스턴스 동작',
        initial: 'start',
        options: [
          {
            value: 'start',
            label: '시작',
          },
          {
            value: 'stop',
            label: '중지',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '프로그램을 실행하는 역할은 무엇인가요?',
    options: [
      {
        value: 'a',
        label: 'EC2',
      },
      {
        value: 'b',
        label: 'S3 객체 자체',
      },
    ],
    correct: 'a',
    explanation: 'EC2가 코드를 실행하고 S3는 결과 객체를 보관합니다.',
    task: '시작과 중지를 각각 관찰하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '학습 코드',
      detail: 'EC2는 코드를 실행하는 컴퓨터 · 1번째 구성 요소',
      tone: '#9b8bec',
    },
    {
      id: 'n1',
      title: 'EC2',
      detail: 'EC2는 코드를 실행하는 컴퓨터 · 2번째 구성 요소',
      tone: '#9b8bec',
    },
    {
      id: 'n2',
      title: '결과 파일',
      detail: 'EC2는 코드를 실행하는 컴퓨터 · 3번째 구성 요소',
      tone: '#9b8bec',
    },
  ],
  fields: [
    {
      id: 'power',
      label: '인스턴스 동작',
      initial: 'start',
      options: [
        {
          value: 'start',
          label: '시작',
        },
        {
          value: 'stop',
          label: '중지',
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
      label: '학습 코드 → EC2',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'EC2 → 결과 파일',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
