import type { LabView } from '../labContext';
import { gpuView } from './gpu/view';
import { ragView } from './rag/view';
import { reproduceView } from './reproduce/view';
import { week2View } from './week2/view';
import { playgroundView } from './playground-view';
import { workflowViews } from './workflow-views';

/** 강의 ID별 화면 설정. 규칙을 담은 `labs/index.ts`의 설정과 같은 키를 쓴다. */
export const labViews: Readonly<Record<string, LabView>> = {
  ...workflowViews,
  'week2-workflow': week2View,
  'week4-workflow': reproduceView,
  'week1-workflow': gpuView,
  'rag-workflow': ragView,
  playground: playgroundView,
};
