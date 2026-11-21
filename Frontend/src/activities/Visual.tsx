import { ArrowRight } from 'lucide-react';
import type { ActivitySceneProps } from './types';
import styles from './Activity.module.css';

export function ActivityFlow({
  steps,
  active,
  label,
}: {
  steps: string[];
  active?: string;
  label: string;
}) {
  return (
    <ol className={styles.flow} aria-label={label}>
      {steps.map((step, index) => (
        <li key={step}>
          {index > 0 && <ArrowRight size={17} aria-hidden="true" />}
          <span aria-current={step === active ? 'step' : undefined}>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ResultValues({ metrics }: { metrics: ActivitySceneProps['result']['metrics'] }) {
  return (
    <dl className={styles.values}>
      {metrics.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StructureScene({ spec, result }: ActivitySceneProps) {
  const active = spec.kind === 'layers' ? result.headline : result.steps.at(-1);
  return (
    <figure className={styles.figure}>
      <figcaption>
        {spec.kind === 'layers' ? '요청이 전달되는 계층' : '선택한 작업의 경로'}
      </figcaption>
      <ActivityFlow steps={result.steps} active={active} label="현재 경로" />
      <ResultValues metrics={result.metrics} />
    </figure>
  );
}

export function ScenarioScene({ result }: ActivitySceneProps) {
  return (
    <figure className={styles.figure}>
      <figcaption>현재 선택에서 일어나는 일</figcaption>
      <ActivityFlow steps={result.steps} active={result.steps.at(-1)} label="현재 상황의 단계" />
      <ResultValues metrics={result.metrics} />
    </figure>
  );
}
