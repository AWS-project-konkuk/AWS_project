import type { Graph } from '../systemLab/lab';
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

export const MIN_ENTITIES = 2;
export const MIN_CONNECTIONS = 1;

/** 게시 조건(엔티티 2개 이상, 연결 1개 이상, 서버와 같은 기준)을 못 채운 이유. 충족하면 null. */
export function workflowShortfall(graph: Graph): string | null {
  const lacks: string[] = [];
  if (graph.entities.length < MIN_ENTITIES)
    lacks.push(`엔티티가 ${graph.entities.length}개입니다(${MIN_ENTITIES}개 이상 필요)`);
  if (graph.connections.length < MIN_CONNECTIONS)
    lacks.push(`연결이 ${graph.connections.length}개입니다(${MIN_CONNECTIONS}개 이상 필요)`);
  return lacks.length
    ? `워크플로우를 첨부할 수 없습니다. ${lacks.join(', ')}. Playground에서 노드를 추가하고 연결한 뒤 다시 시도해 주세요.`
    : null;
}

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
