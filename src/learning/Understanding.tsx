import type { Lesson } from '../curriculum/types';
import { useLearning } from './LearningStore';
import { getLab } from './blockProgress';
import styles from './LessonLayout.module.css';

export function Understanding({ lesson }: { lesson: Lesson }) {
  const { state, edit } = useLearning();
  const assessment = lesson.assessment;
  if (!assessment) return null;
  const lab = getLab(state.data, lesson.id);
  const answer = lab.answers._understanding;
  const passed = answer === assessment.correct;
  return (
    <section className={styles.understanding} aria-label="이해 확인" data-tour="quiz">
      <h2>새로운 상황에서 판단해 보기</h2>
      <fieldset>
        <legend>{assessment.question}</legend>
        {assessment.options.map((option, index) => (
          <label key={option}>
            <input
              type="radio"
              name={`understanding-${lesson.id}`}
              checked={answer === index}
              onChange={() =>
                edit(lesson.id, (c) => ({ ...c, answers: { ...c.answers, _understanding: index } }))
              }
            />
            {option}
          </label>
        ))}
      </fieldset>
      <label>
        선택한 이유를 내 말로 설명하기 (선택)
        <textarea
          aria-label="선택한 이유"
          rows={3}
          value={String(lab.answers._reason ?? '')}
          onChange={(event) =>
            edit(
              lesson.id,
              (c) => ({ ...c, answers: { ...c.answers, _reason: event.target.value } }),
              false,
            )
          }
        />
      </label>
      {answer !== undefined && (
        <p role="status">
          {passed ? '맞습니다.' : '다시 생각해 보세요.'} {assessment.explanation}
        </p>
      )}
      <button
        disabled={!passed}
        onClick={() =>
          edit(lesson.id, (c) => ({ ...c, attempts: c.attempts + 1, completed: true }), false)
        }
      >
        {lab.completed ? '이해 확인 완료' : '이해 확인하고 학습 완료'}
      </button>
      <p>
        조작 횟수나 방문만으로 완료하지 않습니다. 선택한 이유를 스스로 설명하고 해설과 비교하세요.
      </p>
    </section>
  );
}
