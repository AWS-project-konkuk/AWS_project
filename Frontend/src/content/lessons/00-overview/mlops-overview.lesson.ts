import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'mlops-overview',
  unit: 0,
  order: 1,
  title: '모델 파일에서 서비스까지, 무엇이 이어질까',
  summary:
    '리뷰 분류 모델의 정확도는 높지만 사용자가 호출할 주소도, 학습에 쓴 데이터 버전도 없습니다. 학습 완료와 서비스 준비의 차이부터 살펴봅니다.',
  scenario:
    '리뷰 분류 모델의 정확도는 높지만 사용자가 호출할 주소도, 학습에 쓴 데이터 버전도 없습니다. 학습 완료와 서비스 준비의 차이부터 살펴봅니다.',
  concepts: ['모델이 서비스가 되기까지', '모델 파일에서 서비스까지, 무엇이 이어질까'],
  assessment: {
    question: '새 리뷰 한 건의 예측 요청은 어디로 가야 할까요?',
    options: ['채택한 모델을 로딩한 추론 서버', '매 요청마다 전체 학습 파이프라인'],
    correct: 0,
    explanation:
      '원본 리뷰 → 전처리 → 학습용·평가용 분리 → 학습 → 평가 → 모델 등록 → 서버 로딩 순으로 자료를 추적합니다. 사용자 요청은 학습 작업을 다시 실행하지 않고 배포한 서버로 들어갑니다. 지표와 정답 표본은 다음 개선 여부를 판단하는 데 사용합니다.',
  },
  caution:
    '학습은 모델 파일을 만드는 흐름이고 추론은 채택한 모델로 요청에 응답하는 흐름입니다. 모니터링의 피드백은 다음 개선 판단으로 돌아가며 현재 실행의 입력을 무조건 순환시키지 않습니다.',
  reflection: '새 리뷰 한 건의 예측 요청은 어디로 가야 할까요?',
  references: [
    {
      title: '원문 · MLOps 1주차 · 실제 도구 실습',
      url: 'https://www.notion.so/896ebb1cb38a830b8ade81b394fce2f5',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://aws.amazon.com/what-is/mlops/',
    },
  ],
  sourceWeek: 1,
  mapStages: ['data', 'training', 'evaluation', 'registry', 'serving', 'monitoring'],
});
