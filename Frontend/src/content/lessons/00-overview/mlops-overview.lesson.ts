import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'mlops-overview',
  unit: 0,
  order: 1,
  title: 'MLOps란?',
  summary:
    'MLOps의 의미와 핵심 개념을 알아보고, 모델의 개발부터 서비스 운영까지 이 과정에서 무엇을 어떤 순서로 배우는지 살펴봅니다.',
  scenario:
    'MLOps가 다루는 범위를 이해하고, 0~9단원의 학습 주제와 본문·예제·이해 확인·종합 실습의 진행 방식을 파악합니다.',
  concepts: ['MLOps의 의미와 필요성', '재현성·자동화·검증·관측', '전체 학습 과정과 진행 방법'],
  assessment: {
    question:
      '모델 학습에 성공한 팀이 MLOps를 적용하려고 합니다. 앞으로 함께 관리해야 할 범위로 가장 적절한 것은 무엇일까요?',
    options: [
      '데이터·코드·환경의 버전부터 평가·배포·운영 품질과 개선 과정까지 관리한다.',
      '학습 정확도를 높이고 모델 파일을 저장하면 모든 과정이 끝난다.',
      '서버가 응답하는지만 확인하면 모델의 예측 품질도 보장된다.',
    ],
    correct: 0,
    explanation:
      'MLOps는 모델 개발과 배포·운영을 연결합니다. 학습 정확도 외에도 데이터·코드·환경을 추적하고, 평가한 모델을 배포하며, 운영 중 시스템 상태와 예측 품질을 확인해야 합니다. 이 과정에서는 실행·저장 기초부터 데이터·학습 관리와 서비스 운영까지 차례로 배웁니다.',
  },
  caution:
    'MLOps는 특정 도구 하나가 아니라 개발·배포·운영을 연결하는 실천입니다. 도구의 이름보다 해결할 문제와 연결 관계를 먼저 이해합니다.',
  reflection:
    '모델 파일을 만든 뒤 서비스를 운영하려면 어떤 준비와 확인이 더 필요할까요? 앞으로 배울 단원에서 두 가지를 골라 역할을 설명해 보세요.',
  references: [
    {
      title: '원문 · MLOps 1주차 · 실제 도구 실습',
      url: 'https://www.notion.so/896ebb1cb38a830b8ade81b394fce2f5',
    },
    {
      title: 'AWS 공식 자료 · MLOps의 정의와 원칙',
      url: 'https://aws.amazon.com/what-is/mlops/',
    },
  ],
  sourceWeek: 1,
  mapStages: ['data', 'training', 'evaluation', 'registry', 'serving', 'monitoring'],
});
