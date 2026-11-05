import { stages } from '../content/lesson';
import type { Graph, NodeKind, SavedWorkflow, WorkflowNode } from '../workflow/types';

export const storageKey = 'flow-lab:workflow:v1';
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type LoadResult =
  | { state: 'empty' }
  | { state: 'loaded'; value: SavedWorkflow }
  | { state: 'blocked'; message: string };
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const kind = (value: unknown): value is NodeKind => stages.some((stage) => stage.kind === value);

export function parseSaved(raw: string): SavedWorkflow {
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || !record(value.graph) || !record(value.progress))
    throw new Error('지원하지 않는 저장 형식입니다.');
  const { nodes, edges } = value.graph;
  if (
    !Array.isArray(nodes) ||
    !Array.isArray(edges) ||
    !Array.isArray(value.progress.readSections) ||
    !value.progress.readSections.every(kind)
  )
    throw new Error('저장된 워크플로 형식이 올바르지 않습니다.');
  const validNodes: WorkflowNode[] = nodes.map((node: unknown) => {
    if (
      !record(node) ||
      typeof node.id !== 'string' ||
      !node.id ||
      !record(node.position) ||
      !finite(node.position.x) ||
      !finite(node.position.y) ||
      !record(node.data) ||
      !kind(node.data.kind) ||
      !(node.data.threshold === null || finite(node.data.threshold))
    )
      throw new Error('노드 정보를 읽을 수 없습니다.');
    return {
      id: node.id,
      type: 'stage',
      position: { x: node.position.x, y: node.position.y },
      data: { kind: node.data.kind, threshold: node.data.threshold },
    };
  });
  const nodeIds = new Set(validNodes.map((node) => node.id));
  if (nodeIds.size !== validNodes.length) throw new Error('중복된 노드 ID가 있습니다.');
  const validEdges = edges.map((edge: unknown) => {
    if (
      !record(edge) ||
      typeof edge.id !== 'string' ||
      !edge.id ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string' ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target) ||
      typeof edge.sourceHandle !== 'string' ||
      typeof edge.targetHandle !== 'string'
    )
      throw new Error('연결 정보를 읽을 수 없습니다.');
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: 'smoothstep',
    };
  });
  if (new Set(validEdges.map((edge) => edge.id)).size !== validEdges.length)
    throw new Error('중복된 연결 ID가 있습니다.');
  return {
    version: 1,
    graph: { nodes: validNodes, edges: validEdges },
    progress: { readSections: [...new Set(value.progress.readSections as NodeKind[])] },
  };
}

export function loadWorkflow(storage: StorageAdapter): LoadResult {
  try {
    const raw = storage.getItem(storageKey);
    return raw === null ? { state: 'empty' } : { state: 'loaded', value: parseSaved(raw) };
  } catch {
    return {
      state: 'blocked',
      message:
        '저장된 데이터를 읽을 수 없습니다. 원본은 유지합니다. 초기화하면 새로 저장할 수 있습니다.',
    };
  }
}

export function saveWorkflow(
  storage: StorageAdapter,
  graph: Graph,
  progress: SavedWorkflow['progress'],
): void {
  // 선택·강조·실행 결과 같은 임시 UI 상태는 저장하지 않는다.
  const value: SavedWorkflow = {
    version: 1,
    graph: {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: 'stage',
        position: node.position,
        data: node.data,
      })),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: 'smoothstep',
      })),
    },
    progress,
  };
  storage.setItem(storageKey, JSON.stringify(value));
}
