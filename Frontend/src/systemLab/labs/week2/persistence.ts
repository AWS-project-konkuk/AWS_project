import {
  connection,
  makeEntity,
  manualConnectionIssue,
  signature,
  type Entity,
  type Graph,
  type LabConfig,
  type LabPersistence,
} from '../../lab';
import { clusterImages, defaultClusterPorts, defaultKubernetes, endpointId } from './rules';
import type { KubernetesSettings } from '../../lab';

const fail = () => {
  throw new Error('실습 저장 데이터를 읽을 수 없습니다.');
};
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
type LegacyKubernetes = KubernetesSettings & { imageInput?: boolean };

function validateEntity(item: Record<string, unknown>, kind: string): boolean {
  if (item.type === 'system' && item.ports !== undefined) {
    if (kind !== 'kubernetes' || !Array.isArray(item.ports)) return false;
    const ids = new Set<string>();
    for (const port of item.ports as unknown[]) {
      if (
        !record(port) ||
        typeof port.id !== 'string' ||
        !port.id ||
        ids.has(port.id) ||
        port.direction !== 'in' ||
        port.material !== 'image' ||
        typeof port.multiple !== 'boolean'
      )
        return false;
      ids.add(port.id);
    }
  }
  if (kind === 'kubernetes' && item.kubernetes !== undefined) {
    const cfg = item.kubernetes;
    if (
      !record(cfg) ||
      typeof cfg.imageId !== 'string' ||
      (cfg.imageInput !== undefined && typeof cfg.imageInput !== 'boolean') ||
      typeof cfg.workloadLabel !== 'string' ||
      typeof cfg.serviceSelector !== 'string' ||
      !number(cfg.replicas) ||
      !Number.isInteger(cfg.replicas) ||
      cfg.replicas < 1 ||
      cfg.replicas > 10 ||
      !number(cfg.servicePort) ||
      !Number.isInteger(cfg.servicePort) ||
      cfg.servicePort < 1 ||
      cfg.servicePort > 65535
    )
      return false;
  }
  if (kind === 'pod' && item.appLabel !== undefined && typeof item.appLabel !== 'string')
    return false;
  if (item.type === 'resource') {
    if (
      !['v1', 'v2'].includes(String(item.version)) ||
      typeof item.replicas !== 'number' ||
      !Number.isSafeInteger(item.replicas) ||
      item.replicas < 1 ||
      item.replicas > 10
    )
      return false;
  }
  return true;
}
function restoreFixed(entity: Entity, fixed: Entity): Entity | undefined {
  const start = fixed.type === 'resource' && fixed.kind === 'start' && entity.type === 'resource';
  const comparable = {
    ...entity,
    ...(start && { version: fixed.version }),
  };
  const expected =
    start && entity.type === 'resource' && entity.ports.length === 1
      ? {
          ...fixed,
          ports:
            fixed.type === 'resource'
              ? fixed.ports.filter((port) => port.material !== 'model')
              : [],
        }
      : fixed;
  if (
    signature({ entities: [comparable as Entity], connections: [] }) !==
    signature({ entities: [expected as Entity], connections: [] })
  )
    return undefined;
  if (start && entity.type === 'resource' && fixed.type === 'resource')
    return {
      ...fixed,
      position: entity.position,
      ports: entity.ports,
      version: entity.version,
    };
  return {
    ...fixed,
    position: fixed.kind === 'root' ? fixed.position : entity.position,
  } as Entity;
}
function normalizeEntity(entity: Entity): Entity {
  if (entity.type !== 'system' || entity.kind !== 'kubernetes') return entity;
  const legacy: LegacyKubernetes = entity.kubernetes ?? defaultKubernetes;
  const { imageInput, ...settings } = legacy;
  return {
    ...entity,
    ports: entity.ports ?? (imageInput === false ? [] : defaultClusterPorts()),
    ...(entity.kubernetes && { kubernetes: settings }),
  };
}

function migrateKubernetes(lab: LabConfig, graph: Graph): boolean {
  const legacy = graph.entities.some(
    (e) =>
      e.kind === 'deployment' || (e.kind === 'kubernetes' && e.type === 'system' && !e.kubernetes),
  );
  if (!legacy) return false;
  const original = [...graph.entities];
  const endpoints = new Map<string, string>();
  for (const cluster of original) {
    if (cluster.type !== 'system' || cluster.kind !== 'kubernetes' || cluster.kubernetes) continue;
    const local = original.filter((e) => e.parent === cluster.id);
    const deployment = local.find((e) => e.kind === 'deployment');
    const entries = local.filter((e) => e.kind === 'service');
    const entry =
      entries.find((e) =>
        graph.connections.some((wire) => wire.to.node === e.id && wire.from.node === 'start'),
      ) ?? entries[0];
    const id = endpointId(cluster.id);
    if (original.some((e) => e.id === id && (e.kind !== 'service' || e.parent !== cluster.id)))
      fail();
    entries.forEach((e) => endpoints.set(e.id, id));
    const images = clusterImages(graph, cluster);
    const wired = graph.connections.find(
      (edge) =>
        images.some((image) => image.id === edge.from.node) &&
        local.some((pod) => pod.kind === 'pod' && pod.id === edge.to.node),
    );
    const image =
      images.find((e) => e.id === wired?.from.node) ??
      images.find(
        (e) => e.version === (deployment?.type === 'resource' ? deployment.version : 'v1'),
      ) ??
      images[0];
    graph.entities = graph.entities.filter((e) => !entries.some((old) => old.id === e.id));
    graph.entities.push(
      makeEntity(lab, 'service', id, cluster.id, entry?.position ?? { x: 36, y: 215 }),
    );
    graph.entities = graph.entities.map((e) =>
      e.id === cluster.id
        ? {
            ...cluster,
            kubernetes: {
              ...defaultKubernetes,
              imageId: image?.id ?? '',
              replicas: deployment?.type === 'resource' ? deployment.replicas : 2,
            },
          }
        : e,
    );
  }
  graph.entities = graph.entities
    .filter((e) => e.kind !== 'deployment')
    .map((e) =>
      e.type === 'resource' && e.kind === 'pod'
        ? {
            ...e,
            ports: e.ports.filter((p) => p.material !== 'image' && p.material !== 'control'),
          }
        : e,
    );
  const wires = graph.connections;
  graph.connections = [];
  for (const edge of wires) {
    const next = connection(
      edge.from.node,
      edge.from.port,
      endpoints.get(edge.to.node) ?? edge.to.node,
      edge.to.port,
    );
    if (!manualConnectionIssue(lab, graph, next)) graph.connections.push(next);
  }
  for (const cluster of graph.entities) {
    if (cluster.type !== 'system' || !cluster.kubernetes?.imageId) continue;
    const image = graph.entities.find((e) => e.id === cluster.kubernetes?.imageId);
    const port =
      image?.type === 'resource'
        ? image.ports.find((p) => p.direction === 'out' && p.material === 'image')
        : undefined;
    const input = cluster.ports?.[0];
    if (!image || !port || !input) continue;
    const wire = connection(image.id, port.id, cluster.id, input.id);
    if (!manualConnectionIssue(lab, graph, wire)) graph.connections.push(wire);
  }
  return true;
}
function migrateClusterPorts(lab: LabConfig, graph: Graph): boolean {
  const endpoints = graph.entities.filter((e) => e.kind === 'service');
  if (!endpoints.some((e) => e.type === 'resource' && e.ports.some((p) => p.direction === 'out')))
    return false;
  const parents = new Map(endpoints.map((e) => [e.id, e.parent]));
  const wires = graph.connections;
  graph.entities = graph.entities.filter((e) => !parents.has(e.id));
  graph.connections = [];
  for (const edge of wires) {
    if (parents.has(edge.from.node)) continue;
    const next = connection(
      edge.from.node,
      edge.from.port,
      parents.get(edge.to.node) ?? edge.to.node,
      edge.to.port,
    );
    if (
      !manualConnectionIssue(lab, graph, next) ||
      (next.to.port === 'in-request' && parents.has(edge.to.node))
    )
      graph.connections.push(next);
  }
  for (const cluster of graph.entities) {
    if (cluster.type !== 'system' || !cluster.kubernetes?.imageId) continue;
    const image = graph.entities.find(
      (e) => e.id === cluster.kubernetes?.imageId && e.kind === 'image',
    );
    const output =
      image?.type === 'resource'
        ? image.ports.find((p) => p.direction === 'out' && p.material === 'image')
        : undefined;
    const input = cluster.ports?.[0];
    if (!image || !output || !input) continue;
    const next = connection(image.id, output.id, cluster.id, input.id);
    if (!manualConnectionIssue(lab, graph, next)) graph.connections.push(next);
  }
  return true;
}
function restoreServiceNodes(lab: LabConfig, graph: Graph): boolean {
  let changed = false;
  const redirects = new Map<string, string>();
  for (const cluster of graph.entities.filter((e) => e.kind === 'kubernetes')) {
    const request = graph.connections.find(
      (edge) => edge.to.node === cluster.id && edge.to.port === 'in-request',
    );
    const service = graph.entities.find((e) => e.kind === 'service' && e.parent === cluster.id);
    if (!service && (request || cluster.id === 'kubernetes')) {
      const id = endpointId(cluster.id);
      if (graph.entities.some((e) => e.id === id)) fail();
      graph.entities.push(makeEntity(lab, 'service', id, cluster.id, { x: 36, y: 215 }));
      changed = true;
    }
    if (request) redirects.set(cluster.id, service?.id ?? endpointId(cluster.id));
  }
  if (redirects.size) {
    graph.connections = graph.connections.map((edge) =>
      redirects.has(edge.to.node) && edge.to.port === 'in-request'
        ? connection(edge.from.node, edge.from.port, redirects.get(edge.to.node)!, 'in-request')
        : edge,
    );
    changed = true;
  }
  return changed;
}
function migrateModelSource(graph: Graph): boolean {
  const start = graph.entities.find(
    (entity) => entity.type === 'resource' && entity.kind === 'start',
  );
  if (start?.type !== 'resource') return false;
  const models = new Map(
    graph.entities.flatMap((entity) =>
      entity.type === 'resource' && entity.kind === 'model'
        ? [[entity.id, entity.version] as const]
        : [],
    ),
  );
  const connectedVersions = new Set(
    graph.connections.flatMap((edge) => {
      const version = models.get(edge.from.node);
      return version ? [version] : [];
    }),
  );
  const hasModelOutput = start.ports.some((port) => port.id === 'out-model');
  const version = hasModelOutput
    ? start.version
    : (connectedVersions.values().next().value ?? models.get('model') ?? start.version);
  graph.entities = graph.entities
    .filter((entity) => entity.kind !== 'model')
    .map((entity) =>
      entity.id === start.id && !hasModelOutput
        ? {
            ...start,
            version,
            ports: [
              ...start.ports,
              { id: 'out-model', material: 'model', direction: 'out', multiple: false },
            ],
          }
        : entity,
    );
  graph.connections = [
    ...new Map(
      graph.connections.map((edge) => {
        const next = models.has(edge.from.node)
          ? connection(start.id, 'out-model', edge.to.node, edge.to.port)
          : edge;
        return [next.id, next] as const;
      }),
    ).values(),
  ];
  return [...connectedVersions].every((oldVersion) => oldVersion === version);
}
export const week2Persistence: LabPersistence = {
  validateEntity,
  restoreFixed,
  normalizeEntity,
  allowsPort: (lab, kind, direction, material) =>
    (lab.portTypes[kind]?.[direction] as readonly string[] | undefined)?.includes(material) ||
    (kind === 'service' && direction === 'out' && material === 'request'),
  migrate(lab, graph) {
    const compatible = migrateModelSource(graph);
    const migrated = migrateKubernetes(lab, graph);
    const folded = migrateClusterPorts(lab, graph);
    const moved = restoreServiceNodes(lab, graph);
    return { compatible, migrated: migrated || folded || moved };
  },
};
