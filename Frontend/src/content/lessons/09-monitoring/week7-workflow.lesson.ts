import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week7-workflow',
  unit: 8,
  order: 5,
  title: '모델 품질 경고에서 검증된 개선까지',
  summary:
    '주차 종합 실습 · Prometheus는 계측한 지표를 수집합니다. 품질의 정답을 만들어 주지 않으며 알림은 원인 조사와 평가를 시작하는 신호입니다.',
  minutes: 18,
  scenario:
    '지표 수집 노드를 추가해 피처 갱신 지연을 확인하세요. 갱신 주기를 조정해 기준을 통과한 모델만 배포하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  caution:
    '정답·피드백이 있어야 품질을 판단할 수 있습니다. 관측→조사→개선→재평가→배포가 하나의 반복 과정입니다.',
  reflection: '서버 지연과 오류율이 정상인데도 품질 관측이 필요한 이유는?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://prometheus.io/docs/introduction/overview/',
    },
    {
      title: 'OpenTelemetry · 관측 신호',
      url: 'https://opentelemetry.io/docs/concepts/signals/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['serving', 'monitoring'],
  workflow: 'week7-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'service',
      title: '운영 모델',
      detail: '정상 HTTP 응답과 예측 로그를 냅니다.',
    },
    {
      id: 'truth',
      title: '정답 피드백',
      detail: '검증 표본의 실제 정답을 제공합니다.',
    },
    {
      id: 'prom',
      title: '관측·Prometheus',
      detail: '시스템과 품질 지표를 계측해 수집합니다.',
    },
    {
      id: 'review',
      title: '원인 조사',
      detail: '데이터·정답·모델을 검토합니다.',
    },
    {
      id: 'candidate',
      title: '모델 개선',
      detail: '조사에 근거해 후보를 만듭니다.',
    },
    {
      id: 'evaluate',
      title: '재평가',
      detail: '후보 모델을 기준 0.85와 비교합니다.',
    },
    {
      id: 'release',
      title: '안전한 재배포',
      detail: '평가를 통과한 모델만 반영합니다.',
    },
  ],
  fields: [
    {
      id: 'decision',
      label: '알림 이후 판단',
      initial: 'immediate',
      options: [
        {
          value: 'immediate',
          label: '조사 없이 즉시 갱신',
        },
        {
          value: 'investigate',
          label: '원인 조사 후 개선',
        },
      ],
      help: '입력 변화와 모델 품질 저하를 함께 확인합니다.',
    },
    {
      id: 'quality',
      label: '후보 모델 정확도',
      initial: 0.78,
      min: 0.5,
      max: 1,
      step: 0.01,
      help: '예시 검증 기준은 0.85입니다.',
    },
    {
      id: 'labels',
      label: '정답 피드백',
      initial: 'available',
      options: [
        {
          value: 'available',
          label: '검증한 정답 표본 있음',
        },
        {
          value: 'missing',
          label: '정답 표본 없음',
        },
      ],
      help: '정답이 없으면 품질 저하를 확정해 표시하지 않습니다.',
    },
  ],
});
