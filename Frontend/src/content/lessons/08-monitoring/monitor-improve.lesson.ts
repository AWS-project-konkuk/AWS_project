import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'monitor-improve',
  unit: 8,
  order: 4,
  title: '관측에서 검증된 개선까지',
  summary: '알림을 조사하고 재평가한 모델만 다시 배포합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['모니터링 알림', '원인 조사', '데이터·모델 개선', '재평가·배포'],
  assessment: {
    question: '관측 후 개선에서 필요한 순서는?',
    options: ['새 모델이면 평가 없이 즉시 배포한다', '원인을 조사하고 개선안을 평가한 뒤 배포한다'],
    correct: 1,
    explanation: '관측 신호가 곧 안전한 개선을 보장하지 않습니다.',
  },
  advanced: [
    {
      title: '심화 · Prometheus TSDB',
      body: '수집된 시계열은 활성 Head와 디스크 블록 등의 구조로 관리됩니다. WAL은 장애 후 복구에 사용되고 압축·블록 병합과 보존 정책이 저장 비용에 영향을 줍니다. 메모리 매핑을 사용하더라도 저장 공간과 메모리 비용이 사라지지 않습니다. 높은 라벨 카디널리티는 시계열 수를 늘리므로 사용자 ID 같은 무제한 값을 피합니다.',
    },
  ],
  caution: '관측 신호가 곧 안전한 개선을 보장하지 않습니다.',
  reflection: '관측 후 개선에서 필요한 순서는?',
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
  ],
  sourceWeek: 7,
  mapStages: ['serving', 'monitoring'],
  nodeExample: {
    id: 'monitor-decision',
    title: '경고가 뜨면 바로 재학습해도 될까',
    prompt:
      '운영 경고는 조사할 신호입니다. 관측 이후의 판단과 검증을 포함하는 개선 흐름을 연결하세요.',
    nodes: [
      {
        id: 'monitor',
        title: '운영 관측',
        purpose: '입력 분포·오류율·정답 표본을 확인합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'decision',
        title: '원인 조사',
        purpose: '수집 오류·피처 변화·모델 품질을 구분합니다.',
        x: 300,
        y: 0,
      },
      {
        id: 'evaluation',
        title: '후보 재평가',
        purpose: '수정한 후보를 별도 기준으로 검증합니다.',
        x: 600,
        y: 0,
      },
      {
        id: 'approval',
        title: '배포 판단',
        purpose: '기준을 통과한 후보의 채택을 결정합니다.',
        x: 900,
        y: 0,
      },
    ],
    links: [
      {
        id: 'monitor-decision',
        source: 'monitor',
        target: 'decision',
        label: '관측 근거',
        detail: '경고 자체가 재학습 지시는 아닙니다.',
        material: 'metrics',
      },
      {
        id: 'decision-evaluation',
        source: 'decision',
        target: 'evaluation',
        label: '조사 결과와 후보',
        detail: '필요한 변경을 선택한 뒤 평가를 거칩니다.',
        material: 'decision',
      },
      {
        id: 'evaluation-approval',
        source: 'evaluation',
        target: 'approval',
        label: '평가 결과',
        detail: '지표 개선 여부와 운영 조건을 확인하고 배포를 판단합니다.',
        material: 'approval',
      },
    ],
    practiceHint:
      '평가 결과가 배포 판단에 도착해야 합니다. 경고에서 배포로 바로 건너뛰는 연결은 만들지 마세요.',
    nextLesson: 'week7-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activity: {
    kind: 'improve',
    fields: [
      {
        id: 'decision',
        label: '알림 이후 선택',
        initial: 'deploy',
        options: [
          {
            value: 'deploy',
            label: '평가 없이 즉시 배포',
          },
          {
            value: 'investigate',
            label: '조사 → 개선 → 평가 → 배포',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '관측 후 개선에서 필요한 순서는?',
    options: [
      {
        value: 'b',
        label: '새 모델이면 평가 없이 즉시 배포한다',
      },
      {
        value: 'a',
        label: '원인을 조사하고 개선안을 평가한 뒤 배포한다',
      },
    ],
    correct: 'a',
    explanation: '관측 신호가 곧 안전한 개선을 보장하지 않습니다.',
    task: '즉시 배포와 조사·평가 흐름을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '모니터링 알림',
      detail: '관측에서 검증된 개선까지 · 1번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n1',
      title: '원인 조사',
      detail: '관측에서 검증된 개선까지 · 2번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n2',
      title: '데이터·모델 개선',
      detail: '관측에서 검증된 개선까지 · 3번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n3',
      title: '재평가·배포',
      detail: '관측에서 검증된 개선까지 · 4번째 구성 요소',
      tone: '#799bc1',
    },
  ],
  fields: [
    {
      id: 'decision',
      label: '알림 이후 선택',
      initial: 'deploy',
      options: [
        {
          value: 'deploy',
          label: '평가 없이 즉시 배포',
        },
        {
          value: 'investigate',
          label: '조사 → 개선 → 평가 → 배포',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: '모니터링 알림 → 원인 조사',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '원인 조사 → 데이터·모델 개선',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n2-n3',
      kind: 'edge',
      from: 'n2',
      to: 'n3',
      label: '데이터·모델 개선 → 재평가·배포',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
    ['n2', 'n3'],
  ],
});
