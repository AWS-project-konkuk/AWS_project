import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'rag-workflow',
  unit: 6,
  order: 5,
  title: '문서 준비와 질문 응답의 두 경로',
  summary:
    '주차 종합 실습 · Feature Store는 피처의 일관된 제공, 벡터 검색은 관련 문서 조회, RAG는 근거를 생성 문맥에 전달하는 역할입니다. 서로 같은 기능이 아닙니다.',
  minutes: 18,
  scenario:
    '저장소를 Vector DB로 바꾸고 질문 경로를 연결하세요. 실패한 실행에서 검색이 차단된 이유를 확인하고, 질문과 문서의 임베딩 공간을 맞춘 뒤 근거 ID가 붙은 답변을 비교합니다.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  caution:
    '벡터 DB는 검색 구성 요소이며 RAG가 환각 제거를 보장하지 않습니다. 임베딩 모델이 달라도 차원이 같으면 오류 없이 틀린 결과가 나옵니다. 이 활동은 고정 문서·고정 응답을 사용합니다.',
  reflection:
    '검색한 문서가 있어도 응답의 정확성이 보장되지 않는 이유는? 저장-질문 임베딩 불일치는 Feature Store의 학습-서빙 불일치와 어떤 점이 닮았습니까?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · Chroma 쿼리와 메타데이터 필터',
      url: 'https://docs.trychroma.com/docs/querying-collections/query-and-get',
    },
    {
      title: '논문 · Retrieval-Augmented Generation (Lewis 외)',
      url: 'https://arxiv.org/abs/2005.11401',
    },
    {
      title: '공식 자료 · pgvector (PostgreSQL 벡터 확장)',
      url: 'https://github.com/pgvector/pgvector',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
  workflow: 'rag-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'source',
      title: '상품·행동 원천',
      detail: '행동 이벤트와 상품 문서를 분리합니다.',
    },
    {
      id: 'index',
      title: '문서 임베딩·인덱스',
      detail: '문서를 같은 공간의 벡터로 보관합니다.',
    },
    {
      id: 'search',
      title: '질문 유사도 검색',
      detail: '질문과 가까운 문서를 찾습니다.',
    },
    {
      id: 'context',
      title: '검색 근거 조립',
      detail: '피처 정의 일치와 검색 근거를 확인합니다.',
    },
    {
      id: 'answer',
      title: '응답 예시',
      detail: '검증한 문맥에 근거한 고정 응답을 확인합니다.',
    },
    {
      id: 'query',
      title: '질문 임베딩',
      detail: '사용자 질문을 문서와 같은 공간으로 변환합니다.',
    },
  ],
  fields: [
    {
      id: 'embedding',
      label: '질문 임베딩 공간',
      initial: 'other',
      options: [
        {
          value: 'other',
          label: '다른 모델의 벡터 공간',
        },
        {
          value: 'same',
          label: '저장 문서와 같은 벡터 공간',
        },
      ],
      help: '차원이 같아도 모델 공간이 다르면 호환되지 않을 수 있습니다.',
    },
    {
      id: 'retrieval',
      label: '전달할 검색 근거',
      initial: 'irrelevant',
      options: [
        {
          value: 'irrelevant',
          label: '무관한 날씨 문서',
        },
        {
          value: 'relevant',
          label: '상품 반품 정책 문서',
        },
      ],
      help: '질문: 구매한 상품을 반품할 수 있나요?',
    },
  ],
});
