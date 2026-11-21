import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'observability-signals',
  unit: 8,
  order: 1,
  title: '지표·로그·트레이스로 하나의 요청 조사하기',
  summary:
    'p95 지연이 증가했지만 CPU는 정상입니다. 개별 요청이 피처 조회·모델 추론 중 어디에서 지연됐는지 확인해야 합니다.',
  scenario:
    '메트릭으로 지연이 커진 시간대를 좁히고, 로그 사건과 트레이스의 요청 식별자를 연결합니다. 같은 요청의 피처 조회와 모델 추론 구간을 비교해 조사할 지점을 골라 보세요.',
  concepts: ['운영 상태를 보고 개선하기', '지표·로그·트레이스로 하나의 요청 조사하기'],
  assessment: {
    question: 'Prometheus의 정상 응답률만으로 알 수 없는 것은?',
    options: ['정답 기준의 모델 예측 품질', '수집된 HTTP 오류율의 시간 변화'],
    correct: 0,
    explanation:
      '알림 → 지표로 시점·영향 범위 확인 → 트레이스로 느린 구간 확인 → 관련 로그와 버전 조사 순서로 접근합니다. 모델 품질은 정답 표본이나 업무 지표를 별도로 수집해야 합니다. LLM 서비스에서는 성능·품질·비용·안전을 함께 보되 관측 자료와 평가 기준을 직접 설계해야 합니다.',
  },
  caution:
    '지표는 집계 값이라 개별 요청의 원인을 알려주지 않습니다. 트레이스는 계측한 구간만 보이고, 로그는 양이 많아 저장·검색 비용이 듭니다. 세 신호를 같은 요청 ID로 연결해야 원인을 좁힐 수 있습니다.',
  reflection: 'Prometheus의 정상 응답률만으로 알 수 없는 것은?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://prometheus.io/docs/introduction/overview/',
    },
  ],
  sourceWeek: 7,
  mapStages: ['serving', 'monitoring'],
});
