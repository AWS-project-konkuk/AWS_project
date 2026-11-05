import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'ann-hnsw',
  unit: 6,
  order: 1,
  title: '정확 검색과 근사 검색의 비용 비교하기',
  summary:
    '문서 벡터가 많아지면서 모든 거리 계산을 수행하는 검색이 느려집니다. 속도를 높이되 놓치는 결과가 있는지 평가해야 합니다.',
  scenario:
    '문서 벡터가 많아지면서 모든 거리 계산을 수행하는 검색이 느려집니다. 속도를 높이되 놓치는 결과가 있는지 평가해야 합니다.',
  concepts: ['문서를 검색해 답변하기', '정확 검색과 근사 검색의 비용 비교하기'],
  assessment: {
    question: 'ANN 검색의 설정을 결정할 때 비교할 것은?',
    options: [
      '검색 지연·재현율·메모리와 업무 요구',
      '항상 정확 검색과 동일한 결과가 나온다고 가정한다',
    ],
    correct: 0,
    explanation:
      '동일한 질문 집합에서 정확 검색 결과를 기준으로 ANN의 recall·지연·메모리를 비교합니다. PostgreSQL도 pgvector 같은 확장으로 벡터와 HNSW 인덱스를 사용할 수 있으므로 관계형 DB와 벡터 검색은 배타적 선택이 아닙니다. 필터 조건과 데이터 크기도 선택에 영향을 줍니다.',
  },
  caution:
    'RAG는 검색한 근거의 품질과 생성 모델의 사용 방식에 의존합니다. 차원이 같아도 다른 임베딩 모델의 좌표는 호환되지 않을 수 있습니다. 근거가 없으면 답변을 보류할 수 있어야 하며 환각 제거를 보장하지 않습니다.',
  reflection: 'ANN 검색의 설정을 결정할 때 비교할 것은?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://github.com/pgvector/pgvector',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
});
