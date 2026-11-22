import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'model-drift',
  unit: 8,
  order: 2,
  title: '시간이 지나며 모델 품질이 달라진다',
  summary: 'Data Drift와 Concept Drift를 구분합니다.',
  scenario:
    '활동에서 변화 종류와 크기를 바꾸고 관찰 결과를 비교합니다. 리뷰 입력 자체가 바뀐 경우와 같은 표현의 정답 기준이 바뀐 경우를 구분하고, 무엇을 추가로 수집할지 판단하세요.',
  concepts: ['기준 데이터', '현재 입력·정답', '품질 관측'],
  assessment: {
    question: '입력 분포 변화만 발견했다면?',
    options: ['반드시 즉시 자동 재학습해야 한다', '품질과 원인을 함께 조사한다'],
    correct: 1,
    explanation: '드리프트 신호와 재학습 결정은 서로 다른 단계입니다.',
  },
  caution: '드리프트 신호와 재학습 결정은 서로 다른 단계입니다.',
  reflection: '입력 분포 변화만 발견했다면?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://prometheus.io/docs/introduction/overview/',
    },
    {
      title: 'OpenTelemetry · 관측 신호',
      url: 'https://opentelemetry.io/docs/concepts/signals/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['serving', 'monitoring'],
  activityView: {
    type: 'numbers',
    title: '입력 분포가 바뀌면 정확도도 낮아질까요?',
    instruction: '입력 분포 변화와 입력·정답 관계 변화를 번갈아 선택해 관측값을 비교하세요.',
  },
  activity: {
    kind: 'drift',
    fields: [
      {
        id: 'change',
        label: '변화 종류',
        initial: 'data',
        options: [
          {
            value: 'data',
            label: '입력 분포 변화',
          },
          {
            value: 'concept',
            label: '입력과 정답 관계 변화',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
      {
        id: 'shift',
        label: '변화 크기',
        initial: 30,
        min: 0,
        max: 60,
        step: 1,
        help: '기준 구간과 현재 구간을 비교합니다.',
      },
    ],
    question: '입력 분포 변화만 발견했다면?',
    options: [
      {
        value: 'b',
        label: '반드시 즉시 자동 재학습해야 한다',
      },
      {
        value: 'a',
        label: '품질과 원인을 함께 조사한다',
      },
    ],
    correct: 'a',
    explanation: '드리프트 신호와 재학습 결정은 서로 다른 단계입니다.',
    task: '두 변화 종류를 선택해 그래프와 품질 지표를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '기준 데이터',
      detail: '시간이 지나며 모델 품질이 달라진다 · 1번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n1',
      title: '현재 입력·정답',
      detail: '시간이 지나며 모델 품질이 달라진다 · 2번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n2',
      title: '품질 관측',
      detail: '시간이 지나며 모델 품질이 달라진다 · 3번째 구성 요소',
      tone: '#799bc1',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'change',
      label: '변화 종류',
      initial: 'data',
      options: [
        {
          value: 'data',
          label: '입력 분포 변화',
        },
        {
          value: 'concept',
          label: '입력과 정답 관계 변화',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
    {
      id: 'shift',
      label: '변화 크기',
      initial: 30,
      min: 0,
      max: 60,
      step: 1,
      help: '기준 구간과 현재 구간을 비교합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
