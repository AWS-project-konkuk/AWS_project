import { useState } from 'react';
import type { ActivityCase } from './types';
import { ActivityFlow } from './Visual';
import styles from './Activity.module.css';

export function ScenarioActivity({
  cases,
  showFlow,
}: {
  cases: ActivityCase[];
  showFlow: boolean;
}) {
  const [index, setIndex] = useState(0);
  const choice = cases[index];
  return (
    <div>
      <div className={styles.choices} role="group" aria-label="비교할 상황">
        {cases.map((item, position) => (
          <button
            type="button"
            aria-pressed={position === index}
            key={item.label}
            onClick={() => setIndex(position)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {showFlow && choice.flow && (
        <figure className={styles.figure}>
          <figcaption>선택한 작업의 경로</figcaption>
          <ActivityFlow steps={choice.flow} active={choice.flow.at(-1)} label="현재 경로" />
        </figure>
      )}
      <div className={styles.result} data-testid="activity-result">
        <strong role="status">{choice.result}</strong>
        <dl className={styles.values}>
          {choice.cards.map((card) => (
            <div key={card.title}>
              <dt>{card.title}</dt>
              <dd>{card.value}</dd>
              <dd className={styles.explanation}>{card.detail}</dd>
            </div>
          ))}
        </dl>
        <p>{choice.reason}</p>
      </div>
    </div>
  );
}
