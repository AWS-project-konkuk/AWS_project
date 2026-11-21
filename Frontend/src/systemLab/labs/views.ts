import type { LabView } from '../labContext';
import { week2View } from './week2/view';

/** 강의 ID별 화면 설정. 규칙을 담은 `labs/index.ts`의 설정과 같은 키를 쓴다. */
export const labViews: Readonly<Record<string, LabView>> = {
  'week2-workflow': week2View,
};
