import { useEffect, useRef, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { resourceErrors, serviceById, type ResourceConfig } from './resources';
import styles from './Console.module.css';

export function ResourceConsole({
  initial,
  others,
  editing = false,
  context,
  onSave,
  onClose,
}: {
  initial: ResourceConfig;
  others: ResourceConfig[];
  editing?: boolean;
  context?: string;
  onSave: (resource: ResourceConfig) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const spec = serviceById[draft.service];
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.console}
      aria-labelledby="resource-console-title"
      onCancel={onClose}
    >
      <header className={styles.consoleHeader}>
        <span>
          학습용 콘솔
          <ChevronRight size={13} />
          {spec.name}
        </span>
        <span>
          {draft.service === 'iam' ? '글로벌' : '서울 · 예시 환경'}
          <button aria-label="콘솔 닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </span>
      </header>
      <form
        className={styles.consoleForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = { ...draft, name: draft.name.trim() };
          const problems = resourceErrors(next, others);
          setErrors(problems);
          if (!problems.length) onSave(next);
        }}
      >
        <div className={styles.consoleBody}>
          <div className={styles.configuration}>
            <h1 id="resource-console-title">
              {spec.name} {editing ? '구성 변경' : '생성'}
            </h1>
            <p className={styles.intro}>{spec.description}</p>
            {context && <p className={styles.context}>{context}</p>}
            <section>
              <h2>이름 및 태그</h2>
              <label>
                리소스 이름
                <input
                  autoFocus
                  aria-label="리소스 이름"
                  value={draft.name}
                  maxLength={63}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <p>현재 학습 구성에서 자원을 구분하는 이름입니다.</p>
            </section>
            {spec.fields.map((field) => (
              <section key={field.id}>
                <h2>{field.title}</h2>
                <label>
                  {field.label}
                  {field.options ? (
                    <select
                      aria-label={field.label}
                      value={String(draft.settings[field.id])}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          settings: { ...draft.settings, [field.id]: event.target.value },
                        })
                      }
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      aria-label={field.label}
                      min={field.min}
                      max={field.max}
                      step={1}
                      value={Number(draft.settings[field.id])}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          settings: { ...draft.settings, [field.id]: Number(event.target.value) },
                        })
                      }
                    />
                  )}
                </label>
                <p>{field.help}</p>
              </section>
            ))}
          </div>
          <aside className={styles.summary}>
            <h2>구성 요약</h2>
            <dl>
              <dt>서비스</dt>
              <dd>{spec.name}</dd>
              <dt>이름</dt>
              <dd>{draft.name || '이름 입력 필요'}</dd>
              {spec.fields.map((field) => (
                <div key={field.id}>
                  <dt>{field.label}</dt>
                  <dd>
                    {field.options?.find((option) => option.value === draft.settings[field.id])
                      ?.label ?? String(draft.settings[field.id])}
                  </dd>
                </div>
              ))}
            </dl>
            <p>핵심 설정만 다루는 교육용 폼입니다. 실제 AWS 자원·키·요금은 생성되지 않습니다.</p>
          </aside>
        </div>
        <footer>
          {errors.length > 0 && (
            <ul role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <div>
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button className={styles.orange} type="submit">
              {editing ? '구성 저장' : '리소스 생성'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
