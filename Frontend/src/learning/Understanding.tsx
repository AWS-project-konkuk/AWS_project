import { useState } from 'react';
import { ResultFeedback } from './ResultFeedback';
import type { Lesson } from '../curriculum/types';
import { useLearning } from './LearningStore';
import { getLab } from './blockProgress';
import { QuizAiFeedback } from './QuizAiFeedback';
import { useQuizAi } from './useQuizAi';
import styles from './LessonLayout.module.css';

export function Understanding({ lesson }: { lesson: Lesson }) {
  const { state, edit } = useLearning();
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const lab = getLab(state.data, lesson.id);
  const answer = lab.answers._understanding;
  const reason = String(lab.answers._reason ?? '');
  const ai = useQuizAi(lesson, answer, reason);
  const assessment = lesson.assessment;
  if (!assessment) return null;
  const passed = answer === assessment.correct;
  const checked = lab.answers._checkedUnderstanding === answer && answer !== undefined;
  return (
    <section className={styles.understanding} aria-label="이해 확인" data-tour="quiz">
      <h2>새로운 상황에서 판단해 보기</h2>
      <fieldset>
        <legend>{assessment.question}</legend>
        {assessment.options.map((option, index) => (
          <label
            key={option}
            data-answer-state={
              checked && answer === index ? (passed ? 'success' : 'error') : undefined
            }
          >
            <input
              type="radio"
              name={`understanding-${lesson.id}`}
              checked={answer === index}
              onChange={() =>
                edit(lesson.id, (c) => ({
                  ...c,
                  answers: { ...c.answers, _understanding: index, _checkedUnderstanding: '' },
                }))
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
          value={reason}
          onChange={(event) =>
            edit(
              lesson.id,
              (c) => ({ ...c, answers: { ...c.answers, _reason: event.target.value } }),
              false,
            )
          }
        />
      </label>
      <div className={styles.quizActions}>
        <button
          disabled={answer === undefined}
          onClick={() => {
            setFeedbackVersion((value) => value + 1);
            edit(
              lesson.id,
              (c) => ({
                ...c,
                answers: { ...c.answers, _checkedUnderstanding: answer! },
                attempts: c.attempts + 1,
                completed: passed,
              }),
              false,
            );
          }}
        >
          정답 확인하기
        </button>
        <button
          type="button"
          disabled={!ai.canRequest || ai.loading}
          onClick={() => void ai.request()}
        >
          {ai.loading ? 'AI 검토 중…' : 'AI에게 요청하기'}
        </button>
      </div>
      <QuizAiFeedback {...ai} />
      {checked && (
        <ResultFeedback
          key={feedbackVersion}
          tone={passed ? 'success' : 'error'}
          title={passed ? '정답입니다' : '오답입니다'}
        >
          {passed ? '맞습니다.' : '다시 생각해 보세요.'} {assessment.explanation}
        </ResultFeedback>
      )}
      {checked && passed && <p>학습 완료가 기록되었습니다. 아래에서 다음 강의로 이동하세요.</p>}
      <p>
        조작 횟수나 방문만으로 완료하지 않습니다. 선택한 이유를 스스로 설명하고 해설과 비교하세요.
      </p>
    </section>
  );
}
