import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vector-search',
  unit: 6,
  order: 3,
  title: '조건 검색과 유사도 검색의 차이',
  summary: '같은 문서 집합을 서로 다른 검색 기준으로 조회합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['질문', '검색 기준', '후보 문서'],
  assessment: {
    question: '벡터 검색이 후보를 고르는 대표 기준은?',
    options: ['임베딩 사이의 거리·유사도', '문서 ID가 같은지 여부만'],
    correct: 0,
    explanation: '벡터 검색은 의미 표현의 가까움을 검색 기준으로 사용합니다.',
  },
  caution: '벡터 검색은 의미 표현의 가까움을 검색 기준으로 사용합니다.',
  reflection: '벡터 검색이 후보를 고르는 대표 기준은?',
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
    kind: 'search',
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
      {
        id: 'mode',
        label: '검색 기준',
        initial: 'exact',
        options: [
          {
            value: 'exact',
            label: '정확한 문구 포함',
          },
          {
            value: 'vector',
            label: '예시 벡터 거리',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '벡터 검색이 후보를 고르는 대표 기준은?',
    options: [
      {
        value: 'a',
        label: '임베딩 사이의 거리·유사도',
      },
      {
        value: 'b',
        label: '문서 ID가 같은지 여부만',
      },
    ],
    correct: 'a',
    explanation: '벡터 검색은 의미 표현의 가까움을 검색 기준으로 사용합니다.',
    task: '정확한 문구 검색과 유사도 검색의 결과를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '질문',
      detail: '조건 검색과 유사도 검색의 차이 · 1번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: '검색 기준',
      detail: '조건 검색과 유사도 검색의 차이 · 2번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: '후보 문서',
      detail: '조건 검색과 유사도 검색의 차이 · 3번째 구성 요소',
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
    {
      id: 'mode',
      label: '검색 기준',
      initial: 'exact',
      options: [
        {
          value: 'exact',
          label: '정확한 문구 포함',
        },
        {
          value: 'vector',
          label: '예시 벡터 거리',
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
