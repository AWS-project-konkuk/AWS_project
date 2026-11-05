import type { Answer, LabState } from '../curriculum/types';
import { resolveScenario } from './scenarios';
import { workflowEdge } from './engine';

const working: Record<string, Record<string, Answer>> = {
  'week1-workflow': { strategy: 'tensor' },
  'week2-workflow': { deployment: 'v2', healing: 'on' },
  'week3-workflow': { cache: 'on', shard: 'on', persistent: 'volume' },
  'week4-workflow': { operation: 'pull' },
  'week5-workflow': { window: 'hour', embedding: 'same', retrieval: 'relevant' },
  'feature-workflow': { window: 'hour' },
  'rag-workflow': { embedding: 'same', retrieval: 'relevant' },
  'week6-workflow': { strategy: 'shadow', ready: 'yes' },
  'week7-workflow': { decision: 'investigate', quality: 0.9 },
  'pipeline-capstone': { threshold: 0.8 },
};

/** 과제 모드가 바뀌면 연결과 설정을 함께 초기화해 이전 답을 남기지 않는다. */
export function applyWorkflowPreset(
  id: string,
  lab: LabState,
  mode: 'example' | 'repair' | 'new',
): LabState {
  const base = resolveScenario(id, {});
  const defaults = Object.fromEntries(base.fields.map((field) => [field.id, field.initial]));
  const answers = {
    ...lab.answers,
    ...defaults,
    ...(mode === 'example' ? working[id] : {}),
    _workflowQuiz: '',
  };
  const spec = resolveScenario(id, answers);
  return {
    ...lab,
    answers,
    activeNodes: spec.nodes.map((node) => node.id),
    edges: (mode === 'new' ? [] : mode === 'repair' ? spec.starter : spec.wires).map(workflowEdge),
  };
}
