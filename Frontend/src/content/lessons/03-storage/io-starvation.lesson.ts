import { createElement as h, useState } from 'react';
import { defineMdxLesson } from '../../defineLesson';

const ioMethods = [
  {
    id: 'parallel',
    title: '병렬 데이터 로더',
    short: '여러 배치를 동시에 준비',
    focus: '작업자 수',
    action: '여러 worker가 A·B·C를 동시에 읽고 전처리',
    result: '배치 준비 처리량 증가',
    color: '#7c5ce5',
  },
  {
    id: 'prefetch',
    title: 'Prefetch',
    short: '계산과 다음 준비를 겹침',
    focus: '시간 겹치기',
    action: 'GPU가 A를 계산할 때 로더가 B를 미리 준비',
    result: 'GPU 대기 시간 감소',
    color: '#1b8f74',
  },
  {
    id: 'cache',
    title: 'Cache',
    short: '가까운 데이터 재사용',
    focus: '읽는 위치',
    action: '첫 읽기 뒤 원격 저장소 대신 로컬 복사본 사용',
    result: '반복 읽기 지연 감소',
    color: '#d37816',
  },
  {
    id: 'sharding',
    title: 'Sharding',
    short: '작은 파일을 묶어 요청',
    focus: '요청 단위',
    action: 'A·B·C·D 파일을 하나의 큰 shard로 구성',
    result: '요청·메타데이터 작업 감소',
    color: '#3274c8',
  },
] as const;

function IoFlowComparison() {
  const [selected, setSelected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const method = ioMethods[selected];

  const parallelScene = h(
    'span',
    {
      className: 'io-scene parallel-scene',
      'aria-label': '세 개의 데이터 로더가 동시에 배치를 읽는 흐름',
    },
    h(
      'span',
      { className: 'scene-caption' },
      '한 줄씩 기다리지 않고 worker 3개가 동시에 출발합니다.',
    ),
    h(
      'span',
      { className: 'parallel-grid' },
      h(
        'span',
        { className: 'source-stack' },
        h('strong', null, '저장소'),
        h('small', null, 'A · B · C 배치'),
      ),
      h(
        'span',
        { className: 'worker-stack' },
        ...['A', 'B', 'C'].map((batch, index) =>
          h(
            'span',
            { className: 'worker-row', key: batch },
            h('span', { className: `moving-batch batch-${index + 1}`, 'aria-hidden': true }, batch),
            h('span', { className: 'worker-box' }, `worker ${index + 1}`),
          ),
        ),
      ),
      h(
        'span',
        { className: 'ready-stack' },
        h('strong', null, '준비 완료'),
        h('small', null, 'A · B · C'),
      ),
    ),
    h(
      'span',
      { className: 'scene-result' },
      h('strong', null, '동시에 3개 준비'),
      '읽기·전처리 작업 자체를 여러 worker로 나눕니다.',
    ),
  );

  const prefetchScene = h(
    'span',
    {
      className: 'io-scene prefetch-scene',
      'aria-label': 'GPU 계산과 다음 배치 준비가 겹치는 흐름',
    },
    h(
      'span',
      { className: 'scene-caption' },
      '같은 세로 칸에서 위쪽 준비와 아래쪽 계산이 동시에 진행됩니다.',
    ),
    h(
      'span',
      { className: 'timeline' },
      h('span', { className: 'lane-label' }, '로더'),
      h('span', { className: 'time-cell load-cell phase-1' }, 'A 준비'),
      h('span', { className: 'time-cell load-cell phase-2' }, 'B 준비'),
      h('span', { className: 'time-cell load-cell phase-3' }, 'C 준비'),
      h('span', { className: 'time-cell load-cell phase-4' }, 'D 준비'),
      h('span', { className: 'lane-label' }, 'GPU'),
      h('span', { className: 'time-cell idle-cell' }, '첫 대기'),
      h('span', { className: 'time-cell gpu-cell phase-2' }, 'A 계산'),
      h('span', { className: 'time-cell gpu-cell phase-3' }, 'B 계산'),
      h('span', { className: 'time-cell gpu-cell phase-4' }, 'C 계산'),
      h('span', { className: 'lane-label axis-label' }, '시간'),
      ...['①', '②', '③', '④'].map((value) =>
        h('small', { className: 'axis-tick', key: value }, value),
      ),
    ),
    h(
      'span',
      { className: 'overlap-note' },
      h('span', { className: 'overlap-bracket', 'aria-hidden': true }),
      h('strong', null, 'B 준비 ↕ A 계산'),
      '서로 다른 작업을 같은 시간에 겹칩니다.',
    ),
  );

  const cacheScene = h(
    'span',
    {
      className: 'io-scene cache-scene',
      'aria-label': '원격에서 읽은 반복 데이터를 가까운 캐시에 저장하고 재사용하는 흐름',
    },
    h(
      'span',
      { className: 'scene-caption' },
      '처음 한 번만 원격에서 읽고, 반복해서 쓰는 데이터는 가까운 Cache에 저장합니다.',
    ),
    h(
      'span',
      { className: 'cache-flow' },
      h(
        'span',
        { className: 'cache-node remote-node' },
        h('strong', null, '원격 저장소'),
        h('small', null, '첫 읽기'),
      ),
      h(
        'span',
        { className: 'cache-track fill-track' },
        h('small', null, '① 처음 가져오기'),
        h('span', { className: 'cache-dot fill-dot', 'aria-hidden': true }, 'A'),
      ),
      h(
        'span',
        { className: 'cache-node local-node' },
        h('strong', null, '가까운 Cache'),
        h('small', null, '반복 데이터 저장'),
        h(
          'span',
          { className: 'cached-copies', 'aria-hidden': true },
          h('i', null, 'A'),
          h('i', null, 'A'),
          h('i', null, 'A'),
        ),
      ),
      h(
        'span',
        { className: 'cache-track reuse-track' },
        h('small', null, '② 가까이서 반복 사용'),
        h('span', { className: 'cache-dot reuse-dot reuse-1', 'aria-hidden': true }, 'A'),
        h('span', { className: 'cache-dot reuse-dot reuse-2', 'aria-hidden': true }, 'A'),
        h('span', { className: 'cache-dot reuse-dot reuse-3', 'aria-hidden': true }, 'A'),
      ),
      h(
        'span',
        { className: 'cache-node gpu-target' },
        h('strong', null, 'GPU'),
        h('small', null, '반복 계산'),
      ),
    ),
    h(
      'span',
      { className: 'scene-result' },
      h('strong', null, '원격 읽기 1회'),
      '같은 데이터를 다시 쓸 때는 가까운 Cache에서 바로 가져옵니다.',
    ),
  );

  const smallFiles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const shardingScene = h(
    'span',
    {
      className: 'io-scene sharding-scene',
      'aria-label': '작은 파일의 많은 요청과 큰 shard의 적은 요청 비교',
    },
    h(
      'span',
      { className: 'scene-caption' },
      '같은 양의 데이터를 가져와도 파일 묶음 크기에 따라 요청 횟수가 달라집니다.',
    ),
    h(
      'span',
      { className: 'shard-compare' },
      h(
        'span',
        { className: 'request-case many-case' },
        h('strong', null, '작은 파일 8개'),
        h(
          'span',
          { className: 'file-row' },
          ...smallFiles.map((fileName, index) =>
            h(
              'span',
              { className: `tiny-file file-${index + 1}`, key: fileName },
              fileName,
              h('i', { className: 'request-pulse', 'aria-hidden': true }),
            ),
          ),
        ),
        h('span', { className: 'request-count' }, '요청 × 8'),
        h('small', null, '파일마다 열고 읽기'),
      ),
      h('span', { className: 'versus' }, 'VS'),
      h(
        'span',
        { className: 'request-case one-case' },
        h('strong', null, '큰 Shard 1개'),
        h(
          'span',
          { className: 'large-shard' },
          h('span', null, 'A'),
          h('span', null, 'B'),
          h('span', null, 'C'),
          h('span', null, 'D'),
          h('span', null, 'E'),
          h('span', null, 'F'),
          h('span', null, 'G'),
          h('span', null, 'H'),
          h('i', { className: 'request-pulse', 'aria-hidden': true }),
        ),
        h('span', { className: 'request-count' }, '요청 × 1'),
        h('small', null, '한 번 열어 연속 읽기'),
      ),
    ),
    h(
      'span',
      { className: 'scene-result' },
      h('strong', null, '8회 → 1회'),
      'Sharding은 데이터의 양보다 파일을 요청하는 횟수를 줄입니다.',
    ),
  );

  const scenes = [parallelScene, prefetchScene, cacheScene, shardingScene];

  return h(
    'span',
    {
      className: `io-flow ${isPlaying ? 'is-playing' : ''}`,
      style: { '--io-color': method.color } as React.CSSProperties,
    },
    h(
      'style',
      null,
      `
      section[data-testid="inline-activity"]:has(.io-flow) > :not(header),
      section[data-testid="inline-activity"]:has(.io-flow) > header > :not(h3) { display: none; }
      .io-flow { display: block; font-weight: 400; }
      .io-flow * { box-sizing: border-box; }
      .io-flow .io-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .io-flow .io-heading strong { font-size: 18px; }
      .io-flow button { color: inherit; font: inherit; cursor: pointer; }
      .io-flow button:focus-visible { outline: 2px solid var(--io-color); outline-offset: 3px; }
      .io-flow .io-play { flex: none; padding: 7px 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--page); }
      .io-flow .io-intro { display: block; margin: 7px 0 16px; color: var(--muted); font-size: 14px; }
      .io-flow .io-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
      .io-flow .io-tab { min-width: 0; padding: 10px 8px; border: 1px solid var(--border); border-radius: 10px; background: var(--page); text-align: left; }
      .io-flow .io-tab strong, .io-flow .io-tab small { display: block; }
      .io-flow .io-tab strong { margin-bottom: 3px; font-size: 13px; }
      .io-flow .io-tab small { color: var(--muted); font-size: 11px; line-height: 1.35; }
      .io-flow .io-tab[aria-selected="true"] { border-color: var(--io-color); background: color-mix(in srgb, var(--io-color) 10%, var(--page)); box-shadow: inset 0 -3px var(--io-color); }
      .io-flow .io-stage { display: block; margin-top: 12px; padding: 16px; border: 1px solid color-mix(in srgb, var(--io-color) 45%, var(--border)); border-radius: 14px; background: color-mix(in srgb, var(--io-color) 4%, var(--page)); overflow: hidden; }
      .io-flow .io-stage-title { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
      .io-flow .io-stage-title strong { color: var(--io-color); font-size: 17px; }
      .io-flow .io-stage-title small { color: var(--muted); }
      .io-flow .io-scene { display: block; }
      .io-flow .scene-caption { display: block; margin-bottom: 16px; font-size: 13px; }
      .io-flow .scene-result { display: flex; gap: 8px; align-items: center; margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--io-color) 10%, var(--page)); font-size: 13px; }
      .io-flow .scene-result strong { flex: none; color: var(--io-color); }

      .io-flow .parallel-grid { display: grid; grid-template-columns: 105px 1fr 105px; gap: 24px; align-items: center; min-height: 170px; }
      .io-flow .source-stack, .io-flow .ready-stack { display: flex; min-height: 82px; padding: 10px; border: 2px solid var(--border); border-radius: 12px; background: var(--page); align-items: center; justify-content: center; flex-direction: column; text-align: center; }
      .io-flow .source-stack small, .io-flow .ready-stack small { margin-top: 4px; color: var(--muted); font-size: 10px; }
      .io-flow .ready-stack { border-color: var(--io-color); }
      .io-flow .worker-stack { display: grid; gap: 9px; }
      .io-flow .worker-row { position: relative; display: flex; align-items: center; justify-content: center; height: 42px; border-radius: 9px; background: color-mix(in srgb, var(--io-color) 7%, var(--panel)); }
      .io-flow .worker-row::before, .io-flow .worker-row::after { content: ''; position: absolute; top: 50%; width: 26%; height: 2px; background: color-mix(in srgb, var(--io-color) 45%, var(--border)); }
      .io-flow .worker-row::before { left: -24px; }
      .io-flow .worker-row::after { right: -24px; }
      .io-flow .worker-box { position: relative; z-index: 2; padding: 5px 10px; border: 1px solid var(--io-color); border-radius: 7px; background: var(--page); color: var(--io-color); font-size: 11px; font-weight: 700; }
      .io-flow .moving-batch { position: absolute; z-index: 3; left: -16px; display: grid; width: 25px; height: 25px; border-radius: 50%; background: var(--io-color); color: #fff; place-items: center; font-size: 10px; font-weight: 800; opacity: 0; }
      .io-flow.is-playing .moving-batch { animation: parallel-read 2.5s ease-in-out infinite; }
      @keyframes parallel-read { 0% { left: -16px; opacity: 0; } 10%, 88% { opacity: 1; } 48% { left: calc(50% - 12px); } 100% { left: calc(100% - 8px); opacity: 0; } }

      .io-flow .timeline { display: grid; grid-template-columns: 44px repeat(4, minmax(0, 1fr)); gap: 4px; width: 100%; }
      .io-flow .lane-label { display: flex; align-items: center; font-size: 12px; font-weight: 800; }
      .io-flow .time-cell { position: relative; display: grid; height: 48px; border-radius: 8px; overflow: hidden; place-items: center; font-size: 11px; font-weight: 700; }
      .io-flow .load-cell { background: #f7cf6b; color: #5b3b00; }
      .io-flow .gpu-cell { background: var(--io-color); color: #fff; }
      .io-flow .idle-cell { border: 1px dashed var(--border); color: var(--muted); }
      .io-flow .time-cell::after { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,.34); transform: translateX(-105%); }
      .io-flow.is-playing .time-cell.phase-1::after { animation: cell-run 3.2s linear infinite; }
      .io-flow.is-playing .time-cell.phase-2::after { animation: cell-run 3.2s .8s linear infinite; }
      .io-flow.is-playing .time-cell.phase-3::after { animation: cell-run 3.2s 1.6s linear infinite; }
      .io-flow.is-playing .time-cell.phase-4::after { animation: cell-run 3.2s 2.4s linear infinite; }
      .io-flow .axis-label { color: var(--muted); }
      .io-flow .axis-tick { text-align: center; color: var(--muted); }
      .io-flow .overlap-note { display: flex; gap: 8px; align-items: center; margin-top: 12px; font-size: 12px; }
      .io-flow .overlap-note strong { color: var(--io-color); }
      .io-flow .overlap-bracket { width: 20px; height: 26px; border-top: 2px solid var(--io-color); border-bottom: 2px solid var(--io-color); border-left: 2px solid var(--io-color); }
      @keyframes cell-run { 0%, 8% { transform: translateX(-105%); } 80%, 100% { transform: translateX(105%); } }

      .io-flow .cache-flow { display: grid; grid-template-columns: 96px minmax(38px, 1fr) 108px minmax(38px, 1fr) 74px; gap: 6px; width: 100%; align-items: center; min-height: 145px; }
      .io-flow .cache-node { display: flex; min-height: 88px; padding: 8px; border: 2px solid var(--border); border-radius: 12px; background: var(--page); align-items: center; justify-content: center; flex-direction: column; text-align: center; }
      .io-flow .cache-node small { margin-top: 4px; color: var(--muted); font-size: 10px; }
      .io-flow .local-node { border-color: var(--io-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--io-color) 10%, transparent); }
      .io-flow .gpu-target { border-color: color-mix(in srgb, var(--io-color) 60%, var(--border)); }
      .io-flow .cache-track { position: relative; display: block; height: 4px; border-radius: 999px; background: color-mix(in srgb, var(--io-color) 38%, var(--border)); }
      .io-flow .cache-track::after { content: '→'; position: absolute; right: -5px; top: -13px; color: var(--io-color); font-size: 18px; }
      .io-flow .cache-track small { position: absolute; left: 50%; bottom: 10px; width: 105px; transform: translateX(-50%); color: var(--muted); text-align: center; font-size: 9px; }
      .io-flow .cache-dot { position: absolute; z-index: 2; top: -11px; left: -7px; display: grid; width: 26px; height: 26px; border: 3px solid var(--page); border-radius: 50%; background: var(--io-color); color: #fff; place-items: center; font-size: 9px; font-weight: 800; opacity: 0; }
      .io-flow.is-playing .fill-dot { animation: cache-fill 4.8s ease-in-out infinite; }
      .io-flow.is-playing .reuse-dot { animation: cache-reuse 4.8s ease-in-out infinite; }
      .io-flow.is-playing .reuse-2 { animation-delay: .55s; }
      .io-flow.is-playing .reuse-3 { animation-delay: 1.1s; }
      .io-flow .cached-copies { display: flex; gap: 3px; margin-top: 8px; }
      .io-flow .cached-copies i { display: grid; width: 20px; height: 20px; border-radius: 5px; background: color-mix(in srgb, var(--io-color) 16%, var(--panel)); color: var(--io-color); place-items: center; font-size: 9px; font-style: normal; font-weight: 800; }
      .io-flow.is-playing .cached-copies { animation: cache-store 4.8s ease-in-out infinite; }
      @keyframes cache-fill { 0%, 5% { left: -7px; opacity: 0; } 10%, 30% { opacity: 1; } 36% { left: calc(100% - 18px); opacity: 0; } 100% { opacity: 0; } }
      @keyframes cache-reuse { 0%, 43% { left: -7px; opacity: 0; } 48%, 80% { opacity: 1; } 88%, 100% { left: calc(100% - 18px); opacity: 0; } }
      @keyframes cache-store { 0%, 28% { opacity: .15; transform: scale(.9); } 40%, 92% { opacity: 1; transform: scale(1); } 100% { opacity: .15; } }

      .io-flow .shard-compare { display: grid; grid-template-columns: 1fr 36px 1fr; gap: 12px; align-items: center; }
      .io-flow .request-case { display: flex; min-height: 180px; padding: 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--page); align-items: center; flex-direction: column; }
      .io-flow .file-row { display: grid; grid-template-columns: repeat(4, 30px); gap: 7px; margin: 16px 0; }
      .io-flow .tiny-file { position: relative; display: grid; width: 30px; height: 34px; border: 1px solid var(--border); border-radius: 5px; background: var(--panel); place-items: center; font-size: 10px; }
      .io-flow .large-shard { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); width: 150px; height: 76px; margin: 16px 0; border: 2px solid var(--io-color); border-radius: 9px; overflow: hidden; }
      .io-flow .large-shard span { display: grid; border: 1px solid color-mix(in srgb, var(--io-color) 25%, var(--border)); place-items: center; font-size: 9px; }
      .io-flow .request-pulse { position: absolute; inset: -4px; border: 2px solid var(--io-color); border-radius: inherit; opacity: 0; }
      .io-flow.is-playing .tiny-file .request-pulse { animation: request-many 3.2s infinite; }
      .io-flow.is-playing .file-2 .request-pulse { animation-delay: .4s; }
      .io-flow.is-playing .file-3 .request-pulse { animation-delay: .8s; }
      .io-flow.is-playing .file-4 .request-pulse { animation-delay: 1.2s; }
      .io-flow.is-playing .file-5 .request-pulse { animation-delay: 1.6s; }
      .io-flow.is-playing .file-6 .request-pulse { animation-delay: 2s; }
      .io-flow.is-playing .file-7 .request-pulse { animation-delay: 2.4s; }
      .io-flow.is-playing .file-8 .request-pulse { animation-delay: 2.8s; }
      .io-flow.is-playing .large-shard .request-pulse { animation: request-one 3.2s infinite; }
      .io-flow .request-count { padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--io-color) 12%, var(--panel)); color: var(--io-color); font-size: 12px; font-weight: 800; }
      .io-flow .request-case small { margin-top: 7px; color: var(--muted); font-size: 10px; }
      .io-flow .versus { color: var(--muted); text-align: center; font-size: 11px; font-weight: 800; }
      @keyframes request-many { 0%, 75% { transform: scale(.85); opacity: 0; } 82% { opacity: 1; } 100% { transform: scale(1.25); opacity: 0; } }
      @keyframes request-one { 0%, 15% { transform: scale(.94); opacity: 0; } 30% { opacity: 1; } 60%, 100% { transform: scale(1.08); opacity: 0; } }

      @media (max-width: 660px) {
        .io-flow .io-tabs { grid-template-columns: repeat(2, 1fr); }
        .io-flow .io-stage-title { align-items: flex-start; flex-direction: column; }
        .io-flow .parallel-grid { grid-template-columns: 82px 1fr 82px; gap: 15px; min-width: 430px; }
        .io-flow .scene-scroll { display: block; overflow-x: auto; padding-bottom: 5px; }
        .io-flow .timeline { grid-template-columns: 38px repeat(4, minmax(0, 1fr)); }
        .io-flow .time-cell { font-size: 10px; }
        .io-flow .cache-flow { grid-template-columns: 60px minmax(20px, 1fr) 74px minmax(20px, 1fr) 48px; gap: 4px; }
        .io-flow .cache-node { min-height: 74px; padding: 4px; font-size: 10px; }
        .io-flow .cache-node small { font-size: 8px; }
        .io-flow .cached-copies { gap: 2px; }
        .io-flow .cached-copies i { width: 16px; height: 16px; font-size: 8px; }
        .io-flow .cache-track small { display: none; }
        .io-flow .shard-compare { grid-template-columns: 190px 30px 190px; min-width: 440px; }
        .io-flow .scene-result { align-items: flex-start; flex-direction: column; }
      }
      @media (prefers-reduced-motion: reduce) {
        .io-flow.is-playing .moving-batch, .io-flow.is-playing .time-cell::after,
        .io-flow.is-playing .cache-dot, .io-flow.is-playing .cached-copies,
        .io-flow.is-playing .request-pulse { animation: none; }
      }
    `,
    ),
    h(
      'span',
      { className: 'io-heading' },
      h('strong', null, 'I/O 병목을 줄이는 네 가지 흐름'),
      h(
        'button',
        {
          className: 'io-play',
          type: 'button',
          'aria-pressed': isPlaying,
          onClick: () => setIsPlaying((current) => !current),
        },
        isPlaying ? '⏸ 일시정지' : '▶ 재생',
      ),
    ),
    h(
      'span',
      { className: 'io-intro' },
      '방법을 선택하면 각 방식이 실제로 바꾸는 데이터 흐름을 애니메이션으로 비교할 수 있습니다.',
    ),
    h(
      'span',
      { className: 'io-tabs', role: 'tablist', 'aria-label': 'I/O 개선 방법' },
      ...ioMethods.map((item, index) =>
        h(
          'button',
          {
            className: 'io-tab',
            type: 'button',
            role: 'tab',
            'aria-selected': selected === index,
            key: item.id,
            onClick: () => setSelected(index),
          },
          h('strong', null, item.title),
          h('small', null, item.short),
        ),
      ),
    ),
    h(
      'span',
      { className: 'io-stage', key: method.id },
      h(
        'span',
        { className: 'io-stage-title' },
        h('strong', null, method.title),
        h('small', null, method.action),
      ),
      h('span', { className: 'scene-scroll' }, scenes[selected]),
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
    task: h(IoFlowComparison) as unknown as string,
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
