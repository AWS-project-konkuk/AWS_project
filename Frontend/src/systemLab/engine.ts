import {
  type Graph,
  type LabConfig,
  type Material,
  type ResourceEntity,
  type Version,
} from './lab';
import { week2Lab } from './labs/week2';

export type Request = { id: number; viaService?: string };
export type Response = {
  id: number;
  pod: string;
  model: Version;
  image: Version;
  deployment: string;
  viaService?: string;
  label: string;
};
/** 실습별로 자유롭게 정의하는 자료. material이 포트 타입이고 data가 값이다. */
export interface DataArtifact {
  type: 'data';
  material: string;
  summary: string;
  data: Record<string, unknown>;
}
export type Artifact =
  | { type: 'request'; requests: Request[] }
  | { type: 'prediction'; responses: Response[] }
  | { type: 'model' | 'image' | 'control'; version: Version; source: string }
  | DataArtifact;
export interface Metric {
  label: string;
  value: string;
}
export interface Transfer {
  edge: string;
  from: string;
  to: string;
  description: string;
  artifact: Artifact;
}
export interface RunStep {
  node: string;
  status: 'success' | 'failed' | 'blocked';
  message: string;
  transfers: Transfer[];
}
export interface RunResult {
  id: string;
  success: boolean;
  steps: RunStep[];
  cycle: string[];
  responses: Response[];
  message: string;
  /** 도착 노드가 보고하는 결과 지표. */
  metrics: Metric[];
  /** 이 실행이 남긴 관찰 태그. 실패한 실행도 포함한다. */
  observations: string[];
}
export interface StepContext {
  lab: LabConfig;
  node: ResourceEntity;
  graph: Graph;
  inputs: Artifact[];
  /** 입력 포트별로 도착한 자료. */
  byPort: Record<string, Artifact[]>;
  /** portId를 주면 그 출력 포트로만 보낸다. */
  emit: (artifact: Artifact, portId?: string) => void;
  observe: (tag: string) => void;
  report: (metrics: Metric[]) => void;
  distribute: (requests: Request[]) => number;
  finish: (responses: Response[]) => void;
}
export type Strategy = (ctx: StepContext) => string;

function cycleEdges(graph: Graph) {
  const visited = new Set<string>();
  const active = new Map<string, number>();
  const path: string[] = [];
  const cycle = new Set<string>();
  function visit(id: string) {
    if (visited.has(id)) return;
    active.set(id, path.length);
    for (const e of graph.connections.filter((c) => c.from.node === id)) {
      const index = active.get(e.to.node);
      if (index !== undefined) {
        path.slice(index).forEach((edge) => cycle.add(edge));
        cycle.add(e.id);
      } else {
        path.push(e.id);
        visit(e.to.node);
        path.pop();
      }
    }
    active.delete(id);
    visited.add(id);
  }
  graph.entities.forEach((node) => visit(node.id));
  return [...cycle];
}
/** 순환을 닫는 연결. 이 선의 값은 다음 반복에서 전달된다. */
export function backEdges(graph: Graph) {
  const visited = new Set<string>();
  const active = new Set<string>();
  const back = new Set<string>();
  function visit(id: string) {
    if (visited.has(id)) return;
    active.add(id);
    for (const e of graph.connections) {
      if (e.from.node !== id) continue;
      if (active.has(e.to.node)) back.add(e.id);
      else visit(e.to.node);
    }
    active.delete(id);
    visited.add(id);
  }
  graph.entities.forEach((node) => visit(node.id));
  return back;
}
/** 순환이 있는 자유 구성은 이 횟수만큼 반복해 실행한다. */
export const LOOP_ROUNDS = 3;
function describe(lab: LabConfig, a: Artifact, material: Material) {
  if (a.type === 'request') return lab.materials[material] + ' ' + a.requests.length + '건';
  if (a.type === 'prediction') return lab.materials[material] + ' ' + a.responses.length + '건';
  if (a.type === 'data') return a.summary;
  return (a.type === 'model' ? 'model.pkl · ' : lab.materials[material] + ' ') + a.version;
}

export function runLab(graph: Graph, id: string, lab: LabConfig = week2Lab): RunResult {
  graph = { ...graph, connections: [...graph.connections, ...lab.routes(graph)] };
  // 자유 구성(Playground)은 순환을 허용하고 반복 실행한다.
  const cycle = lab.freeform ? [] : cycleEdges(graph);
  const loopEdges = lab.freeform ? backEdges(graph) : new Set<string>();
  if (cycle.length)
    return {
      id,
      success: false,
      steps: [],
      cycle,
      responses: [],
      metrics: [],
      observations: [],
      message: '순환 연결이 있습니다. 강조된 선을 확인하세요.',
    };
  const end = graph.entities.find((e) => e.kind === 'end');
  const start = graph.entities.find((e) => e.kind === 'start');
  const entries = graph.entities.filter(
    (e) =>
      lab.entryKinds.includes(e.kind) &&
      graph.connections.some((wire) => wire.from.node === start?.id && wire.to.node === e.id),
  );
  const queue = [end?.id, ...entries.map((entry) => entry.id)];
  const relevant = new Set([start?.id, ...queue]);
  while (queue.length) {
    const target = queue.pop();
    for (const edge of graph.connections)
      if (edge.to.node === target && !relevant.has(edge.from.node)) {
        relevant.add(edge.from.node);
        queue.push(edge.from.node);
      }
  }
  if (lab.freeform) {
    relevant.clear();
    for (const wire of graph.connections) {
      relevant.add(wire.from.node);
      relevant.add(wire.to.node);
    }
  }
  const nodesToRun = graph.entities.filter(
    (e): e is ResourceEntity => e.type === 'resource' && relevant.has(e.id),
  );
  let steps: RunStep[] = [];
  let responses: Response[] = [];
  let metrics: Metric[] = [];
  const observations = new Set<string>();
  const rounds = loopEdges.size ? LOOP_ROUNDS : 1;
  // 순환을 닫는 연결의 값은 앞선 반복에서 가져온다.
  let carry = new Map<string, Artifact>();
  for (let round = 1; round <= rounds; round++) {
    const pending = [...nodesToRun];
    steps = [];
    responses = [];
    metrics = [];
    const done = new Set<string>();
    const values = new Map<string, Artifact>(carry);
    while (pending.length) {
      const index = pending.findIndex((e) =>
        graph.connections.every(
          (wire) => wire.to.node !== e.id || loopEdges.has(wire.id) || done.has(wire.from.node),
        ),
      );
      if (index === -1) break;
      const [node] = pending.splice(index, 1);
      done.add(node.id);
      const incoming = graph.connections.filter((e) => e.to.node === node.id);
      const inputs = incoming.flatMap((e) => {
        const value = values.get(e.id);
        return value ? [value] : [];
      });
      const byPort: Record<string, Artifact[]> = {};
      for (const e of incoming) {
        const value = values.get(e.id);
        if (value) (byPort[e.to.port] ??= []).push(value);
      }
      const outgoing = graph.connections.filter((e) => e.from.node === node.id);
      const transfers: Transfer[] = [];
      const send = (edge: (typeof outgoing)[number], value: Artifact) => {
        values.set(edge.id, value);
        transfers.push({
          edge: edge.id,
          from: edge.from.node,
          to: edge.to.node,
          description: describe(lab, value, value.type === 'data' ? value.material : value.type),
          artifact: value,
        });
      };
      try {
        const message = lab.strategies[node.kind]({
          lab,
          node,
          graph,
          inputs,
          byPort,
          observe: (tag) => observations.add(tag),
          report: (next) => {
            metrics = next;
          },
          emit: (artifact, portId) => {
            const material = artifact.type === 'data' ? artifact.material : artifact.type;
            const ports = node.ports.filter(
              (p) =>
                p.direction === 'out' && p.material === material && (!portId || p.id === portId),
            );
            if (!ports.length) throw new Error(lab.materials[material] + ' 출력 포트가 없습니다.');
            for (const e of outgoing)
              if (ports.some((p) => p.id === e.from.port)) send(e, artifact);
          },
          distribute: (batch) => {
            const routes = [...new Map(outgoing.map((e) => [e.to.node, e])).values()];
            const groups = routes.map((): Request[] => []);
            batch.forEach((request, i) => groups[i % routes.length]?.push(request));
            routes.forEach((e, i) => {
              if (groups[i].length) send(e, { type: 'request', requests: groups[i] });
            });
            return routes.length;
          },
          finish: (received) => {
            responses = received;
          },
        });
        steps.push({ node: node.id, status: 'success', message, transfers });
      } catch (error) {
        const blockedInput = incoming.some((e) =>
          steps.some((step) => step.node === e.from.node && step.status !== 'success'),
        );
        steps.push({
          node: node.id,
          status: node.kind !== 'end' && blockedInput ? 'blocked' : 'failed',
          message: (error as Error).message,
          transfers,
        });
      }
    }
    carry = new Map([...values].filter(([edge]) => loopEdges.has(edge)));
  }
  const nameOf = (id: string) => graph.entities.find((e) => e.id === id)?.name ?? id;
  if (lab.freeform) {
    const failed = steps.filter((step) => step.status === 'failed');
    const first = failed[0] ?? steps.find((step) => step.status !== 'success');
    return {
      id,
      steps,
      cycle,
      responses,
      metrics: loopEdges.size
        ? [{ label: '순환 반복', value: rounds + '회' }, ...metrics]
        : metrics,
      observations: [...observations],
      success: steps.length > 0 && !first,
      message: !steps.length
        ? '노드를 연결한 뒤 실행하세요. 연결이 없는 노드는 실행하지 않습니다.'
        : first
          ? nameOf(first.node) + ': ' + first.message
          : (loopEdges.size ? '순환 연결을 ' + rounds + '번 반복해 ' : '') +
            '연결된 노드 ' +
            steps.length +
            '개가 모두 실행됐습니다.',
    };
  }
  const last = steps.find((step) => step.node === end?.id);
  /** 도착이 입력을 받지 못했을 때, 상류에서 처음 실패한 노드를 찾는다. */
  const rootCause = (id: string, seen = new Set<string>()): RunStep | undefined => {
    if (seen.has(id)) return undefined;
    seen.add(id);
    for (const wire of graph.connections) {
      if (wire.to.node !== id) continue;
      const step = steps.find((s) => s.node === wire.from.node);
      if (!step || step.status === 'success') continue;
      if (step.status === 'failed') return step;
      const deeper = rootCause(step.node, seen);
      if (deeper) return deeper;
    }
  };
  const failing = last && last.status !== 'success' && end;
  const cause = failing ? rootCause(end.id) : undefined;
  const sideFailure =
    failing && !cause ? steps.find((s) => s.status === 'failed' && s.node !== end.id) : undefined;
  return {
    id,
    steps,
    cycle,
    responses,
    metrics,
    observations: [...observations],
    success: last?.status === 'success',
    message: cause
      ? nameOf(cause.node) + ': ' + cause.message
      : sideFailure
        ? last?.message + ' (' + nameOf(sideFailure.node) + ': ' + sideFailure.message + ')'
        : (last?.message ?? '도착 노드에서 결과를 확인하지 못했습니다.'),
  };
}
