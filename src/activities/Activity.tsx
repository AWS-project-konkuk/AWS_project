import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import type { Lesson } from '../curriculum/types';
import { evaluateGoals } from '../curriculum/engine';
import { getLab } from '../learning/blockProgress';
import { useLearning } from '../learning/LearningStore';
import { Fields } from './Fields';
import { Visual } from './Visual';
import {
  activitySignature,
  dockerCommand,
  observationHistory,
  simulate,
  validInputs,
} from './simulation';
import styles from './Activity.module.css';
export function Activity({ lesson }: { lesson: Lesson }) {
  const { state, edit } = useLearning();
  const lab = getLab(state.data, lesson.id),
    spec = lesson.activity!;
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { amount: 0.15 });
  const reduced = Boolean(useReducedMotion());
  const [running, setRunning] = useState(false),
    [phase, setPhase] = useState(0),
    [feedback, setFeedback] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const signature = activitySignature(lab.answers),
    observed = lab.answers._observed === signature,
    result = simulate(spec, lab.answers);
  const maxPhase = spec.kind === 'compute' ? 12 : Math.max(result.steps.length - 1, 1);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    setRunning(false);
    setPhase(0);
  }, [signature]);
  useEffect(() => {
    if (!running || !inView || hidden || reduced) return;
    const timer = setInterval(
      () =>
        setPhase((v) => {
          if (v >= maxPhase) {
            setRunning(false);
            return v;
          }
          return v + 1;
        }),
      550,
    );
    return () => clearInterval(timer);
  }, [running, inView, hidden, reduced, maxPhase]);
  const record = () => {
    if (!validInputs(spec, lab.answers)) return;
    edit(
      lesson.id,
      (current) => ({
        ...current,
        attempts: current.attempts + 1,
        answers: {
          ...current.answers,
          _observed: signature,
          _history: JSON.stringify(
            [...new Set([...observationHistory(current.answers), signature])].slice(-12),
          ),
        },
      }),
      false,
    );
  };
  const run = () => {
    record();
    setPhase(0);
    setRunning(!reduced);
  };
  const ready = evaluateGoals(lesson, lab).every((g) => g.passed);
  return (
    <section
      ref={root}
      className={styles.activity}
      aria-label="본문 시각 활동"
      data-testid="inline-activity"
    >
      <header>
        <span>직접 관찰하기</span>
        <h3>{spec.task}</h3>
        <small>교육용 예시 · 실제 모델·인프라 실행 없음</small>
      </header>
      <Fields
        fields={spec.fields}
        answers={lab.answers}
        onChange={(id, value) =>
          edit(lesson.id, (c) => ({ ...c, answers: { ...c.answers, [id]: value } }))
        }
      />
      {spec.kind === 'commands' && (
        <div className={styles.commands} aria-label="Docker 명령 선택">
          {['build', 'images', 'run', 'ps', 'logs', 'stop', 'rm'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                edit(lesson.id, (c) => ({ ...c, answers: dockerCommand(c.answers, cmd) }));
                setPhase(3);
              }}
            >
              docker {cmd}
            </button>
          ))}
        </div>
      )}
      <div className={styles.visual} data-testid="activity-visual">
        <>
          {validInputs(spec, lab.answers) ? (
            <Visual
              spec={spec}
              answers={lab.answers}
              result={result}
              phase={phase}
              reduced={reduced}
            />
          ) : (
            <p>허용된 범위의 설정값을 입력하세요.</p>
          )}
        </>
      </div>
      <div className={styles.playback} aria-label="활동 재생">
        <button onClick={run} disabled={!validInputs(spec, lab.answers)} data-testid="activity-run">
          {reduced ? '결과 계산' : '처음부터 재생'}
        </button>
        <button
          onClick={() => {
            record();
            setRunning((v) => !v);
          }}
          disabled={reduced || !validInputs(spec, lab.answers)}
        >
          {running ? '일시정지' : '계속 재생'}
        </button>
        <button
          onClick={() => {
            record();
            setRunning(false);
            setPhase((v) => Math.min(v + 1, maxPhase));
          }}
          disabled={!validInputs(spec, lab.answers)}
        >
          다음 단계
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setPhase(0);
          }}
        >
          다시 보기
        </button>
      </div>
      <p className={styles.phase}>
        {result.steps[Math.min(phase, result.steps.length - 1)]} · {Math.min(phase, maxPhase) + 1}/
        {maxPhase + 1}
      </p>
      {reduced && <small>동작 줄이기 설정 · 다음 단계와 결과 설명으로 관찰할 수 있습니다.</small>}
      <div className={styles.result} role="status" data-testid="activity-result">
        {observed ? (
          <>
            <strong>{result.headline}</strong>
            <dl>
              {result.metrics.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
            <p>{result.detail}</p>
            {result.warning && <p className={styles.warning}>{result.warning}</p>}
          </>
        ) : (
          <p>
            설정을 선택하고 {reduced ? '결과 계산' : '재생'}을 눌러 확인하세요.{' '}
            {spec.fields.length > 0 && '서로 다른 두 설정을 비교하면 관찰 목표가 충족됩니다.'}
          </p>
        )}
      </div>
      {!lesson.assessment && (
        <>
          <fieldset className={styles.quiz} data-tour="quiz">
            <legend>확인 문제 · {spec.question}</legend>
            {spec.options.map((o) => (
              <label key={o.value}>
                <input
                  type="radio"
                  name={`quiz-${lesson.id}`}
                  checked={lab.answers._quiz === o.value}
                  onChange={() => {
                    edit(lesson.id, (c) => ({ ...c, answers: { ...c.answers, _quiz: o.value } }));
                    setFeedback(true);
                  }}
                />
                {o.label}
              </label>
            ))}
            {feedback && (
              <p role="status">
                {lab.answers._quiz === spec.correct ? '맞습니다. ' : '다시 생각해 보세요. '}
                {spec.explanation}
              </p>
            )}
          </fieldset>
          <button
            className={styles.complete}
            onClick={() => {
              setFeedback(true);
              if (ready) edit(lesson.id, (c) => ({ ...c, completed: true }), false);
            }}
            data-testid="activity-complete"
          >
            {lab.completed ? '학습 완료됨' : '학습 완료 확인'}
          </button>
          {feedback && !ready && (
            <p className={styles.warning}>
              {evaluateGoals(lesson, lab)
                .filter((g) => !g.passed)
                .map((g) => g.label)
                .join(' · ')}{' '}
              항목을 확인하세요.
            </p>
          )}
        </>
      )}
    </section>
  );
}
