import { absolute, type Graph } from '../systemLab/lab';
import { playgroundLab } from '../systemLab/labs';
import { parseSaved } from '../systemLab/store';

/** 게시판에 첨부하고 불러오는 플레이그라운드 구성. 단원 실습과 같은 그래프 형식이다. */
export interface PlaygroundWorkflow {
  version: 2;
  graph: Graph;
}

export const toWorkflow = (graph: Graph): PlaygroundWorkflow => ({ version: 2, graph });

/** 만든 노드(서비스 밖 루트는 제외)가 하나라도 있는지. */
export const hasNodes = (graph: Graph) => graph.entities.some((e) => e.type === 'resource');

/** 서버에서 받은 값을 검증해 읽는다. 이전 Playground 형식이나 깨진 값은 오류를 던진다. */
export function readWorkflow(value: unknown): PlaygroundWorkflow {
  if (value && typeof value === 'object' && 'workflow' in value) value = value.workflow;
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 2)
    throw new Error('이 워크플로우는 이전 Playground 형식이라 불러올 수 없습니다.');
  const { graph } = value as { graph?: unknown };
  try {
    const saved = parseSaved(
      JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] }),
      playgroundLab,
    );
    return toWorkflow(saved.graph);
  } catch {
    throw new Error('이 워크플로우의 Playground 형식을 읽을 수 없습니다.');
  }
}

export interface PreviewNode {
  id: string;
  name: string;
  kind: string;
  x: number;
  y: number;
}
/** 미리보기에 그릴 노드와 연결. 서비스 영역은 빼고 작업 노드의 화면 위치만 쓴다. */
export function previewOf(workflow: PlaygroundWorkflow) {
  const { graph } = workflow;
  const nodes: PreviewNode[] = graph.entities.flatMap((entity) => {
    if (entity.type !== 'resource') return [];
    const { x, y } = absolute(graph, entity);
    return [{ id: entity.id, name: entity.name, kind: entity.kind, x, y }];
  });
  const ids = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  const edges = graph.connections.flatMap(({ from, to }) => {
    const key = from.node + '>' + to.node;
    if (!ids.has(from.node) || !ids.has(to.node) || seen.has(key)) return [];
    seen.add(key);
    return [{ source: from.node, target: to.node }];
  });
  return { nodes, edges };
}
