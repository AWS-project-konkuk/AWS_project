import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'pipeline-capstone',
  unit: 9,
  order: 2,
  title: '전체 파이프라인: 자료를 따라 끝까지',
  summary:
    '주차 종합 실습 · 단계 이름의 나열보다 각 단계의 입력·출력과 승인 조건을 이해하는 것이 중요합니다.',
  minutes: 18,
  scenario:
    '학습용·평가용 데이터와 모델의 흐름을 분리해 완성하세요. 평가 기준 0.90 실패와 0.80 성공을 비교하고 운영 피드백을 확인하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  caution: '학습용과 평가용 데이터의 경로를 구분하고 평가 승인을 받은 모델만 등록·서빙합니다.',
  reflection: '평가에 필요한 입력 두 가지는 무엇인가요?',
  references: [
    {
      title: '원문 · MLOps 1주차 · 실제 도구 실습',
      url: 'https://www.notion.so/896ebb1cb38a830b8ade81b394fce2f5',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://aws.amazon.com/what-is/mlops/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 1,
  mapStages: ['data', 'training', 'evaluation', 'registry', 'serving', 'monitoring'],
  workflow: 'pipeline-capstone',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'data',
      title: '원본 데이터',
      detail: '버전이 고정된 100개 표본을 제공합니다.',
    },
    {
      id: 'prep',
      title: '전처리·분할',
      detail: '학습 80개와 평가 20개로 나눕니다.',
    },
    {
      id: 'train',
      title: '모델 학습',
      detail: '학습용 데이터만 사용합니다.',
    },
    {
      id: 'eval',
      title: '모델 평가',
      detail: '모델과 학습에 쓰지 않은 평가용 데이터를 비교합니다.',
    },
    {
      id: 'registry',
      title: '모델 등록',
      detail: '승인 모델의 버전을 기록합니다.',
    },
    {
      id: 'serve',
      title: '모델 서빙',
      detail: '등록 모델로 예측을 제공합니다.',
    },
    {
      id: 'monitor',
      title: '모니터링',
      detail: '운영·품질을 관찰해 다음 개선에 연결합니다.',
    },
  ],
  fields: [
    {
      id: 'threshold',
      label: '평가 통과 기준',
      initial: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
      help: '예시 모델 정확도는 0.85입니다.',
    },
  ],
});
