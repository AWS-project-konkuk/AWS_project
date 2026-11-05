import { useState } from 'react';
import { workflowNodes, topicNodes } from './catalog';
import { nodeErrors } from './config';
import type { ResourceConfig } from '../console/resources';
import styles from './Nodes.module.css';
export function NodeEditor({
  initial,
  others,
  onSave,
  onClose,
}: {
  initial: ResourceConfig;
  others: ResourceConfig[];
  onSave: (config: ResourceConfig) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const fields =
    [...workflowNodes, ...topicNodes].find((node) => node.id === draft.service)?.fields ?? [];
  return (
    <form
      className={styles.editor}
      aria-label="노드 설정"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next = { ...draft, name: draft.name.trim() };
        const issues = nodeErrors(next, others);
        setErrors(issues);
        if (!issues.length) onSave(next);
      }}
    >
      <h3>노드 설정</h3>
      <label>
        노드 이름
        <input
          aria-label="노드 이름"
          value={draft.name}
          maxLength={63}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>
      {fields.map((field) => (
        <label key={field.id}>
          {field.label}
          {field.options ? (
            <select
              aria-label={field.label}
              value={String(draft.settings[field.id])}
              onChange={(e) =>
                setDraft({ ...draft, settings: { ...draft.settings, [field.id]: e.target.value } })
              }
            >
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label={field.label}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={Number(draft.settings[field.id])}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  settings: { ...draft.settings, [field.id]: Number(event.target.value) },
                })
              }
            />
          )}
          <small>{field.help}</small>
        </label>
      ))}
      <p>노드는 추가 즉시 사용할 수 있습니다. 이름과 필요한 학습 설정만 바꿀 수 있습니다.</p>
      {errors.length > 0 && <p role="alert">{errors.join(' ')}</p>}
      <div>
        <button type="button" onClick={onClose}>
          닫기
        </button>
        <button type="submit">설정 저장</button>
      </div>
    </form>
  );
}
