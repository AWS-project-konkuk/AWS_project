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
    '입력 데이터가 요청 메시지로 바뀌어 서버에 전달되고, 예측 결과가 응답으로 돌아오는 경로를 따라갑니다. JSON 기반 HTTP API과 gRPC·Protobuf를 비교하고 직렬화·전송·추론 시간을 어디서 잴지 정해 보세요.',
  concepts: ['모델을 제공하고 교체하기', 'HTTP와 gRPC는 무엇을 바꿀까'],
  assessment: {
    question: 'gRPC로 바꾸면 자동으로 개선되는 것이 아닌 것은?',
    options: ['모델의 예측 정확도', '메시지 형식과 클라이언트 호출 계약'],
    correct: 0,
    explanation:
      '요청 직렬화 → 네트워크 전송 → 입력 검증·전처리 → 추론 → 응답 직렬화의 시간을 나눠 측정합니다. Batch와 Real-time은 처리 시점의 선택이고 HTTP·gRPC는 통신 방식의 선택이므로 서로 대체하는 분류가 아닙니다.',
  },
  caution:
    '프로토콜을 바꾸면 직렬화와 전송 시간은 줄일 수 있지만 추론 시간과 예측 품질은 그대로입니다. gRPC는 브라우저에서 바로 호출하기 어렵고, 중간 프록시가 HTTP/2를 지원해야 합니다.',
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
