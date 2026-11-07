import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'prometheus',
  unit: 8,
  order: 3,
  title: 'Prometheus로 지표를 수집하기',
  summary: '수집 간격과 임계값을 바꿔 운영 신호를 살펴봅니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['모델 서비스 지표', 'Prometheus', '알림'],
  assessment: {
    question: 'Prometheus가 모델 품질을 판단하려면?',
    options: [
      '품질에 필요한 지표와 피드백을 별도로 계측해야 한다',
      '아무 설정 없이 정답을 자동으로 알 수 있다',
    ],
    correct: 0,
    explanation: '지표 수집 도구가 정답 데이터 자체를 만들어 주지는 않습니다.',
  },
  advanced: [
    {
      title: '심화 · Prometheus TSDB',
      body: '수집된 시계열은 활성 Head와 디스크 블록 등의 구조로 관리됩니다. WAL은 장애 후 복구에 사용되고 압축·블록 병합과 보존 정책이 저장 비용에 영향을 줍니다. 메모리 매핑을 사용하더라도 저장 공간과 메모리 비용이 사라지지 않습니다. 높은 라벨 카디널리티는 시계열 수를 늘리므로 사용자 ID 같은 무제한 값을 피합니다.',
    },
  ],
  caution: '지표 수집 도구가 정답 데이터 자체를 만들어 주지는 않습니다.',
  reflection: 'Prometheus가 모델 품질을 판단하려면?',
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
  activity: {
    kind: 'metrics',
    fields: [
      {
        id: 'interval',
        label: '수집 간격 (초)',
        initial: 10,
        min: 1,
        max: 30,
        step: 1,
        help: '같은 신호를 얼마나 촘촘히 관측하는지 비교합니다.',
      },
      {
        id: 'limit',
        label: '지연 경고 기준 (ms)',
        initial: 180,
        min: 80,
        max: 300,
        step: 1,
        help: '관측과 경고 판정을 구분합니다.',
      },
    ],
    question: 'Prometheus가 모델 품질을 판단하려면?',
    options: [
      {
        value: 'a',
        label: '품질에 필요한 지표와 피드백을 별도로 계측해야 한다',
      },
      {
        value: 'b',
        label: '아무 설정 없이 정답을 자동으로 알 수 있다',
      },
    ],
    correct: 'a',
    explanation: '지표 수집 도구가 정답 데이터 자체를 만들어 주지는 않습니다.',
    task: '수집 간격과 기준을 바꿔 경고가 달라지는지 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '모델 서비스 지표',
      detail: 'Prometheus로 지표를 수집하기 · 1번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n1',
      title: 'Prometheus',
      detail: 'Prometheus로 지표를 수집하기 · 2번째 구성 요소',
      tone: '#799bc1',
    },
    {
      id: 'n2',
      title: '알림',
      detail: 'Prometheus로 지표를 수집하기 · 3번째 구성 요소',
      tone: '#799bc1',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'interval',
      label: '수집 간격 (초)',
      initial: 10,
      min: 1,
      max: 30,
      step: 1,
      help: '같은 신호를 얼마나 촘촘히 관측하는지 비교합니다.',
    },
    {
      id: 'limit',
      label: '지연 경고 기준 (ms)',
      initial: 180,
      min: 80,
      max: 300,
      step: 1,
      help: '관측과 경고 판정을 구분합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
