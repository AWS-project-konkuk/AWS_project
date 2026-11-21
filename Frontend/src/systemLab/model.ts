import { makeEntity as makeLabEntity, type Entity, type Kind, type Point } from './lab';
import { week2Lab, week2LessonId } from './labs/week2';
import { serviceRoutes as week2ServiceRoutes } from './labs/week2/rules';

/**
 * 1단원(week2-workflow) 기준값과 공통 모델의 진입점.
 * 새 코드는 `lab.ts`와 `labs/` 설정을 사용하고, 이 파일은 기존 이름을 유지한다.
 */
export * from './lab';
export const pilotLesson = week2LessonId;
export const definition = {
  initial: week2Lab.initial,
  requestIds: week2Lab.requestIds,
  requiredPods: week2Lab.requiredPods,
};
export const starterTasks = week2Lab.starterTasks;
export const serviceRoutes = week2ServiceRoutes;
export const makeEntity = (kind: Kind, id: string, parent: string, position: Point): Entity =>
  makeLabEntity(week2Lab, kind, id, parent, position);
