import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'embedding',
  unit: 6,
  order: 2,
  title: '임베딩은 의미를 비교할 좌표',
  summary: '예시 공간에서 가까운 문서와 먼 문서를 살펴봅니다.',
  scenario:
    '비교 활동에서 질문을 바꿔 문서가 예시 벡터 공간의 어느 위치에 놓이는지 살펴보세요. 질문과 문서의 차원 수가 같아도 서로 다른 임베딩 모델로 만든 좌표를 비교하기 어려운 이유를 확인합니다.',
  concepts: ['문서·질문', '같은 임베딩 모델', '벡터 좌표'],
  assessment: {
    question: '차원이 같으면 다른 모델의 벡터도 바로 비교해도 될까요?',
    options: ['네, 차원 수만 같으면 충분하다', '아니요, 같은 의미 공간인지 확인해야 한다'],
    correct: 1,
    explanation:
      '차원이 같으면 거리 계산은 가능하지만, 모델마다 학습한 의미 공간이 달라 두 벡터의 거리에는 의미가 없습니다. 문서와 질문은 같은 모델·전처리·거리 기준으로 임베딩해야 하며, 모델을 바꾸면 저장된 문서 전체를 다시 임베딩합니다.',
  },
  caution:
    '동일 차원은 의미 공간 호환의 충분조건이 아닙니다. 거리 기준(코사인·L2·내적)도 벡터 DB마다 기본값이 다르므로 컬렉션을 만들 때 지정합니다.',
  reflection:
    '영어 위주의 임베딩 모델로 한국어 사내 문서를 검색했더니 관련 문서가 잘 나오지 않습니다. 무엇을 바꾸어 비교해 보겠으며, 바꾼 뒤에 어떤 작업이 추가로 필요합니까?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · Chroma 임베딩 함수',
      url: 'https://docs.trychroma.com/docs/embeddings/embedding-functions',
    },
    {
      title: '공식 자료 · Chroma 컬렉션 설정 (거리 기준·HNSW)',
      url: 'https://docs.trychroma.com/docs/collections/configure',
    },
    {
      title: '모델 카드 · all-MiniLM-L6-v2',
      url: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
  activityView: {
    type: 'search',
    title: '질문을 바꾸면 어떤 문서가 가까워질까요?',
    instruction: '질문을 바꿔 예시 좌표에서 가까운 문서를 확인하세요.',
  },
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
