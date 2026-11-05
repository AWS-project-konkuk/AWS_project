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
    'p95 지연이 증가했지만 CPU는 정상입니다. 개별 요청이 피처 조회·모델 추론 중 어디에서 지연됐는지 확인해야 합니다.',
  concepts: ['운영 상태를 보고 개선하기', '지표·로그·트레이스로 하나의 요청 조사하기'],
  assessment: {
    question: 'Prometheus의 정상 응답률만으로 알 수 없는 것은?',
    options: ['정답 기준의 모델 예측 품질', '수집된 HTTP 오류율의 시간 변화'],
    correct: 0,
    explanation:
      '알림 → 지표로 시점·영향 범위 확인 → 트레이스로 느린 구간 확인 → 관련 로그와 버전 조사 순서로 접근합니다. 모델 품질은 정답 표본이나 업무 지표를 별도로 수집해야 합니다. LLM 서비스에서는 성능·품질·비용·안전을 함께 보되 관측 자료와 평가 기준을 직접 설계해야 합니다.',
  },
  advanced: [
    {
      title: '심화 · Prometheus TSDB',
      body: '수집된 시계열은 활성 Head와 디스크 블록 등의 구조로 관리됩니다. WAL은 장애 후 복구에 사용되고 압축·블록 병합과 보존 정책이 저장 비용에 영향을 줍니다. 메모리 매핑을 사용하더라도 저장 공간과 메모리 비용이 사라지지 않습니다. 높은 라벨 카디널리티는 시계열 수를 늘리므로 사용자 ID 같은 무제한 값을 피합니다.',
    },
  ],
  caution:
    '입력 분포 변화가 반드시 정확도 하락을 뜻하지는 않습니다. 정답이 늦게 오는 서비스에서는 품질 확인도 지연됩니다. 지표만으로 개별 요청의 원인을 알기 어려우므로 로그·트레이스와 함께 조사합니다.',
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
