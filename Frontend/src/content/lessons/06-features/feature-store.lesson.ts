import { createElement as h, useState } from 'react';
import { defineMdxLesson } from '../../defineLesson';

const architectureParts = {
  monitoring: {
    title: 'Operational Monitoring',
    description: 'Transform·Storage·Serving 전체의 갱신 지연, 누락, 오류와 피처 품질을 관찰합니다.',
    input: '수집·계산·저장·조회 과정의 로그와 지표',
    output: '오래된 값, 실패한 갱신, 품질 이상에 대한 알림',
  },
  transform: {
    title: 'Transform',
    description: '스트림과 배치 원천 데이터를 모델이 사용할 피처로 계산합니다.',
    input: 'Stream Source의 클릭 이벤트 + Batch Source의 상품·고객 데이터',
    output: 'item_clicks_l7d · item_price · user_spend_l30d',
  },
  storage: {
    title: 'Storage',
    description: '같은 의미의 피처를 최신 값과 과거 이력으로 나누어 보관합니다.',
    input: 'Transform에서 계산한 엔터티별 피처 값과 시각',
    output: 'Online Storage의 최신 값 + Offline Storage의 과거 이력',
  },
  serving: {
    title: 'Serving',
    description: '요청한 피처와 엔터티를 받아 추론용 벡터 또는 학습용 데이터프레임을 제공합니다.',
    input: '피처 이름 + user_id·item_id + 학습에 필요한 기준 시각',
    output: '실시간 추론 → 최신 피처 벡터 / 모델 학습 → 과거 학습 데이터',
  },
  registry: {
    title: 'Registry',
    description: '피처의 정의와 버전, 엔터티 키, 자료형과 소유자를 등록하고 공유합니다.',
    input: '피처를 만드는 코드와 메타데이터',
    output: '계산·저장·제공 과정이 함께 참조하는 공통 정의',
  },
} as const;

type ArchitecturePart = keyof typeof architectureParts;
type RequestMode = 'online' | 'training';

/** Feature Store의 구성 요소와 추론·학습 경로를 살펴보는 활동입니다. */
export function Activity() {
  const [part, setPart] = useState<ArchitecturePart>('serving');
  const [mode, setMode] = useState<RequestMode>('online');
  const info = architectureParts[part];
  const chooseMode = (next: RequestMode) => setMode(next);
  const reset = () => {
    setPart('serving');
    setMode('online');
  };

  const block = (
    id: ArchitecturePart,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    subtitle: string,
  ) =>
    h(
      'g',
      {
        className: 'fs-block',
        role: 'button',
        tabIndex: 0,
        'aria-label':
          info.title === architectureParts[id].title
            ? label + ' 설명 선택됨'
            : label + ' 설명 보기',
        'aria-pressed': part === id,
        onClick: () => setPart(id),
        onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setPart(id);
          }
        },
        key: id,
      },
      h('rect', { x, y, width, height, rx: 5 }),
      h(
        'text',
        { x: x + width / 2, y: y + height / 2 - (subtitle ? 5 : -5), textAnchor: 'middle' },
        label,
      ),
      subtitle &&
        h(
          'text',
          {
            className: 'fs-svg-small',
            x: x + width / 2,
            y: y + height / 2 + 17,
            textAnchor: 'middle',
          },
          subtitle,
        ),
    );

  const line = (d: string, active: boolean, dashed = false) =>
    h('path', {
      d,
      className: 'fs-line' + (active ? ' fs-line-active' : ''),
      strokeDasharray: dashed ? '5 6' : undefined,
      markerEnd: active ? 'url(#fs-photo-arrow-active)' : 'url(#fs-photo-arrow)',
    });

  return h(
    'section',
    {
      className: 'fs-photo-activity',
      'aria-label': 'Feature Store 아키텍처 활동',
      'data-testid': 'feature-store-activity',
    },
    h(
      'style',
      null,
      `
      .fs-photo-activity { --fs-salmon: #f3a296; --fs-ink: #51332e; --fs-focus: #ba4a38; margin: 24px 0; padding: clamp(14px, 2.5vw, 24px); border: 1px solid var(--border); border-radius: 14px; background: var(--panel); color: var(--text); font-size: 14px; font-weight: 400; line-height: 1.65; }
      .fs-photo-activity * { box-sizing: border-box; }
      .fs-photo-activity h3 { margin: 4px 0 8px; font-size: 20px; }
      .fs-photo-activity h4 { margin: 0 0 8px; font-size: 16px; }
      .fs-photo-activity p { margin: 8px 0 12px; }
      .fs-photo-activity .fs-kicker { color: var(--fs-focus); font-size: 11px; font-weight: 750; letter-spacing: .08em; }
      .fs-photo-activity .fs-muted { color: var(--muted); font-size: 12px; }
      .fs-photo-activity .fs-controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
      .fs-photo-activity button { padding: 9px 13px; border: 1px solid var(--border); border-radius: 8px; background: var(--page); color: var(--text); font: inherit; font-size: 13px; cursor: pointer; }
      .fs-photo-activity button[aria-pressed="true"] { border-color: var(--fs-focus); background: var(--fs-focus); color: #fff; }
      .fs-photo-activity button:focus-visible, .fs-photo-activity .fs-block:focus-visible { outline: 3px solid var(--fs-focus); outline-offset: 3px; }
      .fs-photo-activity .fs-reset { margin-left: auto; }
      .fs-photo-activity .fs-map-scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 12px; background: var(--page); }
      .fs-photo-activity svg { display: block; width: 100%; min-width: 680px; height: auto; }
      .fs-photo-activity svg text { fill: var(--text); font: 600 16px var(--font-body, sans-serif); }
      .fs-photo-activity svg .fs-svg-small { font-size: 12px; font-weight: 400; }
      .fs-photo-activity .fs-enclosure { fill: color-mix(in srgb, var(--fs-salmon) 9%, var(--page)); stroke: var(--border); stroke-width: 2; }
      .fs-photo-activity .fs-block { cursor: pointer; }
      .fs-photo-activity .fs-block rect { fill: var(--fs-salmon); stroke: #9e746c; stroke-width: 1.5; }
      .fs-photo-activity .fs-block text { fill: var(--fs-ink); pointer-events: none; }
      .fs-photo-activity .fs-block[aria-pressed="true"] rect { stroke: var(--fs-focus); stroke-width: 3.5; }
      .fs-photo-activity .fs-source { fill: var(--page); stroke: var(--muted); stroke-width: 1.5; }
      .fs-photo-activity .fs-target-active { stroke: var(--fs-focus); stroke-width: 2.5; }
      .fs-photo-activity .fs-line { fill: none; stroke: var(--muted); stroke-width: 1.6; }
      .fs-photo-activity .fs-line-active { stroke: var(--fs-focus); stroke-width: 3; stroke-dasharray: 7 5; animation: fs-photo-flow 1s linear infinite; }
      .fs-photo-activity .fs-part-controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
      .fs-photo-activity .fs-part-controls button { padding: 5px 9px; font-size: 11px; }
      .fs-photo-activity .fs-detail { padding: 16px; border-left: 3px solid var(--fs-focus); border-radius: 0 8px 8px 0; background: color-mix(in srgb, var(--fs-salmon) 9%, var(--page)); }
      .fs-photo-activity .fs-io { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
      .fs-photo-activity .fs-io strong { display: block; color: var(--fs-focus); }
      .fs-photo-activity .fs-lab { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }
      @keyframes fs-photo-flow { to { stroke-dashoffset: -24; } }
      @media (max-width: 700px) {
        .fs-photo-activity .fs-io { grid-template-columns: 1fr; }
        .fs-photo-activity .fs-reset { margin-left: 0; }
      }
      @media (prefers-reduced-motion: reduce) { .fs-photo-activity .fs-line-active { animation: none; } }
    `,
    ),
    h('span', { className: 'fs-kicker' }, 'FEATURE STORE · ARCHITECTURE'),
    h('h3', null, 'Feature Store 안에서는 무슨 일이 일어날까요?'),
    h(
      'p',
      { className: 'fs-muted' },
      '구성 요소를 눌러 역할을 확인하고, 실시간 추론과 모델 학습을 선택해 데이터 경로를 살펴보세요.',
    ),
    h(
      'div',
      { className: 'fs-controls', role: 'group', 'aria-label': '데이터 경로 선택' },
      h(
        'button',
        { type: 'button', 'aria-pressed': mode === 'online', onClick: () => chooseMode('online') },
        '실시간 추론',
      ),
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': mode === 'training',
          onClick: () => chooseMode('training'),
        },
        '모델 학습',
      ),
      h('button', { type: 'button', className: 'fs-reset', onClick: reset }, '초기화'),
    ),
    h(
      'div',
      {
        className: 'fs-map-scroll',
        tabIndex: 0,
        role: 'region',
        'aria-label': 'Feature Store 전체 구조. 좁은 화면에서는 가로로 스크롤하세요.',
      },
      h(
        'svg',
        {
          viewBox: '0 0 940 400',
          role: 'group',
          'aria-label':
            '스트림·배치 입력에서 Feature Store를 거쳐 모델 서빙과 학습으로 이어지는 구조',
        },
        h(
          'defs',
          null,
          ...[
            ['fs-photo-arrow', '#888'],
            ['fs-photo-arrow-active', '#ba4a38'],
          ].map(([id, fill]) =>
            h(
              'marker',
              {
                key: id,
                id,
                viewBox: '0 0 10 10',
                refX: 9,
                refY: 5,
                markerWidth: 7,
                markerHeight: 7,
                orient: 'auto-start-reverse',
              },
              h('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill }),
            ),
          ),
        ),
        h('rect', { className: 'fs-enclosure', x: 190, y: 16, width: 540, height: 368, rx: 7 }),
        h('text', { x: 460, y: 43, textAnchor: 'middle' }, 'Feature Store'),
        ...[135, 255].map((y, index) =>
          h(
            'g',
            { key: y },
            h('rect', {
              className: 'fs-source',
              x: 14,
              y,
              width: 118,
              height: 70,
              rx: index === 0 ? 24 : 8,
            }),
            h('text', { x: 73, y: y + 29, textAnchor: 'middle' }, index === 0 ? 'Stream' : 'Batch'),
            h(
              'text',
              { className: 'fs-svg-small', x: 73, y: y + 49, textAnchor: 'middle' },
              index === 0 ? '클릭 이벤트' : '상품·고객 데이터',
            ),
            line('M 132 ' + (y + 35) + ' H 210', mode === (index === 0 ? 'online' : 'training')),
          ),
        ),
        block(
          'monitoring',
          210,
          60,
          500,
          58,
          'Operational Monitoring',
          '전체 과정의 상태·품질 관찰',
        ),
        block('transform', 210, 118, 166, 190, 'Transform', '배치·스트림 피처 계산'),
        block('storage', 376, 118, 167, 190, 'Storage', 'Online / Offline'),
        block('serving', 543, 118, 167, 190, 'Serving', '피처 조회·전달'),
        h('rect', {
          x: 560,
          y: 245,
          width: 133,
          height: 45,
          rx: 4,
          fill: 'none',
          stroke: '#8b5c52',
          pointerEvents: 'none',
        }),
        h(
          'text',
          {
            className: 'fs-svg-small',
            x: 626,
            y: 263,
            textAnchor: 'middle',
            pointerEvents: 'none',
          },
          'On-demand transform',
        ),
        h(
          'text',
          {
            className: 'fs-svg-small',
            x: 626,
            y: 280,
            textAnchor: 'middle',
            pointerEvents: 'none',
          },
          '요청 시 추가 계산',
        ),
        block('registry', 210, 308, 500, 58, 'Registry', '피처 정의 · 버전 · 엔터티 · 소유자'),
        ...[145, 255].map((y, index) => {
          const active = mode === (index === 0 ? 'online' : 'training');
          return h(
            'g',
            { key: y },
            line('M 730 ' + (y + 30) + ' H 795', active),
            h('rect', {
              className: 'fs-source' + (active ? ' fs-target-active' : ''),
              x: 797,
              y,
              width: 129,
              height: 62,
              rx: 6,
            }),
            h('text', { x: 861, y: y + 25, textAnchor: 'middle' }, 'Model'),
            h(
              'text',
              { x: 861, y: y + 46, textAnchor: 'middle' },
              index === 0 ? 'Serving' : 'Training',
            ),
          );
        }),
      ),
    ),
    h(
      'p',
      { className: 'fs-muted' },
      '실선은 데이터 흐름, 바깥 테두리는 Feature Store의 범위입니다. 상단 Monitoring과 하단 Registry가 중앙 세 기능을 함께 지원합니다.',
    ),
    h(
      'div',
      { className: 'fs-part-controls', role: 'group', 'aria-label': '구성 요소 설명 선택' },
      ...(Object.entries(architectureParts) as [ArchitecturePart, typeof info][]).map(
        ([id, value]) =>
          h(
            'button',
            { key: id, type: 'button', 'aria-pressed': part === id, onClick: () => setPart(id) },
            value.title,
          ),
      ),
    ),
    h(
      'div',
      { className: 'fs-detail', 'aria-live': 'polite' },
      h('h4', null, info.title),
      h('p', null, info.description),
      h(
        'div',
        { className: 'fs-io' },
        h('div', null, h('strong', null, '입력'), info.input),
        h('div', null, h('strong', null, '출력'), info.output),
      ),
    ),
    part === 'storage' &&
      h(
        'div',
        { className: 'fs-lab' },
        h('h4', null, 'Storage · 최신 값과 이력을 나누어 저장'),
        h(
          'div',
          {
            className: 'fs-map-scroll',
            tabIndex: 0,
            role: 'region',
            'aria-label': '피처 데이터가 Online·Offline Storage로 분기되는 구조',
          },
          h(
            'svg',
            {
              viewBox: '0 0 940 290',
              role: 'img',
              'aria-label':
                'Feature data에서 Online KV store는 Model Serving으로, Offline Data lake는 Model Training으로 전달됩니다.',
            },
            h('rect', { className: 'fs-enclosure', x: 280, y: 12, width: 290, height: 266, rx: 8 }),
            h('text', { x: 425, y: 39, textAnchor: 'middle' }, 'Storage'),
            h('text', { x: 105, y: 146, textAnchor: 'middle' }, 'Feature data'),
            line('M 175 145 H 240 V 100 H 330', mode === 'online'),
            line('M 240 145 V 220 H 330', mode === 'training'),
            ...[58, 178].map((y, index) =>
              h(
                'g',
                { key: y },
                h('path', {
                  d:
                    'M 330 ' +
                    (y + 16) +
                    ' V ' +
                    (y + 74) +
                    ' C 330 ' +
                    (y + 97) +
                    ', 520 ' +
                    (y + 97) +
                    ', 520 ' +
                    (y + 74) +
                    ' V ' +
                    (y + 16),
                  fill: '#f3a296',
                  stroke: '#9e746c',
                  strokeWidth: 2,
                }),
                h('ellipse', {
                  cx: 425,
                  cy: y + 16,
                  rx: 95,
                  ry: 16,
                  fill: '#f3a296',
                  stroke: '#9e746c',
                  strokeWidth: 2,
                }),
                h(
                  'text',
                  { x: 425, y: y + 50, textAnchor: 'middle', style: { fill: '#51332e' } },
                  index === 0 ? 'Online Storage' : 'Offline Storage',
                ),
                h(
                  'text',
                  {
                    className: 'fs-svg-small',
                    x: 425,
                    y: y + 70,
                    textAnchor: 'middle',
                    style: { fill: '#51332e' },
                  },
                  index === 0 ? 'KV store · 최신 값' : 'Data lake · 과거 이력',
                ),
                line(
                  'M 520 ' + (y + 45) + ' H 736',
                  mode === (index === 0 ? 'online' : 'training'),
                  true,
                ),
                h('rect', {
                  className: 'fs-source',
                  x: 739,
                  y: y + 18,
                  width: 178,
                  height: 56,
                  rx: 6,
                }),
                h(
                  'text',
                  { x: 828, y: y + 51, textAnchor: 'middle' },
                  index === 0 ? 'Model Serving' : 'Model Training',
                ),
              ),
            ),
          ),
        ),
      ),
  );
}

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-store',
  unit: 5,
  order: 2,
  title: 'Feature Store는 왜 필요할까요?',
  summary:
    '피처를 한 번 정의해 학습과 서비스에서 함께 쓰고, 팀 사이에서 재사용하는 방법을 알아봅니다.',
  scenario:
    '추천 팀과 이탈 예측 팀이 같은 고객 활동 피처를 서로 다른 코드로 다시 만들고 있어 값이 달라지고 개발 시간도 낭비됩니다.',
  concepts: ['피처 재사용', 'Transform', 'Storage·Serving', 'Monitoring', 'Registry'],
  assessment: {
    question: '학습·서빙 불일치를 줄이려면?',
    options: ['피처 정의와 집계 시점을 일관되게 관리한다', '온라인 조회 속도만 높인다'],
    correct: 0,
    explanation:
      '공통 피처 정의와 버전을 등록하고, 학습용 과거 값과 서비스용 최신 값에 같은 의미를 적용해야 합니다. 빠른 조회만으로 계산 방식의 차이는 해결되지 않습니다.',
  },
  caution:
    'Feature Store는 단순한 데이터베이스가 아닙니다. 피처 계산·저장·제공·등록·관찰을 함께 관리하지만, 잘못된 정의나 늦은 갱신까지 자동으로 고쳐 주지는 않습니다.',
  reflection: 'Feature Store가 단순한 데이터베이스와 다른 이유를 설명해 보세요.',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: 'Databricks · What is a Feature Store?',
      url: 'https://www.databricks.com/blog/what-is-a-feature-store',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
  activity: {
    kind: 'features',
    fields: [],
    question: 'Feature Store에서 피처 정의와 버전을 관리하는 구성 요소는?',
    options: [
      {
        value: 'a',
        label: 'Registry',
      },
      {
        value: 'b',
        label: 'Model API',
      },
    ],
    correct: 'a',
    explanation: 'Registry가 피처의 정의, 버전, 자료형, 소유자 같은 메타데이터를 관리합니다.',
    task: 'Feature Store의 구성 요소와 실시간 추론·모델 학습 경로를 살펴보세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Registry·공통 정의',
      detail: '피처의 이름, 계산 방법, 버전과 담당자를 관리합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n1',
      title: 'Offline Store',
      detail: '학습에 필요한 대량의 과거 피처를 보관합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n2',
      title: 'Online Store',
      detail: '서비스 요청에 최신 피처를 빠르게 제공합니다.',
      tone: '#a287bd',
    },
    {
      id: 'n3',
      title: '학습·서빙',
      detail: '목적은 달라도 같은 의미의 피처를 모델에 전달합니다.',
      tone: '#a287bd',
    },
  ],
  fields: [
    {
      id: 'definition',
      label: '온라인 피처 집계',
      initial: 'day',
      options: [
        {
          value: 'day',
          label: '최근 24시간',
        },
        {
          value: 'hour',
          label: '최근 1시간 · 학습 정의와 일치',
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
      label: '공통 피처 정의 → 오프라인 스토어',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n0-n2',
      kind: 'edge',
      from: 'n0',
      to: 'n2',
      label: '공통 피처 정의 → 온라인 스토어',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n3',
      kind: 'edge',
      from: 'n1',
      to: 'n3',
      label: '오프라인 스토어 → 학습·서빙',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n2-n3',
      kind: 'edge',
      from: 'n2',
      to: 'n3',
      label: '온라인 스토어 → 학습·서빙',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n0', 'n2'],
    ['n1', 'n3'],
    ['n2', 'n3'],
  ],
});
