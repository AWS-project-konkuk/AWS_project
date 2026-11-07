import type { Answer, LabField } from '../curriculum/types';
import styles from './Activity.module.css';
export function Fields({
  fields,
  answers,
  onChange,
}: {
  fields: LabField[];
  answers: Record<string, Answer>;
  onChange: (id: string, value: Answer) => void;
}) {
  return (
    <div className={styles.fields}>
      {fields.map((f) => (
        <label key={f.id}>
          <span>{f.label}</span>
          {f.options ? (
            <select
              aria-label={f.label}
              value={String(answers[f.id])}
              onChange={(e) => onChange(f.id, e.target.value)}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className={styles.numeric}>
              <input
                aria-label={f.label}
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={Number(answers[f.id])}
                onChange={(e) => onChange(f.id, Number(e.target.value))}
              />
              <input
                aria-label={`${f.label} 직접 입력`}
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={Number(answers[f.id])}
                onChange={(e) => onChange(f.id, Number(e.target.value))}
              />
            </div>
          )}
          <small>{f.help}</small>
        </label>
      ))}
    </div>
  );
}
