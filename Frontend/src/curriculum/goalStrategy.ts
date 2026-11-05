import type { LabState, Lesson } from './types';
/** 연결·설정·본문 활동이 공유하는 목표 판정 계약. */
export interface GoalStrategy<T> {
  kind: string;
  evaluate: (goal: T, lab: LabState, lesson: Lesson) => boolean;
}
