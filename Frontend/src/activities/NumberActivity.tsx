import type { Answer } from '../curriculum/types';
import { memoryBudget, metricSamples } from './simulation';
import type { ActivityResult, ActivitySpec } from './types';
import styles from './Activity.module.css';

type Answers = Record<string, Answer>;

function MemoryComparison({ answers }: { answers: Answers }) {
  const current = memoryBudget(answers);
  const baseline = memoryBudget({
    batch: 32,
    accumulation: 1,
    precision: 'fp32',
    vram: answers.vram,
  });
  const scale = Math.max(current.total, baseline.total, current.capacity);
  const width = (amount: number) => `${(amount / scale) * 100}%`;
  return (
    <figure className={styles.figure}>
      <figcaption>같은 VRAM에서 학습 메모리 비교</figcaption>
      <ul className={styles.legend} aria-label="메모리 막대 범례">
        <li data-swatch="base">고정 학습 상태</li>
        <li data-swatch="work">활성값</li>
        <li data-swatch="over">한도 초과분</li>
      </ul>
      {(
        [
          ['기준 설정 · FP32 · 배치 32 × 1', baseline],
          ['현재 설정', current],
        ] as const
      ).map(([label, budget]) => (
        <div className={styles.barRow} key={label}>
          <div className={styles.barHeading}>
            <strong>{label}</strong>
            <span>
              {budget.total} / {budget.capacity} GiB · 유효 배치 {budget.effectiveBatch}
            </span>
          </div>
          <div className={styles.track} aria-hidden="true">
            <div className={styles.baseSegment} style={{ width: width(budget.fixed) }} />
            <div
              className={styles.workSegment}
              style={{ width: width(budget.activation - budget.overflow) }}
            />
            <div className={styles.overSegment} style={{ width: width(budget.overflow) }} />
            <div className={styles.limitMarker} style={{ left: width(budget.capacity) }} />
          </div>
          <small data-overflow={budget.overflow > 0}>
            고정 {budget.fixed} GiB · 활성값 {budget.activation} GiB ·{' '}
            {budget.overflow > 0
              ? `OOM (${budget.overflow} GiB 초과)`
              : `여유 ${Math.round((budget.capacity - budget.total) * 100) / 100} GiB`}
          </small>
        </div>
      ))}
      <p className={styles.figureNote}>세로선은 VRAM 한도입니다. 수치는 학습용 예시입니다.</p>
    </figure>
  );
}

function ComputeComparison({ answers, result }: { answers: Answers; result: ActivityResult }) {
  const cpu = result.metrics[0].amount ?? 0;
  const gpu = result.metrics[1].amount ?? 0;
  const setup = Number(answers.setup);
  const scale = Math.max(cpu, gpu, 1);
  const width = (amount: number) => `${(amount / scale) * 100}%`;
  return (
    <figure className={styles.figure}>
      <figcaption>같은 연산 {String(answers.jobs)}개의 상대 처리 시간</figcaption>
      <div className={styles.barRow}>
        <div className={styles.barHeading}>
          <strong>CPU</strong>
          <span>{cpu} · 연산</span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.workSegment} style={{ width: width(cpu) }} />
        </div>
      </div>
      <div className={styles.barRow}>
        <div className={styles.barHeading}>
          <strong>GPU</strong>
          <span>
            {gpu} · 준비 {setup} + 연산 {gpu - setup}
          </span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.baseSegment} style={{ width: width(setup) }} />
          <div className={styles.workSegment} style={{ width: width(gpu - setup) }} />
        </div>
      </div>
      <p className={styles.figureNote}>
        짧은 막대가 빠른 쪽입니다. 상대 시간은 실제 장치의 벤치마크 수치와 다릅니다.
      </p>
    </figure>
  );
}

function DriftComparison({ result }: { result: ActivityResult }) {
  return (
    <figure className={styles.figure}>
      <figcaption>기준 구간과 현재 구간</figcaption>
      <table className={styles.observationTable}>
        <thead>
          <tr>
            <th scope="col">관측값</th>
            <th scope="col">기준</th>
            <th scope="col">현재</th>
          </tr>
        </thead>
        <tbody>
          {result.metrics.map((metric, index) => (
            <tr key={metric.label}>
              <th scope="row">{metric.label}</th>
              <td>{index === 1 ? '90%' : '0%'}</td>
              <td data-changed={metric.amount !== (index === 1 ? 90 : 0)}>{metric.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.figureNote}>
        입력 분포와 예측 품질은 각각 관측합니다. 이 값은 예시입니다.
      </p>
    </figure>
  );
}

function SamplingChart({ answers, result }: { answers: Answers; result: ActivityResult }) {
  const interval = Number(answers.interval);
  const limit = Number(answers.limit);
  const samples = metricSamples(interval);
  const x = (seconds: number) => 47 + (seconds / 60) * 308;
  const y = (value: number) => 150 - (value / 300) * 118;
  const signal = metricSamples(1)
    .map((point) => `${x(point.x)},${y(point.y)}`)
    .join(' ');
  return (
    <figure className={styles.figure}>
      <figcaption>같은 지연 신호를 {interval}초마다 수집</figcaption>
      <svg
        className={styles.chart}
        viewBox="0 0 380 181"
        role="img"
        aria-label={`60초간 ${result.metrics[0].value} 수집, 경고 기준 ${limit} ms, 기준 초과 ${result.metrics[1].value}`}
      >
        <path d="M47 20 V150 H355" className={styles.chartAxis} />
        <text x="45" y="20" textAnchor="end">
          ms
        </text>
        {[0, 100, 200, 300].map((step) => (
          <text key={step} x="42" y={y(step) + 4} textAnchor="end">
            {step}
          </text>
        ))}
        {[0, 20, 40, 60].map((step) => (
          <text key={step} x={x(step)} y="168" textAnchor="middle">
            {step}초
          </text>
        ))}
        <polyline points={signal} className={styles.chartSignal} />
        <line x1={47} y1={y(limit)} x2={355} y2={y(limit)} className={styles.chartLimit} />
        {samples.map((point) => (
          <circle
            key={point.x}
            cx={x(point.x)}
            cy={y(point.y)}
            r={point.y > limit ? 4 : 3}
            className={point.y > limit ? styles.chartAlert : styles.chartSample}
          />
        ))}
      </svg>
      <p className={styles.figureNote}>
        회색 실선은 예시 신호, 점은 실제 수집 시점, 점선은 경고 기준 {limit} ms입니다.
      </p>
    </figure>
  );
}

export function NumberActivity({
  spec,
  answers,
  result,
}: {
  spec: ActivitySpec;
  answers: Answers;
  result: ActivityResult;
}) {
  switch (spec.kind) {
    case 'memory':
      return <MemoryComparison answers={answers} />;
    case 'compute':
      return <ComputeComparison answers={answers} result={result} />;
    case 'drift':
      return <DriftComparison result={result} />;
    case 'metrics':
      return <SamplingChart answers={answers} result={result} />;
    default:
      throw new Error(`${spec.kind}: 수치 비교 도해가 등록되지 않았습니다.`);
  }
}
