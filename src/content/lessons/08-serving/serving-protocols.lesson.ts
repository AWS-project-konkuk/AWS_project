import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'serving-protocols',
  unit: 7,
  order: 1,
  title: 'HTTP와 gRPC는 무엇을 바꿀까',
  summary:
    '모델 추론은 빠른데 서비스 간 직렬화와 통신 비용이 큽니다. 프로토콜을 바꾸기 전에 비용이 어디서 발생하는지 측정합니다.',
  scenario:
    '모델 추론은 빠른데 서비스 간 직렬화와 통신 비용이 큽니다. 프로토콜을 바꾸기 전에 비용이 어디서 발생하는지 측정합니다.',
  concepts: ['모델을 제공하고 교체하기', 'HTTP와 gRPC는 무엇을 바꿀까'],
  assessment: {
    question: 'gRPC로 바꾸면 자동으로 개선되는 것이 아닌 것은?',
    options: ['모델의 예측 정확도', '메시지 형식과 클라이언트 호출 계약'],
    correct: 0,
    explanation:
      '요청 직렬화 → 네트워크 전송 → 입력 검증·전처리 → 추론 → 응답 직렬화의 시간을 나눠 측정합니다. Batch와 Real-time은 처리 시점의 선택이고 HTTP·gRPC는 통신 방식의 선택이므로 서로 대체하는 분류가 아닙니다.',
  },
  caution:
    '전송 프로토콜 선택은 모델 품질을 바꾸지 않습니다. Shadow는 새 모델의 응답을 사용자에게 보내지 않고, Canary는 일부 사용자에게 실제로 보냅니다. 전환과 승격은 별도 판단입니다.',
  reflection: 'gRPC로 바꾸면 자동으로 개선되는 것이 아닌 것은?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://grpc.io/docs/what-is-grpc/introduction/',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
});
