import {
  absolute,
  manualConnectionIssue,
  definition,
  descendants,
  hasRunState,
  labels,
  makeEntity,
  portTypes,
  protectedKind,
  requiredLabEntities,
  rootId,
  tools,
  type Connection,
  type Direction,
  type Entity,
  type Graph,
  type Kind,
  type KubernetesSettings,
  type Material,
  type Point,
  type PortSpec,
  type Version,
} from './model';

export type Command =
  | { type: 'add'; parent: string; kind: Kind; id: string }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; position: Point; parent?: string }
  | { type: 'compact'; id: string }
  | { type: 'resize'; id: string; width: number; height: number }
  | { type: 'cluster'; id: string; patch: Partial<KubernetesSettings> }
  | { type: 'pod-label'; id: string; value: string }
  | { type: 'settings'; id: string; name?: string; version?: Version; replicas?: number }
  | { type: 'toggle'; id: string; enabled: boolean; children?: boolean }
  | { type: 'connect'; edge: Connection }
  | { type: 'disconnect'; ids: string[] }
  | { type: 'port-add'; id: string; port: string; direction: Direction; material: Material }
  | {
      type: 'port-change';
      id: string;
      port: string;
      changes: Partial<Pick<PortSpec, 'material' | 'multiple'>>;
      keep?: string;
    }
  | { type: 'port-remove'; id: string; port: string }
  | { type: 'restore' };

export function applyCommand(graph: Graph, cmd: Command): Graph {
  const change = (id: string, fn: (e: Entity) => Entity) => ({
    ...graph,
    entities: graph.entities.map((e) => (e.id === id ? fn(e) : e)),
  });
  if (cmd.type === 'restore') return definition.initial();
  if (cmd.type === 'connect') {
    const error = manualConnectionIssue(graph, cmd.edge);
    if (error) throw new Error(error);
    return { ...graph, connections: [...graph.connections, cmd.edge] };
  }
  if (cmd.type === 'disconnect')
    return { ...graph, connections: graph.connections.filter((e) => !cmd.ids.includes(e.id)) };
  if (cmd.type === 'add') {
    const parent = graph.entities.find((e) => e.id === cmd.parent);
    if (
      parent?.type !== 'system' ||
      !tools[parent.kind].includes(cmd.kind) ||
      graph.entities.some((e) => e.id === cmd.id)
    )
      throw new Error('이 시스템에 추가할 수 없는 항목입니다.');
    const children = graph.entities.filter((e) => e.parent === parent.id);
    const index = children.length;
    const item = makeEntity(cmd.kind, cmd.id, parent.id, {
      x: parent.id === rootId ? 230 + index * 80 : 24,
      y: parent.id === rootId ? 690 : 52 + index * 164,
    });
    let suffix = 1;
    while (children.some((e) => e.name === labels[item.kind] + ' ' + suffix)) suffix++;
    item.name = labels[item.kind] + ' ' + suffix;
    return fitAncestors({ ...graph, entities: [...graph.entities, item] }, item.id);
  }
  const item = graph.entities.find((e) => e.id === cmd.id);
  if (!item) return graph;
  if (item.kind === 'service' && cmd.type !== 'move')
    throw new Error('접속점은 Kubernetes 설정에서 관리합니다.');
  if (cmd.type === 'remove' && requiredLabEntities(graph.entities).has(item.id)) {
    throw new Error('실습에 필요한 항목은 삭제할 수 없습니다.');
  }
  if (cmd.type === 'move' && (item.kind === 'start' || item.kind === 'end')) {
    if (cmd.parent !== undefined && cmd.parent !== rootId) {
      throw new Error('출발·도착 노드는 전체 서비스에 속해야 합니다.');
    }
    return change(item.id, (e) => ({ ...e, position: cmd.position }));
  }
  if (
    protectedKind(item.kind) &&
    !(cmd.type === 'toggle' && item.kind === 'root' && cmd.children)
  ) {
    throw new Error('고정 항목은 변경할 수 없습니다.');
  }
  switch (cmd.type) {
    case 'remove': {
      const ids = descendants(graph, item.id);
      return {
        entities: graph.entities.filter((e) => !ids.has(e.id)),
        connections: graph.connections.filter((e) => !ids.has(e.from.node) && !ids.has(e.to.node)),
      };
    }
    case 'move': {
      const parent = graph.entities.find((e) => e.id === (cmd.parent ?? item.parent));
      if (
        parent?.type !== 'system' ||
        (!tools[parent.kind].includes(item.kind) &&
          !(item.kind === 'service' && parent.id === item.parent)) ||
        descendants(graph, item.id).has(parent.id)
      )
        throw new Error('이 영역으로 옮길 수 없습니다.');
      const position =
        parent.id === rootId
          ? cmd.position
          : { x: Math.max(18, cmd.position.x), y: Math.max(44, cmd.position.y) };
      return fitAncestors(
        change(item.id, (e) => ({ ...e, parent: parent.id, position })),
        item.id,
      );
    }
    case 'compact': {
      if (item.type !== 'system') return graph;
      const children = graph.entities.filter((e) => e.parent === item.id);
      const offset = children.length
        ? {
            x: Math.min(...children.map((e) => e.position.x)) - 18,
            y: Math.min(...children.map((e) => e.position.y)) - 44,
          }
        : { x: 0, y: 0 };
      const adjusted = {
        ...graph,
        entities: graph.entities.map((e) => {
          if (e.id === item.id)
            return { ...e, position: { x: e.position.x + offset.x, y: e.position.y + offset.y } };
          if (e.parent === item.id)
            return { ...e, position: { x: e.position.x - offset.x, y: e.position.y - offset.y } };
          return e;
        }),
      };
      const minimum = groupMinimum(adjusted, item.id);
      return fitAncestors(
        {
          ...adjusted,
          entities: adjusted.entities.map((e) => (e.id === item.id ? { ...e, ...minimum } : e)),
        },
        item.id,
      );
    }
    case 'resize': {
      if (item.type !== 'system') return graph;
      const minimum = groupMinimum(graph, item.id);
      return fitAncestors(
        change(item.id, () => ({
          ...item,
          width: Math.max(minimum.width, cmd.width),
          height: Math.max(minimum.height, cmd.height),
        })),
        item.id,
      );
    }
    case 'cluster': {
      if (item.type !== 'system' || !item.kubernetes) return graph;
      const settings = { ...item.kubernetes, ...cmd.patch };
      if (
        !Number.isInteger(settings.replicas) ||
        settings.replicas < 1 ||
        settings.replicas > 10 ||
        !Number.isInteger(settings.servicePort) ||
        settings.servicePort < 1 ||
        settings.servicePort > 65535 ||
        !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(settings.workloadLabel) ||
        (settings.serviceSelector !== '' &&
          !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(settings.serviceSelector))
      )
        throw new Error(
          '복제본은 1~10개, 포트는 1~65535, 라벨은 소문자·숫자·하이픈으로 입력하세요.',
        );
      return change(item.id, () => ({ ...item, kubernetes: settings }));
    }
    case 'pod-label': {
      if (item.type !== 'resource' || item.kind !== 'pod') return graph;
      if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(cmd.value))
        throw new Error('라벨은 소문자·숫자·하이픈으로 입력하세요.');
      return change(item.id, () => ({ ...item, appLabel: cmd.value }));
    }
    case 'settings': {
      const name = cmd.name?.trim();
      if (cmd.name !== undefined && (!name || name.length > 63))
        throw new Error('이름을 1~63자로 입력하세요.');
      if (
        cmd.replicas !== undefined &&
        (!Number.isSafeInteger(cmd.replicas) || cmd.replicas < 1 || cmd.replicas > 10)
      )
        throw new Error('Pod 수를 1~10개로 지정하세요.');
      return change(item.id, (e) => ({
        ...e,
        name: name ?? e.name,
        ...(e.type === 'resource' && {
          version: cmd.version ?? e.version,
          replicas: cmd.replicas ?? e.replicas,
        }),
      }));
    }
    case 'toggle': {
      if (item.kind !== 'root' && !hasRunState(item.kind)) {
        throw new Error('이 항목은 실행 상태를 따로 설정하지 않습니다.');
      }
      const ids =
        cmd.children && item.type === 'system' ? descendants(graph, item.id) : new Set([item.id]);
      return {
        ...graph,
        entities: graph.entities.map((e) =>
          ids.has(e.id) && hasRunState(e.kind) ? { ...e, enabled: cmd.enabled } : e,
        ),
      };
    }
    case 'port-add':
    case 'port-change':
    case 'port-remove': {
      if (item.type !== 'resource') return graph;
      const current = item.ports.find((p) => p.id === cmd.port);
      if (cmd.type !== 'port-add' && !current) return graph;
      if (cmd.type === 'port-add' && current) return graph;
      const material =
        cmd.type === 'port-add'
          ? cmd.material
          : cmd.type === 'port-change'
            ? cmd.changes.material
            : undefined;
      const direction = cmd.type === 'port-add' ? cmd.direction : current?.direction;
      if (
        material &&
        direction &&
        (!portTypes[item.kind][direction].includes(material) ||
          (item.kind === 'pod' && (material === 'image' || material === 'control')))
      )
        throw new Error('이 노드가 처리할 수 없는 타입입니다.');
      const attached = graph.connections.filter((edge) =>
        [edge.from, edge.to].some((p) => p.node === item.id && p.port === cmd.port),
      );
      const removeAll =
        cmd.type === 'port-remove' ||
        (material !== undefined && current !== undefined && material !== current.material);
      const single = cmd.type === 'port-change' && cmd.changes.multiple === false;
      if (single && attached.length > 1 && !attached.some((e) => e.id === cmd.keep))
        throw new Error('유지할 연결을 선택하세요.');
      const ports =
        cmd.type === 'port-add'
          ? [
              ...item.ports,
              { id: cmd.port, direction: cmd.direction, material: cmd.material, multiple: false },
            ]
          : cmd.type === 'port-remove'
            ? item.ports.filter((p) => p.id !== cmd.port)
            : item.ports.map((p) => (p.id === cmd.port ? { ...p, ...cmd.changes } : p));
      const removed = new Set(
        attached
          .filter((e) => removeAll || (single && attached.length > 1 && e.id !== cmd.keep))
          .map((e) => e.id),
      );
      return fitAncestors(
        {
          ...change(item.id, () => ({ ...item, ports })),
          connections: graph.connections.filter((e) => !removed.has(e.id)),
        },
        item.id,
      );
    }
  }
}

export function size(item: Entity) {
  if (item.type === 'system') return { width: item.width, height: item.height };
  const rows = Math.max(
    item.ports.filter((p) => p.direction === 'in').length,
    item.ports.filter((p) => p.direction === 'out').length,
  );
  return { width: 184, height: 44 + rows * 28 + 5 };
}
export function groupMinimum(graph: Graph, id: string) {
  const children = graph.entities.filter((item) => item.parent === id);
  return {
    width: Math.max(220, ...children.map((item) => item.position.x + size(item).width + 18)),
    height: Math.max(110, ...children.map((item) => item.position.y + size(item).height + 18)),
  };
}
function fitAncestors(graph: Graph, childId: string): Graph {
  const child = graph.entities.find((e) => e.id === childId);
  const parent = graph.entities.find((e) => e.id === child?.parent);
  if (!child || parent?.type !== 'system' || parent.id === rootId) return graph;
  const dim = size(child);
  const next = {
    ...parent,
    width: Math.max(parent.width, child.position.x + dim.width + 18),
    height: Math.max(parent.height, child.position.y + dim.height + 18),
  };
  return fitAncestors(
    { ...graph, entities: graph.entities.map((e) => (e.id === parent.id ? next : e)) },
    parent.id,
  );
}
export function reparent(graph: Graph, entity: Entity, parent: Entity): Command {
  const from = absolute(graph, entity);
  const to = absolute(graph, parent);
  return {
    type: 'move',
    id: entity.id,
    parent: parent.id,
    position: { x: from.x - to.x, y: from.y - to.y },
  };
}
