import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'serving-modes',
  unit: 7,
  order: 2,
  title: 'Batch와 Real-time 서빙',
  summary: '결과가 필요한 시점에 맞춰 처리 방식을 선택합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['입력 요청', '모델 서빙', '예측 결과'],
  assessment: {
    question: '사용자 요청에 즉시 예측이 필요하다면?',
    options: ['Real-time 서빙을 검토한다', '다음 날 Batch 결과만으로 충분하다'],
    correct: 0,
    explanation: '필요한 응답 시점이 서빙 방식을 결정하는 핵심 조건입니다.',
  },
  caution: '필요한 응답 시점이 서빙 방식을 결정하는 핵심 조건입니다.',
  reflection: '사용자 요청에 즉시 예측이 필요하다면?',
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
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  activity: {
    kind: 'serving',
    fields: [
      {
        id: 'mode',
        label: '서빙 방식',
        initial: 'batch',
        options: [
          {
            value: 'batch',
            label: 'Batch',
          },
          {
            value: 'realtime',
            label: 'Real-time',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '사용자 요청에 즉시 예측이 필요하다면?',
    options: [
      {
        value: 'a',
        label: 'Real-time 서빙을 검토한다',
      },
      {
        value: 'b',
        label: '다음 날 Batch 결과만으로 충분하다',
      },
    ],
    correct: 'a',
    explanation: '필요한 응답 시점이 서빙 방식을 결정하는 핵심 조건입니다.',
    task: '방식을 바꾸고 첫 요청의 응답 시점을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '입력 요청',
      detail: 'Batch와 Real-time 서빙 · 1번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n1',
      title: '모델 서빙',
      detail: 'Batch와 Real-time 서빙 · 2번째 구성 요소',
      tone: '#bd8d78',
    },
    {
      id: 'n2',
      title: '예측 결과',
      detail: 'Batch와 Real-time 서빙 · 3번째 구성 요소',
      tone: '#bd8d78',
    },
  ],
  fields: [
    {
      id: 'mode',
      label: '서빙 방식',
      initial: 'batch',
      options: [
        {
          value: 'batch',
          label: 'Batch',
        },
        {
          value: 'realtime',
          label: 'Real-time',
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
      label: '입력 요청 → 모델 서빙',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '모델 서빙 → 예측 결과',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
