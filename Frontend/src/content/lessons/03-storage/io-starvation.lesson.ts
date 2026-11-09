import { createElement as h, useState } from 'react';
import { defineMdxLesson } from '../../defineLesson';

const comparisons = [
  {
    title: '병렬 데이터 로더',
    summary: '여러 배치를 동시에 읽고 전처리',
    before: ['로더 1: [A 준비] → [B 준비]'],
    after: ['로더 1: [A 준비]', '로더 2: [B 준비]'],
    effect: '여러 작업자가 배치를 나눠 준비합니다.',
  },
  {
    title: 'Prefetch',
    summary: '현재 계산 중에 다음 배치를 준비',
    before: ['[A 계산] → [B 준비] → [B 계산]'],
    after: ['GPU:  [A 계산] → [B 계산]', '로더: [B 준비] → [C 준비]'],
    effect: '위아래 같은 칸의 계산과 준비가 겹칩니다.',
  },
  {
    title: 'Cache',
    summary: '반복 데이터는 가까운 곳에서 재사용',
    before: ['첫 읽기: 원격 저장소 → GPU', '재사용: 원격 저장소 → GPU'],
    after: ['첫 읽기: 원격 → 로컬 캐시 → GPU', '재사용: 로컬 캐시 → GPU'],
    effect: '다시 읽을 때 원격 저장소까지 가지 않습니다.',
  },
  {
    title: 'Sharding',
    summary: '작은 파일을 묶어 읽기 요청 감소',
    before: ['[A]   [B]   [C]   [D]', '요청① 요청② 요청③ 요청④'],
    after: ['[ 묶음: A · B · C · D ]', '묶음 단위 읽기 → 요청①'],
    effect: '이 예시에서는 요청 4번이 1번으로 줄어듭니다.',
  },
];

function IoComparison() {
  const [enabled, setEnabled] = useState([true, true, true, true]);
  return h(
    'span',
    { className: 'io-comparison' },
    h(
      'style',
      null,
      `
      /* 이 강의에서만 공통 입력·재생·결과 영역을 카드 활동으로 대체합니다. */
      section[data-testid="inline-activity"]:has(.io-comparison) > :not(header),
      section[data-testid="inline-activity"]:has(.io-comparison) > header > :not(h3) { display: none; }
      .io-comparison { display: block; font-weight: 400; }
      .io-comparison .io-intro { display: block; margin: 8px 0 16px; font-size: 14px; }
      .io-comparison .io-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .io-comparison .io-card {
        display: flex; flex-direction: column; gap: 10px; min-width: 0;
        padding: 16px; border: 1px solid var(--border); border-radius: 12px;
        background: var(--page); font-size: 14px;
      }
      .io-comparison .io-title { font-size: 17px; }
      .io-comparison .io-diagram {
        display: block; padding: 12px; border-left: 4px solid var(--soft);
        background: var(--panel); min-height: 108px; overflow-x: auto;
      }
      .io-comparison .io-diagram[data-enabled="true"] { border-color: var(--accent); }
      .io-comparison .io-line { display: block; white-space: pre; font-family: monospace; font-size: 12px; }
      .io-comparison .io-effect { display: block; min-height: 44px; }
      .io-comparison button { margin-top: auto; padding: 8px 12px; cursor: pointer; }
      .io-comparison button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
      @media (max-width: 680px) { .io-comparison .io-grid { grid-template-columns: 1fr; } }
    `,
    ),
    h('strong', null, '데이터를 빨리 준비하는 네 가지 방법'),
    h(
      'span',
      { className: 'io-intro' },
      '네 방식의 차이를 비교하세요. 각 카드의 버튼을 누르면 개선 전·후가 바뀝니다.',
    ),
    h(
      'span',
      { className: 'io-grid' },
      comparisons.map((item, index) =>
        h(
          'span',
          { className: 'io-card', key: item.title },
          h('strong', { className: 'io-title' }, item.title),
          h('span', null, item.summary),
          h(
            'span',
            { className: 'io-diagram', 'data-enabled': enabled[index], 'aria-live': 'polite' },
            h('strong', null, enabled[index] ? '개선 후' : '개선 전'),
            ...(enabled[index] ? item.after : item.before).map((line) =>
              h('span', { className: 'io-line', key: line }, line),
            ),
          ),
          h('span', { className: 'io-effect' }, item.effect),
          h(
            'button',
            {
              type: 'button',
              'aria-label': `${item.title} ${enabled[index] ? '개선 전' : '개선 후'} 보기`,
              onClick: () =>
                setEnabled((current) => current.map((value, i) => (i === index ? !value : value))),
            },
            enabled[index] ? '개선 전 보기' : '개선 후 보기',
          ),
        ),
      ),
    ),
    h(
      'small',
      { style: { display: 'block', marginTop: 12 } },
      '동작 원리를 단순화한 예시입니다. 네 방식은 함께 사용할 수 있으며 실제 속도는 작업 조건에 따라 달라집니다.',
    ),
  );
}

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'io-starvation',
  unit: 2,
  order: 4,
  title: '데이터가 늦으면 GPU도 기다린다',
  summary: '공급 속도와 소비 속도를 맞춰 I/O 병목을 줄입니다.',
  scenario:
    'GPU는 초당 100배치를 처리할 수 있지만 데이터 로더는 30배치만 준비합니다. 저장소 읽기·CPU 전처리·장치 전송을 나누어 측정하고 가장 느린 구간을 개선하세요.',
  concepts: ['원본 데이터', '로더·캐시', 'GPU'],
  assessment: {
    question: 'GPU가 다음 배치를 오래 기다리면 먼저 확인할 것은?',
    options: [
      '데이터 공급과 전처리 병목',
      'GPU 개수만 무조건 늘리기',
      '데이터를 옮기지 않고 저장소 용량만 늘리기',
      'CPU와 메모리 사용량을 확인하지 않고 로더 worker 수를 최대로 늘리기',
    ],
    correct: 0,
    explanation:
      'GPU 사용률만 보고 장치를 늘리지 말고 배치 대기 시간, 저장소 읽기, CPU 전처리와 GPU 전송 시간을 나누어 확인해야 합니다.',
  },
  advanced: [
    {
      title: '심화 · 로더 병렬성과 작은 파일',
      body: 'worker 수를 늘리면 읽기와 전처리를 겹칠 수 있지만 CPU·메모리·스토리지 경쟁도 커집니다. 작은 샘플 파일을 shard로 묶으면 요청 수와 메타데이터 부담을 줄일 수 있습니다. 변경 전후의 배치 대기 시간과 처리량을 같은 조건에서 비교하세요.',
    },
  ],
  caution: '캐시는 반복 읽기에만 유리하며 첫 읽기와 CPU 전처리 병목까지 해결하지는 않습니다.',
  reflection:
    'GPU 사용률이 낮을 때 저장소, CPU 전처리, GPU 중 병목 위치를 어떻게 구분할 수 있을까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'AWS 공식 · EKS AI/ML 스토리지 최적화',
      url: 'https://docs.aws.amazon.com/eks/latest/best-practices/aiml-storage.html',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.pytorch.org/docs/stable/data.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  nodeExample: {
    id: 'storage-cpu-gpu',
    title: '학습 데이터가 GPU에 도착하는 경로 연결하기',
    prompt:
      '저장소·CPU·GPU의 역할을 보고 데이터가 이동할 방향을 정하세요. 처음에는 연결선이 없습니다. 원하는 노드의 출력과 입력을 연결한 뒤 연결 확인을 눌러 보세요.',
    nodes: [
      {
        id: 'storage',
        title: '저장소',
        purpose: '학습에 사용할 원본 이미지나 텍스트 파일을 보관합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'cpu',
        title: 'CPU',
        purpose: '파일을 읽고 디코딩·전처리한 뒤, 배치를 호스트 메모리에 준비합니다.',
        x: 300,
        y: 0,
      },
      {
        id: 'gpu',
        title: 'GPU',
        purpose: '전달받은 배치로 모델의 학습 계산을 수행합니다.',
        x: 600,
        y: 0,
      },
    ],
    links: [
      {
        id: 'storage-cpu',
        source: 'storage',
        target: 'cpu',
        label: '원본 데이터',
        detail: 'CPU의 데이터 로더가 저장소에서 원본 파일을 읽어 디코딩과 전처리를 수행합니다.',
        material: 'data',
      },
      {
        id: 'cpu-gpu',
        source: 'cpu',
        target: 'gpu',
        label: '준비된 배치',
        detail: 'CPU에서 전처리해 호스트 메모리에 준비한 배치를 GPU 메모리로 전송합니다.',
        material: 'data',
      },
    ],
    practiceHint:
      '원본 파일을 학습용 배치로 바꾸는 역할과 그 배치로 계산하는 역할을 구분하세요. 각 노드의 출력과 입력을 연결한 뒤 연결 확인을 눌러 보세요.',
    nextLesson: 'pv-pvc',
    kind: '자료 전달',
    afterSection: 1,
  },
  activity: {
    kind: 'io',
    fields: [],
    question: '현재 배치를 GPU가 계산하는 동안 다음 배치를 준비하는 방식은?',
    options: [
      {
        value: 'a',
        label: 'Prefetch · 현재 계산과 다음 배치 준비를 겹친다',
      },
      {
        value: 'b',
        label: '병렬 데이터 로더 · 여러 배치를 미리 읽고 전처리한다',
      },
      {
        value: 'c',
        label: 'Cache · 반복해서 읽는 데이터를 가까운 저장 공간에 보관한다',
      },
      {
        value: 'd',
        label: 'Sharding · 많은 작은 파일을 큰 묶음으로 구성해 요청 횟수를 줄인다',
      },
    ],
    correct: 'a',
    explanation:
      '정답은 Prefetch입니다. 병렬 데이터 로더의 핵심은 여러 배치의 읽기·전처리를 동시에 수행하는 것이고, Prefetch의 핵심은 현재 계산과 다음 배치 준비를 겹치는 것입니다. Cache는 가까운 저장 공간의 데이터를 재사용하고, Sharding은 작은 파일을 묶어 요청 횟수를 줄입니다. 네 방식은 함께 사용할 수도 있습니다.',
    // 공통 Activity는 task를 React 자식으로 렌더링합니다. 다른 파일을 변경하지
    // 않고 이 강의에만 카드를 표시하도록 문자열 타입과의 경계를 여기로 한정합니다.
    task: h(IoComparison) as unknown as string,
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '원본 데이터',
      detail: '데이터가 늦으면 GPU도 기다린다 · 1번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n1',
      title: '로더·캐시',
      detail: '데이터가 늦으면 GPU도 기다린다 · 2번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n2',
      title: 'GPU',
      detail: '데이터가 늦으면 GPU도 기다린다 · 3번째 구성 요소',
      tone: '#6eac9b',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'supply',
      label: '데이터 공급 속도',
      initial: 30,
      min: 10,
      max: 200,
      step: 1,
      help: '초당 배치 수의 교육용 예시입니다.',
    },
    {
      id: 'demand',
      label: 'GPU 소비 속도',
      initial: 100,
      min: 10,
      max: 200,
      step: 1,
      help: 'GPU가 처리할 수 있는 초당 배치 수입니다.',
    },
    {
      id: 'cache',
      label: '반복 읽기 캐시',
      initial: 'off',
      options: [
        {
          value: 'off',
          label: '사용 안 함',
        },
        {
          value: 'on',
          label: '사용 · 공급 2배 가정',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
