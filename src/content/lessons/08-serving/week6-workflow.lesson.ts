import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week6-workflow',
  unit: 7,
  order: 7,
  title: '사용자 응답을 지키며 모델 전환하기',
  summary:
    '주차 종합 실습 · Canary의 신규 응답은 사용자에게 전달됩니다. Shadow는 복제 요청을 비교하지만 사용자에게는 기존 모델의 응답을 전달합니다.',
  minutes: 18,
  scenario:
    '요청 경로·사용자 응답·비교 로그를 각각 연결하세요. 중단 배포 실패와 안전한 전략을 비교하고 신규 모델의 실제 응답 수를 확인하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  caution: '요청 복제와 사용자 응답 전환은 다른 관계입니다. 관측 후 승격 여부를 별도로 결정합니다.',
  reflection: 'Shadow에서 새 모델로 복제 요청 100건을 보냈다면 신규 사용자 응답 수는?',
  references: [
    {
      title: '원문 · MLOps 7주차 · 실제 도구 실습',
      url: 'https://www.notion.so/8f3ebb1cb38a828a88b401186cd88e3b',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://grpc.io/docs/what-is-grpc/introduction/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    },
  ],
  sourceWeek: 7,
  mapStages: ['registry', 'serving'],
  workflow: 'week6-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'requests',
      title: '사용자 요청',
      detail: '100개 실제 요청이 들어옵니다.',
    },
    {
      id: 'router',
      title: '요청 라우터',
      detail: '실제 트래픽과 복제 트래픽을 구분합니다.',
    },
    {
      id: 'old',
      title: '기존 모델',
      detail: '운영 버전에서 요청을 처리합니다.',
    },
    {
      id: 'new',
      title: '신규 모델',
      detail: '준비 상태와 신규 요청의 의미를 확인합니다.',
    },
    {
      id: 'response',
      title: '사용자에게 전달',
      detail: '실제 응답 수·실패 수를 계산합니다.',
    },
    {
      id: 'observe',
      title: '배포 관측',
      detail: '실제 응답과 Shadow 비교 결과를 따로 봅니다.',
    },
  ],
  fields: [
    {
      id: 'strategy',
      label: '배포 전략',
      initial: 'recreate',
      options: [
        {
          value: 'recreate',
          label: '중단 배포',
        },
        {
          value: 'bluegreen',
          label: 'Blue·Green',
        },
        {
          value: 'canary',
          label: 'Canary',
        },
        {
          value: 'shadow',
          label: 'Shadow',
        },
      ],
      help: '실제 요청 100건을 고정적으로 분배하는 예시입니다.',
    },
    {
      id: 'traffic',
      label: '신규 또는 복제 비율 (%)',
      initial: 10,
      min: 0,
      max: 100,
      step: 1,
      help: 'Canary는 실제 신규 응답, Shadow는 복제 요청의 비율입니다.',
    },
    {
      id: 'ready',
      label: '신규 모델 준비',
      initial: 'no',
      options: [
        {
          value: 'no',
          label: '준비되지 않음',
        },
        {
          value: 'yes',
          label: '준비 확인 완료',
        },
      ],
      help: '새 버전을 활성화하기 전 상태를 확인합니다.',
    },
    {
      id: 'phase',
      label: 'Blue·Green 전환',
      initial: 'prepare',
      options: [
        {
          value: 'prepare',
          label: '준비 · 기존 경로 유지',
        },
        {
          value: 'switch',
          label: '신규로 전환',
        },
        {
          value: 'rollback',
          label: '기존으로 롤백',
        },
      ],
      help: 'Blue·Green 전략일 때 사용합니다.',
    },
  ],
});
