import { stages } from '../content/lesson';
import type { Graph, NodeKind, WorkflowEdge, WorkflowNode } from './types';

function defaultPosition(kind: NodeKind) {
  const stageIndex = stages.findIndex((stage) => stage.kind === kind);
  return {
    x: (stageIndex < 3 ? stageIndex : 5 - stageIndex) * 280 + 40,
    y: stageIndex < 3 ? 40 : 260,
  };
}

export function createNode(kind: NodeKind): WorkflowNode {
  return {
    id: `${kind}-${crypto.randomUUID()}`,
    type: 'stage',
    position: defaultPosition(kind),
    data: { kind, threshold: kind === 'evaluation' ? 0.8 : null },
  };
}

export function makeEdge(
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): WorkflowEdge {
  return {
    id: `${source}:${sourceHandle}-${target}:${targetHandle}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'smoothstep',
  };
}

export function exampleGraph(includeEvaluation = false): Graph {
  const nodes: WorkflowNode[] = stages
    .filter((stage) => includeEvaluation || stage.kind !== 'evaluation')
    .map((stage) => ({
      id: stage.kind,
      type: 'stage',
      position: defaultPosition(stage.kind),
      data: { kind: stage.kind, threshold: stage.kind === 'evaluation' ? 0.8 : null },
    }));
  const edges = [
    makeEdge('dataset', 'raw', 'preprocess', 'raw'),
    makeEdge('preprocess', 'train', 'training', 'train'),
    makeEdge('registry', 'registered', 'serving', 'registered'),
  ];
  if (includeEvaluation)
    edges.push(
      makeEdge('training', 'model', 'evaluation', 'model'),
      makeEdge('preprocess', 'test', 'evaluation', 'test'),
      makeEdge('evaluation', 'approved', 'registry', 'approved'),
    );
  else edges.push(makeEdge('training', 'model', 'registry', 'approved'));
  return { nodes, edges };
}
