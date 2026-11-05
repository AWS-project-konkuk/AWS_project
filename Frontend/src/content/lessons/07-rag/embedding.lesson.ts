import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'embedding',
  unit: 6,
  order: 2,
  title: '임베딩은 의미를 비교할 좌표',
  summary: '예시 공간에서 가까운 문서와 먼 문서를 살펴봅니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['문서·질문', '같은 임베딩 모델', '벡터 좌표'],
  assessment: {
    question: '차원이 같으면 다른 모델의 벡터도 바로 비교해도 될까요?',
    options: ['네, 차원 수만 같으면 충분하다', '아니요, 같은 의미 공간인지 확인해야 한다'],
    correct: 1,
    explanation: '동일 차원은 의미 공간 호환의 충분조건이 아닙니다.',
  },
  caution: '동일 차원은 의미 공간 호환의 충분조건이 아닙니다.',
  reflection: '차원이 같으면 다른 모델의 벡터도 바로 비교해도 될까요?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://github.com/pgvector/pgvector',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.trychroma.com/docs/embeddings/embedding-functions',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
  activity: {
    kind: 'embedding',
    fields: [
      {
        id: 'query',
        label: '질문 예시',
        initial: 'fruit',
        options: [
          {
            value: 'fruit',
            label: '달콤한 과일',
          },
          {
            value: 'ml',
            label: '모델 학습 도구',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '차원이 같으면 다른 모델의 벡터도 바로 비교해도 될까요?',
    options: [
      {
        value: 'b',
        label: '네, 차원 수만 같으면 충분하다',
      },
      {
        value: 'a',
        label: '아니요, 같은 의미 공간인지 확인해야 한다',
      },
    ],
    correct: 'a',
    explanation: '동일 차원은 의미 공간 호환의 충분조건이 아닙니다.',
    task: '질문을 바꾸며 가까운 문서의 위치를 살펴보세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '문서·질문',
      detail: '임베딩은 의미를 비교할 좌표 · 1번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: '같은 임베딩 모델',
      detail: '임베딩은 의미를 비교할 좌표 · 2번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: '벡터 좌표',
      detail: '임베딩은 의미를 비교할 좌표 · 3번째 구성 요소',
      tone: '#a287bd',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'query',
      label: '질문 예시',
      initial: 'fruit',
      options: [
        {
          value: 'fruit',
          label: '달콤한 과일',
        },
        {
          value: 'ml',
          label: '모델 학습 도구',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
