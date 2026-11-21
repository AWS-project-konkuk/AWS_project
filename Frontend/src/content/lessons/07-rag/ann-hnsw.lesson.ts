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
    '정확 검색, HNSW의 이웃 그래프 탐색, IVF의 군집 탐색을 비교합니다. 탐색 범위를 늘리거나 줄일 때 지연 시간과 Recall@k를 함께 확인하는 이유를 살펴보세요.',
  concepts: ['문서를 검색해 답변하기', '정확 검색과 근사 검색의 비용 비교하기'],
  assessment: {
    question: 'ANN 검색의 설정을 결정할 때 비교할 것은?',
    options: [
      '검색 지연·재현율·메모리와 업무 요구',
      '항상 정확 검색과 동일한 결과가 나온다고 가정한다',
    ],
    correct: 0,
    explanation:
      'ANN은 일부 후보만 탐색하므로 정확 검색의 top-k 중 일부를 놓칠 수 있습니다. 같은 질문 집합에서 정확 검색 결과를 정답으로 두고 recall@k·지연·메모리를 함께 측정해, ef_search·M·nprobe 같은 설정을 업무 요구에 맞게 고릅니다.',
  },
  caution:
    'ANN은 속도를 위해 정확도를 일부 양보합니다. HNSW는 빠르고 recall이 높지만 그래프를 메모리에 두므로 메모리 사용이 크고 삽입이 느립니다. 정확 검색 결과를 기준으로 recall을 측정합니다.',
  reflection:
    '문서가 10만 건에서 1,000만 건으로 늘면서 검색 지연이 커졌습니다. 정확 검색, HNSW, IVF 중 무엇을 고르겠으며, 어떤 지표로 설정을 검증하겠습니까?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '논문 · HNSW (Malkov & Yashunin)',
      url: 'https://arxiv.org/abs/1603.09320',
    },
    {
      title: '공식 자료 · pgvector (PostgreSQL 벡터 확장)',
      url: 'https://github.com/pgvector/pgvector',
    },
    {
      title: '공식 자료 · Faiss 인덱스 가이드 (IVF)',
      url: 'https://github.com/facebookresearch/faiss/wiki/Faster-search',
    },
  ],
  sourceWeek: 6,
  mapStages: ['retrieval'],
});
