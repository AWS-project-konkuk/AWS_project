import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-workflow',
  unit: 5,
  order: 3,
  title: '학습과 추론의 두 피처 경로',
  summary:
    '주차 종합 실습 · Feature Store는 피처의 일관된 제공, 벡터 검색은 관련 문서 조회, RAG는 근거를 생성 문맥에 전달하는 역할입니다. 서로 같은 기능이 아닙니다.',
  minutes: 18,
  scenario: '공통 정의에서 두 저장소로 분기하고 정의 차이를 수정하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  caution:
    '대량 과거 조회와 실시간 조회의 저장 방식은 달라도 피처 의미와 시점 기준을 관리해야 합니다.',
  reflection: '온라인·오프라인 경로에서 일치시켜야 하는 것은?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.feast.dev/getting-started/architecture/overview',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
  workflow: 'feature-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'source',
      title: '상품·행동 원천',
      detail: '행동 이벤트와 상품 문서를 분리합니다.',
    },
    {
      id: 'definition',
      title: '공통 피처 정의',
      detail: '최근 1시간 클릭 집계 정의를 관리합니다.',
    },
    {
      id: 'offline',
      title: '오프라인 피처',
      detail: '학습에 사용한 이력과 정의를 제공합니다.',
    },
    {
      id: 'online',
      title: '온라인 피처',
      detail: '실시간 조회용 피처를 제공합니다.',
    },
    {
      id: 'context',
      title: '학습·추론 피처 비교',
      detail: '피처 정의 일치와 검색 근거를 확인합니다.',
    },
    {
      id: 'answer',
      title: '피처 확인 결과',
      detail: '검증한 문맥에 근거한 고정 응답을 확인합니다.',
    },
  ],
  fields: [
    {
      id: 'window',
      label: '온라인 집계 시간',
      initial: 'day',
      options: [
        {
          value: 'day',
          label: '최근 24시간',
        },
        {
          value: 'hour',
          label: '최근 1시간 · 학습과 일치',
        },
      ],
      help: '오프라인 학습 정의는 최근 1시간입니다.',
    },
  ],
});
