import type { Goal, LabState, Lesson } from './types';
import type { GoalStrategy } from './goalStrategy';

/** 목표의 종류마다 판정 방법을 교체할 수 있는 전략 계약. */
export interface GoalRule extends GoalStrategy<Goal> {
  kind: Goal['kind'];
  evaluate(goal: Goal, lab: LabState, lesson: Lesson): boolean;
}
export const goalRules: GoalRule[] = [
  {
    kind: 'edge',
    evaluate: (goal, lab) =>
      goal.kind === 'edge' &&
      lab.edges.some((edge) => edge.source === goal.from && edge.target === goal.to),
  },
  {
    kind: 'answer',
    evaluate: (goal, lab, lesson) => {
      if (goal.kind !== 'answer') return false;
      const actual = lab.answers[goal.field];
      const field = lesson.fields.find((field) => field.id === goal.field);
      if (
        !field ||
        (typeof actual === 'number' &&
          (!Number.isFinite(actual) ||
            actual < (field.min ?? -Infinity) ||
            actual > (field.max ?? Infinity)))
      )
        return false;
      if (goal.comparison === 'atLeast')
        return typeof actual === 'number' && actual >= Number(goal.value);
      if (goal.comparison === 'atMost')
        return typeof actual === 'number' && actual <= Number(goal.value);
      return actual === goal.value;
    },
  },
];
