import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'shadow',
  unit: 7,
  order: 6,
  title: 'Shadow: 요청은 복제, 응답은 기존 모델',
  summary: '새 모델을 비교하되 그 응답은 사용자에게 보내지 않습니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['운영 요청', '기존 사용자 응답', 'Shadow 비교'],
  assessment: {
    question: 'Shadow 모델의 결과는 어디에 쓰이나요?',
    options: [
      '비교·분석에 사용하며 사용자 응답은 기존 모델이 담당한다',
      '복제 비율만큼 사용자에게 신규 응답을 보낸다',
    ],
    correct: 0,
    explanation: '요청 복제 비율과 실제 사용자 응답 비율을 구분합니다.',
  },
  caution: '요청 복제 비율과 실제 사용자 응답 비율을 구분합니다.',
  reflection: 'Shadow 모델의 결과는 어디에 쓰이나요?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://grpc.io/docs/what-is-grpc/introduction/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/shadow-tests.html',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  activity: {
    kind: 'release',
    variant: 'shadow',
    fields: [
      {
        id: 'traffic',
        label: '복제 요청 비율 (%)',
        initial: 100,
        min: 0,
        max: 100,
        step: 1,
        help: '신규 모델에 복제하는 비율이며 실제 응답 비율이 아닙니다.',
      },
    ],
    question: 'Shadow 모델의 결과는 어디에 쓰이나요?',
    options: [
      {
        value: 'a',
        label: '비교·분석에 사용하며 사용자 응답은 기존 모델이 담당한다',
      },
      {
        value: 'b',
        label: '복제 비율만큼 사용자에게 신규 응답을 보낸다',
      },
    ],
    correct: 'a',
    explanation: '요청 복제 비율과 실제 사용자 응답 비율을 구분합니다.',
    task: '복제 비율을 바꿔도 신규 사용자 응답이 0인지 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '운영 요청',
      detail: 'Shadow: 요청은 복제, 응답은 기존 모델 · 1번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n1',
      title: '기존 사용자 응답',
      detail: 'Shadow: 요청은 복제, 응답은 기존 모델 · 2번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n2',
      title: 'Shadow 비교',
      detail: 'Shadow: 요청은 복제, 응답은 기존 모델 · 3번째 구성 요소',
      tone: '#bd8d78',
    },
  ],
  fields: [
    {
      id: 'traffic',
      label: '복제 요청 비율 (%)',
      initial: 100,
      min: 0,
      max: 100,
      step: 1,
      help: '신규 모델에 복제하는 비율이며 실제 응답 비율이 아닙니다.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '운영 요청 → 기존 사용자 응답',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n0-n2',
      kind: 'edge',
      from: 'n0',
      to: 'n2',
      label: '운영 요청 → Shadow 비교',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n0', 'n2'],
  ],
});
