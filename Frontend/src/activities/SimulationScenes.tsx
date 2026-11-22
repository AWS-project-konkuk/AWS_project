import { searchExample } from './simulation';
import type { ActivitySceneProps } from './types';
import styles from './SimulationScenes.module.css';

const plotX = (x: number) => 36 + x * 2.24;
const plotY = (y: number) => 248 - y * 2.24;

export function SearchScene({ spec, answers }: ActivitySceneProps) {
  const { query, phrase, exact, documents, matches } = searchExample(spec, answers);

  if (exact) {
    return (
      <figure className={styles.scene}>
        <figcaption>
          <strong>문서에서 “{phrase}” 찾기</strong>
          <span>검색 문구가 그대로 들어 있는 문서 {matches.length}건</span>
        </figcaption>
        <ul className={styles.documentList} role="list" aria-label="원문 예시">
          {documents.map(({ label, excerpt }) => (
            <li key={label}>
              <strong>{label}</strong>
              <span>{excerpt}</span>
            </li>
          ))}
        </ul>
      </figure>
    );
  }

  return (
    <figure className={styles.scene}>
      <figcaption>
        <strong>“{phrase}”의 위치와 가까운 문서</strong>
        <span>질문과 문서를 같은 예시 좌표계에 놓고 직선 거리를 비교합니다.</span>
      </figcaption>
      <div className={styles.searchLayout}>
        <svg
          viewBox="0 0 320 278"
          className={styles.searchPlot}
          role="img"
          aria-label={`질문과 문서의 예시 좌표 비교. ${documents
            .map(({ label, x, y }) => `${label} (${x}, ${y})`)
            .join(', ')}`}
        >
          {[0, 25, 50, 75, 100].map((tick) => (
            <path
              key={tick}
              d={`M ${plotX(tick)} ${plotY(0)} V ${plotY(100)} M ${plotX(0)} ${plotY(tick)} H ${plotX(100)}`}
              className={styles.gridLine}
            />
          ))}
          <path d="M 36 24 V 248 H 260" className={styles.axis} />
          <text x="36" y="16">
            좌표 2
          </text>
          <text x="224" y="268">
            좌표 1
          </text>
          {documents
            .filter(({ label }) => matches.includes(label))
            .map((document) => (
              <line
                key={document.label}
                x1={plotX(query.x)}
                y1={plotY(query.y)}
                x2={plotX(document.x)}
                y2={plotY(document.y)}
                className={styles.distanceLine}
              />
            ))}
          {documents.map((document) => (
            <g key={document.label} data-near={matches.includes(document.label)}>
              <circle cx={plotX(document.x)} cy={plotY(document.y)} r="5" />
              <text x={plotX(document.x) + 10} y={plotY(document.y) + 5}>
                {document.label}
              </text>
            </g>
          ))}
          <rect
            x="-4.5"
            y="-4.5"
            width="9"
            height="9"
            transform={`translate(${plotX(query.x)} ${plotY(query.y)}) rotate(45)`}
            className={styles.queryPoint}
          />
        </svg>
        <div className={styles.ranking}>
          <p>
            <span aria-hidden="true">◆ </span>질문 ({query.x}, {query.y})
          </p>
          <h4>가까운 문서 {matches.length}개</h4>
          <ol>
            {matches.map((label) => {
              const document = documents.find((entry) => entry.label === label);
              if (!document) return null;
              return (
                <li key={label}>
                  <div>
                    <strong>{label}</strong>
                    <span>거리 {document.distance.toFixed(1)}</span>
                  </div>
                  <span>
                    좌표 ({document.x}, {document.y})
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </figure>
  );
}

const parallelLayouts = {
  data: {
    title: '데이터 조각을 같은 모델 복제본에 배치',
    input: '데이터 조각',
    model: '전체 모델 복제본',
    communication: 'GPU마다 구한 기울기를 동기화하고 모든 복제본을 같은 값으로 갱신합니다.',
  },
  model: {
    title: '모델의 연속된 레이어를 GPU에 순서대로 배치',
    input: '레이어 그룹',
    model: '모델 일부',
    communication: '앞 GPU가 계산한 중간 활성값을 다음 GPU로 전달합니다.',
  },
  tensor: {
    title: '같은 레이어의 행렬 연산을 GPU에 분할',
    input: '행렬 조각',
    model: '레이어 내부 일부',
    communication: 'GPU가 부분 결과를 통신하고 한 레이어의 출력을 합칩니다.',
  },
} as const;

export function ParallelScene({ spec, answers, result }: ActivitySceneProps) {
  const variant = spec.variant === 'data' || spec.variant === 'tensor' ? spec.variant : 'model';
  const layout = parallelLayouts[variant];
  const gpuCount = Number(answers.gpus);
  const vram = Number(answers.vram);
  const [memory, compute, transfer, total] = result.metrics;
  if (!memory || !compute || !transfer || !total) return null;
  const overBudget = (memory.amount ?? 0) > vram;

  return (
    <div className={styles.parallelScene}>
      <figure className={styles.scene}>
        <figcaption>
          <strong>{layout.title}</strong>
          <span>
            GPU {gpuCount}개 · 장치당 {memory.value} 필요 / {vram} GiB 한도
          </span>
        </figcaption>
        <ol
          className={styles.gpuLayout}
          data-variant={variant}
          role="list"
          aria-label="GPU별 모델 배치"
        >
          {Array.from({ length: gpuCount }, (_, i) => (
            <li key={i} data-over={overBudget}>
              <span>GPU {i + 1}</span>
              <strong>
                {layout.input} {i + 1}
              </strong>
              <span className={styles.modelBlock}>{layout.model}</span>
            </li>
          ))}
        </ol>
        <p className={styles.communication}>
          <strong>{overBudget ? '장치당 용량 초과' : '모델 상태가 장치당 용량 이내'}</strong>
          <span>
            {gpuCount === 1 ? 'GPU가 하나여서 장치 간 전송이 없습니다.' : layout.communication}
          </span>
        </p>
      </figure>
      <figure className={styles.scene}>
        <figcaption>
          <strong>상대 시간 구성</strong>
          <span>
            연산 {compute.value} · 통신 {transfer.value} · 전체 {total.value}
          </span>
        </figcaption>
        <div className={styles.timeBar} aria-hidden="true">
          <span style={{ flexGrow: compute.amount }} />
          <span style={{ flexGrow: transfer.amount }} />
        </div>
        <p className={styles.chartNote}>
          <span className={styles.computeKey} />
          연산 <span className={styles.transferKey} />
          통신
        </p>
      </figure>
    </div>
  );
}

const trafficOutcomes = [
  { key: 'old', label: '기존 모델 응답' },
  { key: 'new', label: '신규 모델 응답' },
  { key: 'failed', label: '실패' },
] as const;

export function ReleaseScene({ spec, result }: ActivitySceneProps) {
  const [next, previous, failed, shadow] = result.metrics;
  if (!next || !previous || !failed || !shadow) return null;
  const recreate = spec.variant === 'recreate';
  const counts = [previous.amount ?? 0, next.amount ?? 0, failed.amount ?? 0];
  const cells = counts.flatMap((count, index) =>
    Array.from({ length: count }, () => trafficOutcomes[index].key),
  );

  return (
    <figure className={styles.scene}>
      <figcaption>
        <strong>사용자 요청 100건의 결과</strong>
        <span>한 칸은 사용자 요청 한 건입니다.</span>
      </figcaption>
      <div className={styles.trafficLayout}>
        <div className={styles.requests} aria-hidden="true">
          {cells.map((state, i) => (
            <span key={i} data-outcome={state} />
          ))}
        </div>
        <dl className={styles.trafficLegend}>
          {trafficOutcomes.map(({ key, label }, index) => {
            if (recreate && key === 'new') return null;
            return (
              <div key={key}>
                <dt>
                  <span data-outcome={key} />
                  {recreate && key === 'old' ? '처리한 요청' : label}
                </dt>
                <dd>{counts[index]}건</dd>
              </div>
            );
          })}
        </dl>
      </div>
      {spec.variant === 'shadow' && (
        <div className={styles.shadowTraffic}>
          <strong>비교 로그로 보낸 복제 요청 {shadow.amount}건</strong>
          <div className={styles.shadowBar} aria-hidden="true">
            <span style={{ width: `${shadow.amount}%` }} />
          </div>
          <p>신규 모델의 처리 결과는 비교 로그에 기록합니다.</p>
        </div>
      )}
    </figure>
  );
}
