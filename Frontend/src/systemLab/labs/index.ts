import type { LabConfig } from '../lab';
import { week2Lab } from './week2';

/** 시스템 실습을 쓰는 강의 ID와 설정. 전환한 강의는 여기에 등록한다. */
export const labConfigs: Readonly<Record<string, LabConfig>> = {
  [week2Lab.id]: week2Lab,
};
export const labFor = (lessonId: string): LabConfig | undefined =>
  Object.hasOwn(labConfigs, lessonId) ? labConfigs[lessonId] : undefined;
