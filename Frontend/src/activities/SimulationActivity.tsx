import { useId, useState, type ComponentType } from 'react';
import type { Answer, LabField } from '../curriculum/types';
import { getLab } from '../learning/blockProgress';
import { useLearningStore } from '../learning/LearningStore';
import { activityPresets } from './activityPresets';
import { activitySignature, observationHistory, simulate, validInputs } from './simulation';
import type { ActivitySceneProps, ActivitySimulationProps } from './types';
import styles from './Activity.module.css';

function NumberField({
  field,
  value,
  onChange,
}: {
  field: LabField;
  value: Answer;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string>();
  const invalid = draft !== undefined;
  return (
    <div className={styles.inputField}>
      <label htmlFor={id}>{field.label}</label>
      <input
        id={id}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={draft ?? String(value)}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
        onBlur={() => setDraft(undefined)}
        onChange={(event) => {
          const input = event.currentTarget;
          if (
            input.value !== '' &&
            validInputs({ fields: [field] }, { [field.id]: input.valueAsNumber })
          ) {
            setDraft(undefined);
            onChange(input.valueAsNumber);
          } else {
            setDraft(input.value);
          }
        }}
      />
      <small id={`${id}-help`}>{field.help}</small>
      {invalid && (
        <small className={styles.error} id={`${id}-error`} role="status">
          {field.min}~{field.max} 범위에서 {field.step ?? 1} 단위로 입력하세요.
        </small>
      )}
    </div>
  );
}

function ActivityControls({
  spec,
  answers,
  update,
}: Pick<ActivitySceneProps, 'spec' | 'answers'> & {
  update: (answers: Record<string, Answer>) => void;
}) {
  const groupId = useId();
  return (
    <div className={styles.controls} aria-label="활동 설정">
      {spec.fields.map((field) => {
        const id = `${groupId}-${field.id}`;
        return field.options ? (
          <fieldset key={field.id} className={styles.optionField} aria-describedby={`${id}-help`}>
            <legend>{field.label}</legend>
            <div className={styles.choices}>
              {field.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={answers[field.id] === option.value}
                  onClick={() => update({ [field.id]: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <small id={`${id}-help`}>{field.help}</small>
          </fieldset>
        ) : (
          <NumberField
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(value) => update({ [field.id]: value })}
          />
        );
      })}
    </div>
  );
}

export function SimulationActivity({
  lesson,
  spec,
  scene: Scene,
}: ActivitySimulationProps & { scene: ComponentType<ActivitySceneProps> }) {
  const data = useLearningStore((state) => state.data);
  const edit = useLearningStore((state) => state.edit);
  const saved = getLab(data, lesson.id).answers;
  const answers = { ...saved };
  for (const field of spec.fields) {
    if (!validInputs({ fields: [field] }, answers)) answers[field.id] = field.initial;
  }

  const update = (changes: Record<string, Answer>) => {
    const settings = Object.fromEntries(
      spec.fields.map(({ id }) => [id, changes[id] ?? answers[id]]),
    );
    if (!validInputs(spec, settings)) return;
    edit(
      lesson.id,
      (current) => {
        const next = { ...current.answers, ...settings };
        const signature = activitySignature(next);
        if (current.answers._observed === signature) return current;
        return {
          ...current,
          attempts: current.attempts + 1,
          answers: {
            ...next,
            _observed: signature,
            _history: JSON.stringify(
              [...new Set([...observationHistory(current.answers), signature])].slice(-12),
            ),
          },
        };
      },
      false,
    );
  };

  const result = simulate(spec, answers);
  const presets = activityPresets[spec.kind];
  const controls = <ActivityControls spec={spec} answers={answers} update={update} />;
  const visualization = <Scene spec={spec} answers={answers} result={result} />;
  const observedMetrics =
    spec.kind === 'release' && spec.variant === 'recreate'
      ? result.metrics.slice(1, 3)
      : result.metrics;
  return (
    <div>
      {presets ? (
        <>
          <div className={styles.quickActions} role="group" aria-label={presets.label}>
            {presets.choices.map(({ label, settings }) => (
              <button type="button" key={label} onClick={() => update(settings)}>
                {label}
              </button>
            ))}
          </div>
          <div className={styles.sampleComparison}>
            {visualization}
            {controls}
          </div>
        </>
      ) : (
        <>
          {controls}
          {visualization}
        </>
      )}
      <div className={styles.result} data-testid="activity-result">
        <div role="status" aria-atomic="true">
          <strong>{result.headline}</strong>
          <span className="visually-hidden">
            {' '}
            {observedMetrics.map(({ label, value }) => `${label} ${value}`).join(', ')}
          </span>
        </div>
        <p>{result.detail}</p>
        {result.warning && <p className={styles.error}>{result.warning}</p>}
      </div>
    </div>
  );
}
