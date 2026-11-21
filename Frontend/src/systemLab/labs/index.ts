import type { LabConfig } from '../lab';
import { gpuLab } from './gpu';
import { ragLab } from './rag';
import { reproduceLab } from './reproduce';
import { week2Lab } from './week2';

/** 시스템 실습을 쓰는 강의 ID와 설정. 전환한 강의는 여기에 등록한다. */
export const labConfigs: Readonly<Record<string, LabConfig>> = {
  [week2Lab.id]: week2Lab,
  [reproduceLab.id]: reproduceLab,
  [gpuLab.id]: gpuLab,
  [ragLab.id]: ragLab,
};
export const labFor = (lessonId: string): LabConfig | undefined =>
  Object.hasOwn(labConfigs, lessonId) ? labConfigs[lessonId] : undefined;
