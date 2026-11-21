import { useId, useState } from 'react';
import styles from './FeatureStoreActivity.module.css';

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

type Part = keyof typeof architectureParts;
type Mode = 'online' | 'training';

const parts = [
  {
    id: 'monitoring',
    x: 210,
    y: 60,
    width: 500,
    height: 58,
    subtitle: '전체 과정의 상태·품질 관찰',
  },
  { id: 'transform', x: 210, y: 118, width: 166, height: 190, subtitle: '배치·스트림 피처 계산' },
  { id: 'storage', x: 376, y: 118, width: 167, height: 190, subtitle: 'Online / Offline' },
  { id: 'serving', x: 543, y: 118, width: 167, height: 190, subtitle: '피처 조회·전달' },
  {
    id: 'registry',
    x: 210,
    y: 308,
    width: 500,
    height: 58,
    subtitle: '피처 정의 · 버전 · 엔터티 · 소유자',
  },
] as const satisfies ReadonlyArray<{
  id: Part;
  x: number;
  y: number;
  width: number;
  height: number;
  subtitle: string;
}>;

const routes = {
  online: {
    source: 'Stream',
    data: '클릭 이벤트',
    request: '실시간 추론',
    target: 'Model Serving',
    storage: 'Online Storage',
    storageValue: 'KV store · 최신 값',
    explanation: '실시간 추론은 Online Storage의 최신 값을 읽습니다.',
    y: 145,
  },
  training: {
    source: 'Batch',
    data: '상품·고객 데이터',
    request: '모델 학습',
    target: 'Model Training',
    storage: 'Offline Storage',
    storageValue: 'Data lake · 과거 이력',
    explanation: '모델 학습은 Offline Storage에서 기준 시각의 과거 값을 읽습니다.',
    y: 255,
  },
} as const;

function arrowClass(active: boolean) {
  return active ? styles.activeArrow : styles.arrow;
}

function FeatureMap({
  mode,
  part,
  onPartChange,
}: {
  mode: Mode;
  part: Part;
  onPartChange: (part: Part) => void;
}) {
  const arrow = useId();
  const activeArrow = useId();

  return (
    <div className={styles.map} tabIndex={0} role="region" aria-label="Feature Store 전체 구조">
      <svg
        viewBox="0 0 940 400"
        role="group"
        aria-label="데이터 입력에서 Feature Store를 거쳐 추론과 학습으로 이어지는 구조"
      >
        <defs>
          <marker
            id={arrow}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className={styles.marker} d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker
            id={activeArrow}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className={styles.activeMarker} d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <rect className={styles.enclosure} x="190" y="16" width="540" height="368" rx="7" />
        <text x="460" y="43" textAnchor="middle">
          Feature Store
        </text>
        {Object.values(routes).map((route) => {
          const active = route === routes[mode];
          const marker = `url(#${active ? activeArrow : arrow})`;
          return (
            <g key={route.source}>
              <rect
                className={styles.node}
                x="14"
                y={route.y - 10}
                width="118"
                height="70"
                rx="8"
              />
              <text x="73" y={route.y + 19} textAnchor="middle">
                {route.source}
              </text>
              <text className={styles.subtitle} x="73" y={route.y + 39} textAnchor="middle">
                {route.data}
              </text>
              <path
                className={arrowClass(active)}
                d={`M 132 ${route.y + 25} H 210`}
                markerEnd={marker}
              />
              <path
                className={arrowClass(active)}
                d={`M 710 ${route.y + 30} H 795`}
                markerEnd={marker}
              />
              <rect
                className={styles.node}
                data-active={active || undefined}
                x="797"
                y={route.y}
                width="129"
                height="62"
                rx="6"
              />
              <text x="861" y={route.y + 36} textAnchor="middle">
                {route.target}
              </text>
            </g>
          );
        })}
        {parts.map(({ id, x, y, width, height, subtitle }) => (
          <g
            key={id}
            className={styles.part}
            role="button"
            tabIndex={0}
            aria-label={architectureParts[id].title}
            aria-pressed={part === id}
            onClick={() => onPartChange(id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPartChange(id);
              }
            }}
          >
            <rect x={x} y={y} width={width} height={height} rx="5" />
            <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle">
              {architectureParts[id].title}
            </text>
            <text
              className={styles.subtitle}
              x={x + width / 2}
              y={y + height / 2 + 17}
              textAnchor="middle"
            >
              {subtitle}
            </text>
          </g>
        ))}
        <g className={styles.onDemand}>
          <rect className={styles.node} x="560" y="245" width="133" height="45" rx="4" />
          <text className={styles.subtitle} x="626" y="263" textAnchor="middle">
            On-demand transform
          </text>
          <text className={styles.subtitle} x="626" y="280" textAnchor="middle">
            요청 시 추가 계산
          </text>
        </g>
      </svg>
    </div>
  );
}

export function FeatureStoreActivity() {
  const [part, setPart] = useState<Part>('serving');
  const [mode, setMode] = useState<Mode>('online');
  const info = architectureParts[part];

  function reset() {
    setPart('serving');
    setMode('online');
  }

  return (
    <div className={styles.activity} data-testid="feature-store-activity">
      <div className={styles.controls} role="group" aria-label="데이터 경로 선택">
        <button type="button" aria-pressed={mode === 'online'} onClick={() => setMode('online')}>
          {routes.online.request}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'training'}
          onClick={() => setMode('training')}
        >
          {routes.training.request}
        </button>
        <button type="button" className={styles.reset} onClick={reset}>
          초기화
        </button>
      </div>
      <p className={styles.mapHint}>구조도는 좌우로 스크롤할 수 있습니다.</p>
      <FeatureMap mode={mode} part={part} onPartChange={setPart} />
      <p role="status" className={styles.routeResult}>
        {routes[mode].explanation}
      </p>
      <p className={styles.guide}>
        상단 Monitoring과 하단 Registry가 중앙의 Transform, Storage, Serving을 함께 지원합니다.
      </p>
      <div className={styles.controls} role="group" aria-label="구성 요소 설명 선택">
        {parts.map(({ id }) => (
          <button key={id} type="button" aria-pressed={part === id} onClick={() => setPart(id)}>
            {architectureParts[id].title}
          </button>
        ))}
      </div>
      <div className={styles.detail} aria-live="polite">
        <h4>{info.title}</h4>
        <p>{info.description}</p>
        <dl>
          <div>
            <dt>입력</dt>
            <dd>{info.input}</dd>
          </div>
          <div>
            <dt>출력</dt>
            <dd>{info.output}</dd>
          </div>
        </dl>
      </div>
      {part === 'storage' && (
        <div className={styles.storage}>
          <h4>Storage에서 최신 값과 이력을 나누어 저장</h4>
          <ul aria-label="피처 저장 경로">
            {Object.values(routes).map((route) => (
              <li key={route.storage} data-active={route === routes[mode] || undefined}>
                <strong>{route.storage}</strong>
                <span>{route.storageValue}</span>
                <span>전달 대상 · {route.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
