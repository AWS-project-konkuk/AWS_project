import {
  definition,
  appLabel,
  makeEntity,
  serviceRoutes,
  hasRunState,
  materials,
  rootId,
  type Graph,
  type Material,
  type ResourceEntity,
  type ResourceKind,
  type Version,
} from './model';

type Request = { id: number };
type Response = {
  id: number;
  pod: string;
  model: Version;
  image: Version;
  deployment: string;
  label: string;
};
export type Artifact =
  | { type: 'request'; requests: Request[] }
  | { type: 'prediction'; responses: Response[] }
  | { type: 'model' | 'image' | 'control'; version: Version; source: string };
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
}
export function blockedBy(graph: Graph, id: string): string | undefined {
  const node = graph.entities.find((e) => e.id === id);
  if (!node || node.id === rootId) return;
  if (hasRunState(node.kind) && !node.enabled) return node.name;
  return blockedBy(graph, node.parent);
}
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
function required(inputs: Artifact[], type: 'model' | 'image' | 'control') {
  const values = inputs.filter((a) => a.type === type) as { version: Version; source: string }[];
  if (!values.length) throw new Error(materials[type] + ' 입력이 없습니다.');
  if (
    values.some(
      (v) =>
        v.version !== values[0].version || (type === 'control' && v.source !== values[0].source),
    )
  )
    throw new Error(materials[type] + ' 입력의 설정이 서로 다릅니다.');
  return values[0];
}
function requests(inputs: Artifact[]) {
  const list = inputs.flatMap((a) => (a.type === 'request' ? a.requests : []));
  if (!list.length) throw new Error('요청이 도착하지 않았습니다.');
  if (new Set(list.map((a) => a.id)).size !== list.length)
    throw new Error('같은 요청이 여러 번 도착했습니다.');
  return list;
}
interface StepContext {
  node: ResourceEntity;
  graph: Graph;
  inputs: Artifact[];
  emit: (artifact: Artifact) => void;
  distribute: (requests: Request[]) => number;
  finish: (responses: Response[]) => void;
}
type Strategy = (ctx: StepContext) => string;
function deploymentImage(graph: Graph, pod: ResourceEntity) {
  const cluster = graph.entities.find((e) => e.id === pod.parent);
  if (cluster?.type !== 'system' || !cluster.kubernetes)
    throw new Error('Kubernetes 배포 설정이 없습니다.');
  const settings = cluster.kubernetes;
  const pods = graph.entities.filter(
    (e) =>
      e.type === 'resource' &&
      e.kind === 'pod' &&
      e.parent === cluster.id &&
      appLabel(e) === settings.workloadLabel,
  );
  if (pods.length !== settings.replicas)
    throw new Error('배포 대상 Pod ' + pods.length + '개 · 원하는 수 ' + settings.replicas + '개');
  if (appLabel(pod) !== settings.workloadLabel)
    throw new Error('Pod의 라벨이 Deployment의 라벨과 다릅니다.');
  const source = graph.connections.find(
    (edge) => edge.to.node === cluster.id && edge.to.port === 'in-image',
  );
  const image = graph.entities.find(
    (e) => e.type === 'resource' && e.kind === 'image' && e.id === source?.from.node,
  );
  if (image?.type !== 'resource')
    throw new Error('Kubernetes의 이미지 입력에 컨테이너 이미지를 연결하세요.');
  const blocked = blockedBy(graph, image.id);
  if (blocked) throw new Error(blocked + ' 정지 상태 · 이미지를 사용할 수 없습니다.');
  return { version: image.version, source: image.id };
}
const infer: Strategy = ({ node, graph, inputs, emit }) => {
  const model = required(inputs, 'model');
  const image = node.kind === 'pod' ? deploymentImage(graph, node) : required(inputs, 'image');
  const batch = requests(inputs);
  emit({
    type: 'prediction',
    responses: batch.map(({ id }) => ({
      id,
      pod: node.id,
      model: model.version,
      image: image.version,
      deployment: node.kind === 'pod' ? node.parent : '',
      label: id % 2 ? '긍정' : '부정',
    })),
  });
  return batch.length + '건 예측 · 모델 ' + model.version + ' · 이미지 ' + image.version;
};
const strategies: Record<ResourceKind, Strategy> = {
  start: ({ node, emit }) => {
    emit({ type: 'request', requests: definition.requestIds.map((id) => ({ id })) });
    emit({ type: 'model', version: node.version, source: node.id });
    return '검증된 모델 ' + node.version + '과 리뷰 요청 10건을 보냈습니다.';
  },
  model: ({ node, emit }) => {
    emit({ type: 'model', version: node.version, source: node.id });
    return '검증된 모델 ' + node.version + '을 제공했습니다.';
  },
  image: ({ node, emit }) => {
    emit({ type: 'image', version: node.version, source: node.id });
    return '서빙 이미지 ' + node.version + '을 제공했습니다.';
  },
  deployment: () => {
    throw new Error('Kubernetes에서 배포 설정을 확인하세요.');
  },
  service: ({ node, graph, inputs, distribute }) => {
    const batch = requests(inputs);
    const count = distribute(batch);
    if (!count) throw new Error('Service 대상 라벨에 맞는 요청 입력이 없습니다.');
    const cluster = graph.entities.find((e) => e.id === node.id);
    const port = cluster?.type === 'system' ? cluster.kubernetes?.servicePort : undefined;
    return (
      (port ? '포트 ' + port + ' · ' : '') +
      '요청 ' +
      batch.length +
      '건을 ' +
      count +
      '개 경로로 나눴습니다.'
    );
  },
  pod: infer,
  container: infer,
  end: ({ inputs, finish }) => {
    const responses = inputs.flatMap((a) => (a.type === 'prediction' ? a.responses : []));
    finish(responses);
    const ids = new Set(responses.map((r) => r.id));
    if (ids.size !== responses.length) throw new Error('중복 응답이 도착했습니다.');
    if (responses.some((r) => !definition.requestIds.includes(r.id)))
      throw new Error('알 수 없는 요청의 응답이 있습니다.');
    if (ids.size !== definition.requestIds.length)
      throw new Error('응답 ' + ids.size + ' / 10건 · 연결과 Pod 상태를 확인하세요.');
    const pods = new Set(responses.map((r) => r.pod));
    if (pods.size < definition.requiredPods || responses.some((r) => !r.deployment))
      throw new Error('Deployment가 관리하는 서로 다른 Pod가 두 개 이상 요청을 처리해야 합니다.');
    const first = responses[0];
    if (
      responses.some(
        (r) =>
          r.model !== first.model || r.image !== first.image || r.deployment !== first.deployment,
      )
    )
      throw new Error('두 Pod에 같은 모델·이미지·Deployment를 연결하세요.');
    return 'Pod ' + pods.size + '개의 응답 10건이 중복 없이 도착했습니다.';
  },
};
function describe(a: Artifact, material: Material) {
  if (a.type === 'request') return materials[material] + ' ' + a.requests.length + '건';
  if (a.type === 'prediction') return materials[material] + ' ' + a.responses.length + '건';
  return (a.type === 'model' ? 'model.pkl · ' : materials[material] + ' ') + a.version;
}

export function runLab(graph: Graph, id: string): RunResult {
  graph = { ...graph, connections: [...graph.connections, ...serviceRoutes(graph)] };
  const cycle = cycleEdges(graph);
  if (cycle.length)
    return {
      id,
      success: false,
      steps: [],
      cycle,
      responses: [],
      message: '순환 연결이 있습니다. 강조된 선을 확인하세요.',
    };
  const end = graph.entities.find((e) => e.kind === 'end');
  const start = graph.entities.find((e) => e.kind === 'start');
  const entries = graph.entities.filter(
    (e) =>
      e.kind === 'kubernetes' &&
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
  const pending = graph.entities.flatMap((e): ResourceEntity[] => {
    if (!relevant.has(e.id)) return [];
    if (e.type === 'resource') return [e];
    if (e.kind !== 'kubernetes') return [];
    const endpoint = makeEntity('service', e.id, e.parent, e.position);
    return endpoint.type === 'resource' ? [{ ...endpoint, name: e.name }] : [];
  });
  const steps: RunStep[] = [];
  const done = new Set<string>();
  const values = new Map<string, Artifact>();
  let responses: Response[] = [];
  while (pending.length) {
    const index = pending.findIndex((e) =>
      graph.connections.every((wire) => wire.to.node !== e.id || done.has(wire.from.node)),
    );
    if (index === -1) break;
    const [node] = pending.splice(index, 1);
    done.add(node.id);
    const blocked = blockedBy(graph, node.id);
    if (blocked) {
      steps.push({
        node: node.id,
        status: 'blocked',
        message: blocked + ' 정지 상태',
        transfers: [],
      });
      continue;
    }
    const incoming = graph.connections.filter((e) => e.to.node === node.id);
    const inputs = incoming.flatMap((e) => {
      const value = values.get(e.id);
      return value ? [value] : [];
    });
    const outgoing = graph.connections.filter((e) => e.from.node === node.id);
    const transfers: Transfer[] = [];
    const send = (edge: (typeof outgoing)[number], value: Artifact) => {
      values.set(edge.id, value);
      transfers.push({
        edge: edge.id,
        from: edge.from.node,
        to: edge.to.node,
        description: describe(value, value.type),
        artifact: value,
      });
    };
    try {
      const message = strategies[node.kind]({
        node,
        graph,
        inputs,
        emit: (artifact) => {
          const ports = node.ports.filter(
            (p) => p.direction === 'out' && p.material === artifact.type,
          );
          if (!ports.length) throw new Error(materials[artifact.type] + ' 출력 포트가 없습니다.');
          for (const e of outgoing) if (ports.some((p) => p.id === e.from.port)) send(e, artifact);
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
  const last = steps.find((step) => step.node === end?.id);
  return {
    id,
    steps,
    cycle,
    responses,
    success: last?.status === 'success',
    message: last?.message ?? '도착 노드에서 결과를 확인하지 못했습니다.',
  };
}
