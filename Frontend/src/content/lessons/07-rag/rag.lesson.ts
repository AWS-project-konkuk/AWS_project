import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'rag',
  unit: 6,
  order: 4,
  title: 'RAG는 검색한 근거를 생성에 전달',
  summary: '관련 문서를 찾는 단계와 답변을 만드는 단계를 연결합니다.',
  scenario:
    '노드 예제로 문서 색인과 사용자 질문의 흐름을 따라가며 검색한 문서가 생성 입력에 도착하는 지점을 찾습니다. 답이 틀렸을 때 검색 결과와 모델이 근거를 사용하는 과정을 각각 확인해 보세요.',
  concepts: ['질문', '벡터 검색', '검색 근거', '답변 생성'],
  assessment: {
    question: '검색 결과를 생성 단계에 전달하는 목적은?',
    options: ['어떤 질문에도 정답을 보장하기 위해', '답변이 참고할 관련 근거를 제공하기 위해'],
    correct: 1,
    explanation:
      'RAG는 LLM이 모르는 최신·내부 정보를 근거로 넣어 답의 사실성을 높이고 출처를 밝힐 수 있게 합니다. 하지만 검색이 틀리거나 근거가 오래되면 답도 틀릴 수 있어, 근거의 관련성·최신성과 답의 근거 충실도를 계속 확인해야 합니다.',
  },
  caution:
    '근거의 관련성과 최신성, 답변의 사실성을 계속 확인해야 합니다. RAG는 환각을 줄이지만 제거를 보장하지 않으며, 근거가 없으면 답을 보류하도록 설계합니다.',
  reflection:
    'RAG 챗봇이 틀린 답을 했습니다. 검색 실패인지 생성 실패인지 어떤 순서로 확인하겠으며, 각각 어느 단계를 고치겠습니까?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '논문 · Retrieval-Augmented Generation (Lewis 외)',
      url: 'https://arxiv.org/abs/2005.11401',
    },
    {
      title: '공식 자료 · AWS: RAG란 무엇인가요?',
      url: 'https://aws.amazon.com/what-is/retrieval-augmented-generation/',
    },
    {
      title: '공식 자료 · pgvector (PostgreSQL 벡터 확장)',
      url: 'https://github.com/pgvector/pgvector',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
  nodeExample: {
    id: 'rag-retrieve-context',
    title: '검색 결과는 생성 모델에 어떻게 도착할까',
    prompt:
      '문서는 미리 색인됐다고 가정합니다. 질문 처리 단계에서 검색한 문서가 생성 입력으로 들어가는 부분을 연결하세요.',
    nodes: [
      {
        id: 'query',
        title: '질문 임베딩',
        purpose: '사용자 질문을 문서와 같은 벡터 공간으로 변환합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'index',
        title: '문서 벡터 색인',
        purpose: '미리 준비한 문서 벡터를 제공합니다.',
        x: 0,
        y: 260,
      },
      {
        id: 'search',
        title: '유사도 검색',
        purpose: '질문에 관련된 문서 조각을 조회합니다.',
        x: 330,
        y: 110,
      },
      {
        id: 'generation',
        title: '근거 기반 생성',
        purpose: '질문과 검색 근거를 함께 사용합니다.',
        x: 660,
        y: 110,
      },
    ],
    links: [
      {
        id: 'query-search',
        source: 'query',
        target: 'search',
        label: '질문 벡터',
        detail: '문서와 호환되는 임베딩 공간의 질문 벡터입니다.',
        material: 'vector',
      },
      {
        id: 'index-search',
        source: 'index',
        target: 'search',
        label: '문서 색인',
        detail: '검색 대상 문서와 벡터는 사전에 준비되어 있어야 합니다.',
        material: 'vector',
      },
      {
        id: 'search-generation',
        source: 'search',
        target: 'generation',
        label: '검색한 문서 근거',
        detail: '생성 모델에 관련 문서를 전달합니다. 관련성과 최신성은 별도로 검증합니다.',
        material: 'document',
      },
    ],
    practiceHint:
      '검색한 문서가 생성 입력에 도착하도록 연결하세요. 검색 단계가 답변을 직접 생성하는 것은 아닙니다.',
    nextLesson: 'rag-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activityView: {
    type: 'structure',
    title: '검색한 자료를 바꾸면 답변도 달라질까요?',
    instruction:
      '관련 자료, 무관한 자료, 근거가 없는 상황 중 하나를 골라 답변 예시까지 따라가세요.',
  },
  activity: {
    kind: 'rag',
    fields: [
      {
        id: 'evidence',
        label: '답변 문맥',
        initial: 'none',
        options: [
          {
            value: 'none',
            label: '검색 근거 없음',
          },
          {
            value: 'relevant',
            label: '관련 근거 전달',
          },
          {
            value: 'wrong',
            label: '관련 없는 근거 전달',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '검색 결과를 생성 단계에 전달하는 목적은?',
    options: [
      {
        value: 'b',
        label: '어떤 질문에도 정답을 보장하기 위해',
      },
      {
        value: 'a',
        label: '답변이 참고할 관련 근거를 제공하기 위해',
      },
    ],
    correct: 'a',
    explanation: '근거의 관련성과 최신성, 답변의 사실성을 계속 확인해야 합니다.',
    task: '근거가 없을 때·관련 있을 때·잘못됐을 때를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '질문',
      detail: 'RAG는 검색한 근거를 생성에 전달 · 1번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: '벡터 검색',
      detail: 'RAG는 검색한 근거를 생성에 전달 · 2번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: '검색 근거',
      detail: 'RAG는 검색한 근거를 생성에 전달 · 3번째 구성 요소',
      tone: '#a287bd',
    },
    {
      id: 'n3',
      title: '답변 생성',
      detail: 'RAG는 검색한 근거를 생성에 전달 · 4번째 구성 요소',
      tone: '#a287bd',
    },
  ],
  fields: [
    {
      id: 'evidence',
      label: '답변 문맥',
      initial: 'none',
      options: [
        {
          value: 'none',
          label: '검색 근거 없음',
        },
        {
          value: 'relevant',
          label: '관련 근거 전달',
        },
        {
          value: 'wrong',
          label: '관련 없는 근거 전달',
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
      label: '질문 → 벡터 검색',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '벡터 검색 → 검색 근거',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n2-n3',
      kind: 'edge',
      from: 'n2',
      to: 'n3',
      label: '검색 근거 → 답변 생성',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
    ['n2', 'n3'],
  ],
});
