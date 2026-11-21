import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vector-search',
  unit: 6,
  order: 3,
  title: '조건 검색과 유사도 검색의 차이',
  summary: '같은 문서 집합을 서로 다른 검색 기준으로 조회합니다.',
  scenario:
    '비교 활동에서 같은 질문에 키워드 검색과 벡터 검색을 적용해 결과 순서를 확인합니다. 주문번호처럼 정확히 맞아야 하는 조건은 어떤 방식으로 함께 처리할지 판단해 보세요.',
  concepts: ['질문', '검색 기준', '후보 문서'],
  assessment: {
    question: '벡터 검색이 후보를 고르는 대표 기준은?',
    options: ['임베딩 사이의 거리·유사도', '문서 ID가 같은지 여부만'],
    correct: 0,
    explanation:
      '벡터 검색은 질문 임베딩과 문서 임베딩의 거리·유사도로 가까운 top-k를 고릅니다. 정확한 값이나 범위는 B+Tree 같은 조건 검색이 적합하며, 실제 서비스에서는 메타데이터 필터와 유사도 검색을 함께 쓰기도 합니다.',
  },
  caution:
    '벡터 검색은 의미 표현의 가까움을 기준으로 항상 top-k를 돌려주므로, 관련 문서가 없어도 결과가 나옵니다. 정확한 조건이 필요한 질문은 조건 검색과 함께 사용합니다.',
  reflection:
    '"주문번호 A-1234 배송 상태"와 "달콤한 과일 추천"은 각각 어떤 검색 방식이 적합합니까? 두 질문을 함께 처리하는 시스템이라면 어떻게 설계하겠습니까?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · pgvector (PostgreSQL 벡터 확장)',
      url: 'https://github.com/pgvector/pgvector',
    },
    {
      title: '공식 자료 · Chroma 쿼리와 메타데이터 필터',
      url: 'https://docs.trychroma.com/docs/querying-collections/query-and-get',
    },
    {
      title: '공식 자료 · Chroma 임베딩 함수',
      url: 'https://docs.trychroma.com/docs/embeddings/embedding-functions',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
  activityView: {
    type: 'search',
    title: '문구가 없어도 의미가 가까운 문서를 찾을까요?',
    instruction: '같은 질문으로 정확 문구 검색과 유사도 검색을 비교하세요.',
  },
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
