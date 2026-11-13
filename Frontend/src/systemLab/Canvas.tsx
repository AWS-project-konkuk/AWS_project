import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import {
  Box,
  Cable,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CirclePlay,
  Cpu,
  FileBox,
  FileCog,
  Layers,
  Maximize,
  Network,
  Package,
  Route,
  Send,
  Server,
} from 'lucide-react';
import { clusterPortHeight, groupMinimum, size, type Command } from './commands';
import { blockedBy, type RunResult } from './engine';
import {
  absolute,
  connection,
  manualConnectionIssue,
  serviceRoutes,
  descendants,
  findPort,
  hasRunState,
  materials,
  portLabel,
  resourceRoles,
  rootId,
  starterTasks,
  type Connection,
  type Entity,
  type Graph,
  type Kind,
  type Material,
  type Point,
} from './model';
import styles from './SystemLab.module.css';

const icons = {
  root: Layers,
  ec2: Server,
  docker: Package,
  kubernetes: Network,
  start: CirclePlay,
  end: CircleCheck,
  model: FileBox,
  image: Box,
  deployment: FileCog,
  service: Route,
  pod: Cpu,
  container: Package,
};
export function KindIcon({ kind, size = 16 }: { kind: Kind; size?: number }) {
  const Icon = icons[kind];
  return <Icon size={size} aria-hidden className={styles.kindIcon} data-kind-icon={kind} />;
}
const materialIcons = {
  request: Send,
  prediction: CircleCheck,
  model: FileBox,
  image: Box,
  control: Cable,
};
export interface MenuItem {
  label: string;
  ids: string[];
}
interface CanvasData extends Record<string, unknown> {
  entity: Entity;
  editable: boolean;
  status?: string;
  recommended: string[];
  connected: ReadonlySet<string>;
  collapsed?: boolean;
  count?: number;
  collapse: () => void;
  focus: () => void;
  minimum?: { width: number; height: number };
  resize: (width: number, height: number) => void;
  portMenu: (event: MouseEvent, port: string) => void;
}
type CanvasNode = Node<CanvasData, 'entity'>;

function EntityView({ id, data, selected }: NodeProps<CanvasNode>) {
  const { entity } = data;
  const update = useUpdateNodeInternals();
  const ports = entity.ports;
  const portSignature = ports?.map((p) => p.id + p.direction + p.material).join('|');
  useLayoutEffect(() => {
    update(id);
  }, [id, update, portSignature, data.collapsed]);
  const status =
    data.status ??
    (entity.kind === 'start'
      ? '출력 전용'
      : entity.kind === 'end'
        ? '입력 전용'
        : hasRunState(entity.kind)
          ? entity.enabled
            ? '실행 준비'
            : '정지'
          : undefined);
  if (entity.type === 'system')
    return (
      <section
        className={styles.area}
        data-kind={entity.kind}
        data-status={status}
        data-collapsed={data.collapsed}
        data-selected={selected}
        data-testid={'system-' + id}
      >
        <div className={styles.areaHeader}>
          <KindIcon kind={entity.kind} size={18} />
          <strong title={entity.name}>{entity.name}</strong>
          <span className={styles.state}>{status}</span>
          <button
            type="button"
            className="nodrag"
            aria-label={entity.name + (data.collapsed ? ' 펼치기' : ' 접기')}
            onClick={(event) => {
              event.stopPropagation();
              data.collapse();
            }}
          >
            {data.collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            type="button"
            className="nodrag"
            aria-label={entity.name + ' 집중 보기'}
            onClick={(event) => {
              event.stopPropagation();
              data.focus();
            }}
          >
            <Maximize size={13} />
          </button>
        </div>
        {data.collapsed && <span className={styles.areaSummary}>숨겨진 항목 {data.count}개</span>}
        <Handle
          type="target"
          position={Position.Left}
          id="summary-in"
          isConnectable={false}
          className={styles.proxy}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="summary-out"
          isConnectable={false}
          className={styles.proxy}
        />
        {ports && (
          <div className={styles.clusterPorts}>
            {ports.map((port) => {
              const label = portLabel(ports, port) + ' 입력';
              const Icon = materialIcons[port.material];
              return (
                <div
                  key={port.id}
                  className={styles.clusterPort}
                  data-connected={data.connected.has(port.id)}
                >
                  <Handle
                    id={port.id}
                    type="target"
                    position={Position.Left}
                    isConnectable={data.editable}
                    className={styles.handle}
                    data-testid={'port-' + id + '-' + port.id}
                    aria-label={entity.name + ' ' + label}
                    onContextMenu={(event) => data.portMenu(event, port.id)}
                  />
                  <Icon size={12} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
        {selected && data.editable && !data.collapsed && <ResizeGrip entity={entity} data={data} />}
      </section>
    );
  return (
    <article
      className={styles.node}
      data-kind={entity.kind}
      data-selected={selected}
      data-status={status}
      data-testid={'node-' + id}
    >
      <header>
        <KindIcon kind={entity.kind} size={17} />
        <strong title={entity.name}>{entity.name}</strong>
        {(status || resourceRoles[entity.kind]) && (
          <small>{status ?? resourceRoles[entity.kind]}</small>
        )}
      </header>
      {entity.kind === 'service' && (
        <Handle
          id="service-route"
          type="source"
          position={Position.Right}
          isConnectable={false}
          className={styles.routeAnchor}
        />
      )}
      <div className={styles.ports}>
        {(['in', 'out'] as const).map((direction) => (
          <div key={direction}>
            {entity.ports
              .filter((p) => p.direction === direction)
              .map((port) => {
                const Icon = materialIcons[port.material];
                const label = portLabel(entity.ports, port);
                return (
                  <div
                    key={port.id}
                    className={styles.portRow}
                    data-direction={direction}
                    data-material={port.material}
                    data-connected={data.connected.has(port.id)}
                    data-recommended={data.recommended.includes(port.id)}
                  >
                    <Handle
                      id={port.id}
                      type={direction === 'in' ? 'target' : 'source'}
                      position={direction === 'in' ? Position.Left : Position.Right}
                      isConnectable={
                        data.editable &&
                        !(entity.kind === 'service' && direction === 'out') &&
                        !(
                          entity.kind === 'pod' &&
                          port.material === 'request' &&
                          direction === 'in'
                        )
                      }
                      className={styles.handle}
                      data-testid={'port-' + id + '-' + port.id}
                      aria-label={
                        entity.name + ' ' + label + (direction === 'in' ? ' 입력' : ' 출력')
                      }
                      onContextMenu={(event) => data.portMenu(event, port.id)}
                    />
                    <Icon size={12} aria-hidden />
                    <span>{label}</span>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </article>
  );
}
function ResizeGrip({
  entity,
  data,
}: {
  entity: Extract<Entity, { type: 'system' }>;
  data: CanvasData;
}) {
  const { getZoom } = useReactFlow();
  const start = useRef<Point | null>(null);
  const preview = useRef<HTMLSpanElement>(null);
  const resize = (x: number, y: number, commit: boolean) => {
    const origin = start.current;
    if (!origin) return;
    const zoom = getZoom();
    const width = Math.max(data.minimum?.width ?? 220, entity.width + (x - origin.x) / zoom);
    const height = Math.max(data.minimum?.height ?? 110, entity.height + (y - origin.y) / zoom);
    if (commit) data.resize(width, height);
    else if (preview.current) {
      preview.current.hidden = false;
      preview.current.style.width = width + 'px';
      preview.current.style.height = height + 'px';
    }
  };
  const clear = () => {
    start.current = null;
    if (preview.current) preview.current.hidden = true;
  };
  return (
    <>
      <span
        ref={preview}
        className={styles.resizePreview}
        data-testid={'resize-preview-' + entity.id}
        hidden
        aria-hidden="true"
      />
      <button
        type="button"
        className={styles.resize + ' nodrag nopan'}
        data-testid={'resize-' + entity.id}
        aria-label={entity.name + ' 영역 크기 조절'}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => resize(e.clientX, e.clientY, false)}
        onPointerUp={(e) => {
          resize(e.clientX, e.clientY, true);
          clear();
        }}
        onPointerCancel={clear}
        onLostPointerCapture={clear}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          const changes: Partial<Record<string, [number, number]>> = {
            ArrowRight: [24, 0],
            ArrowLeft: [-24, 0],
            ArrowDown: [0, 24],
            ArrowUp: [0, -24],
          };
          const change = changes[e.key];
          if (!change) return;
          e.preventDefault();
          e.stopPropagation();
          data.resize(entity.width + change[0], entity.height + change[1]);
        }}
      />
    </>
  );
}
const nodeTypes = { entity: EntityView };
const tones: Record<Material, string> = {
  request: 'var(--lab-request)',
  prediction: 'var(--lab-prediction)',
  model: 'var(--lab-model)',
  image: 'var(--lab-image)',
  control: 'var(--lab-control)',
};

interface Props {
  graph: Graph;
  selected: string;
  select: (id: string) => void;
  dispatch: (command: Command) => boolean;
  editable: boolean;
  run: RunResult | null;
  cursor: number;
  onMenu: (event: MouseEvent, items: MenuItem[]) => void;
  clearMenu: () => void;
  selectedEdge: string;
  selectEdge: (id: string) => void;
}
export function Canvas({
  graph,
  selected,
  select,
  dispatch,
  editable,
  run,
  cursor,
  onMenu,
  clearMenu,
  selectedEdge,
  selectEdge,
}: Props) {
  const flow = useReactFlow<CanvasNode>();
  const element = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState<string[]>([]);
  const dragging = useRef(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const entityMap = new Map(graph.entities.map((e) => [e.id, e]));
  function proxy(id: string) {
    const path: string[] = [];
    let entity = entityMap.get(id);
    while (entity && entity.id !== rootId) {
      path.unshift(entity.id);
      entity = entityMap.get(entity.parent);
    }
    return path.find((p) => folded.includes(p)) ?? id;
  }
  const visible = graph.entities.filter((e) => e.id !== rootId && proxy(e.id) === e.id);
  const fit = (id?: string) => {
    const ids = id ? descendants(graph, id) : undefined;
    void flow.fitView({
      nodes: ids ? [...ids].map((node) => ({ id: node })) : undefined,
      padding: 0.12,
      minZoom: 0.18,
      maxZoom: id ? 1.25 : 1,
    });
  };
  const fitInitial = useRef(() => {
    void flow.fitView({ padding: 0.14, minZoom: 0.12, maxZoom: 1 });
  });
  useEffect(() => {
    if (!element.current) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        frame = requestAnimationFrame(fitInitial.current);
      }
    });
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  const nextTask = starterTasks.find((task) => !manualConnectionIssue(graph, task));
  const recommended = nextTask ? [nextTask.from, nextTask.to] : [];
  const shownSteps = run?.steps.slice(0, cursor) ?? [];
  const active = editable ? undefined : run?.steps[cursor];
  const byNode = new Map(shownSteps.map((step) => [step.node, step]));
  const transfers = new Set(shownSteps.flatMap((step) => step.transfers.map((t) => t.edge)));
  const generated = serviceRoutes(graph);
  const derived = new Set(generated.map((edge) => edge.id));
  const connections = [...graph.connections, ...generated];
  const connected = new Map<string, Set<string>>();
  for (const { from, to } of connections) {
    for (const { node, port } of [from, to]) {
      const ports = connected.get(node) ?? new Set<string>();
      ports.add(port);
      connected.set(node, ports);
    }
  }
  const nodeList: CanvasNode[] = [];
  const append = (parent: string) => {
    visible
      .filter((e) => e.parent === parent)
      .forEach((entity) => {
        const collapsed = folded.includes(entity.id);
        const step = byNode.get(entity.id);
        const status = step
          ? { success: '성공', failed: '실패', blocked: '차단' }[step.status]
          : active?.node === entity.id
            ? '처리 중'
            : entity.enabled && blockedBy(graph, entity.id)
              ? '차단'
              : undefined;
        const groupSize =
          entity.type === 'system'
            ? {
                width: Math.round(collapsed ? Math.min(280, entity.width) : entity.width),
                height: Math.round(
                  collapsed
                    ? Math.max(78, clusterPortHeight(entity.ports?.length ?? 0))
                    : entity.height,
                ),
              }
            : undefined;
        nodeList.push({
          id: entity.id,
          type: 'entity',
          position: entity.position,
          parentId: parent === rootId ? undefined : parent,
          ...(groupSize
            ? { ...groupSize, measured: groupSize }
            : { style: { width: size(entity).width } }),
          dragHandle: entity.type === 'system' ? '.' + styles.areaHeader : undefined,
          draggable: editable,
          deletable: false,
          selected: entity.id === selected,
          ariaLabel: entity.name,
          zIndex: entity.type === 'system' ? 0 : 2,
          data: {
            entity,
            editable,
            connected: connected.get(entity.id) ?? new Set<string>(),
            recommended: recommended.filter((p) => p.node === entity.id).map((p) => p.port),
            status,
            collapsed,
            count: descendants(graph, entity.id).size - 1,
            collapse: () =>
              setFolded((ids) =>
                ids.includes(entity.id)
                  ? ids.filter((id) => id !== entity.id)
                  : [...ids, entity.id],
              ),
            focus: () => {
              setFocusId(entity.id);
              fit(entity.id);
            },
            minimum: entity.type === 'system' ? groupMinimum(graph, entity.id) : undefined,
            resize: (width, height) => dispatch({ type: 'resize', id: entity.id, width, height }),
            portMenu: (event, port) => {
              const attached = graph.connections.filter((e) =>
                [e.from, e.to].some((p) => p.node === entity.id && p.port === port),
              );
              onMenu(event, [
                ...attached.map((e) => ({
                  label:
                    (entityMap.get(e.from.node === entity.id ? e.to.node : e.from.node)?.name ??
                      '') + ' 연결 삭제',
                  ids: [e.id],
                })),
                ...(attached.length > 1
                  ? [{ label: '전체 연결 해제', ids: attached.map((e) => e.id) }]
                  : []),
              ]);
            },
          },
        });
        append(entity.id);
      });
  };
  append(rootId);
  // React Flow owns transient drag positions. Reconcile the canvas after committed edits.
  useLayoutEffect(() => {
    if (!dragging.current || !editable) flow.setNodes(nodeList);
  });
  const edgeLookup = new Map<string, Connection>();
  const summaries = new Map<
    string,
    {
      source: string;
      target: string;
      sourceHandle: string;
      targetHandle: string;
      count: number;
      cycle: boolean;
    }
  >();
  const edges: Edge[] = [];
  for (const e of connections) {
    const source = proxy(e.from.node),
      target = proxy(e.to.node);
    const sourceHandle = source === e.from.node ? e.from.port : 'summary-out';
    const targetHandle = target === e.to.node ? e.to.port : 'summary-in';
    if (source === target) continue;
    const cycle = run?.cycle.includes(e.id) ?? false;
    if (source !== e.from.node || target !== e.to.node) {
      const key = JSON.stringify([source, target, sourceHandle, targetHandle]);
      const old = summaries.get(key);
      summaries.set(key, {
        source,
        target,
        sourceHandle,
        targetHandle,
        count: (old?.count ?? 0) + 1,
        cycle: cycle || (old?.cycle ?? false),
      });
      continue;
    }
    const material = findPort(graph, e.from)?.material ?? 'request';
    const color = cycle ? 'var(--color-error)' : tones[material];
    edgeLookup.set(e.id, e);
    edges.push({
      id: e.id,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      interactionWidth: 16,
      selected: selectedEdge === e.id,
      deletable: false,
      reconnectable: false,
      zIndex: 4,
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
      style: {
        stroke: color,
        strokeDasharray: derived.has(e.id) ? '5 4' : undefined,
        strokeWidth: cycle || transfers.has(e.id) || selectedEdge === e.id ? 3 : 2.4,
      },
      animated: !!active && transfers.has(e.id),
      ariaLabel:
        entityMap.get(source)?.name +
        ' → ' +
        entityMap.get(target)?.name +
        ' ' +
        materials[material],
    });
  }
  for (const [id, summary] of summaries)
    edges.push({
      id: 'summary-' + id,
      source: summary.source,
      target: summary.target,
      sourceHandle: summary.sourceHandle,
      targetHandle: summary.targetHandle,
      type: 'smoothstep',
      label: '연결 ' + summary.count,
      selectable: false,
      deletable: false,
      zIndex: 4,
      style: {
        strokeDasharray: '5 5',
        stroke: summary.cycle ? 'var(--color-error)' : 'var(--color-muted)',
      },
      labelStyle: { fill: 'var(--color-ink)', fontSize: 13 },
      labelBgStyle: { fill: 'var(--color-paper)' },
    });
  return (
    <div ref={element} className={styles.canvas} data-testid="system-lab-canvas">
      <div className={styles.canvasTools}>
        <button
          type="button"
          onClick={() => {
            select(rootId);
            setFocusId(null);
            fit();
          }}
        >
          <Layers size={15} /> 전체 서비스
        </button>
        <select
          aria-label="캔버스에서 항목 찾기"
          value={selected}
          onChange={(event) => {
            const id = event.target.value;
            select(id);
            setFolded((previous) =>
              previous.filter((p) => p === id || !descendants(graph, p).has(id)),
            );
            setFocusId(id === rootId ? null : id);
            requestAnimationFrame(() => fit(id === rootId ? undefined : id));
          }}
        >
          <option value={rootId}>항목 찾기</option>
          {graph.entities
            .filter((e) => e.id !== rootId)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
        {focusId && <span className={styles.focusLabel}>{entityMap.get(focusId)?.name}</span>}
      </div>
      <ReactFlow<CanvasNode>
        defaultNodes={nodeList}
        edges={edges}
        nodeTypes={nodeTypes}
        minZoom={0.12}
        maxZoom={2}
        connectOnClick
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        nodesConnectable={editable}
        edgesReconnectable={false}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        zIndexMode="manual"
        onPaneClick={() => {
          clearMenu();
          selectEdge('');
        }}
        onNodeClick={(_, node) => {
          clearMenu();
          selectEdge('');
          select(node.id);
        }}
        onEdgesChange={(changes) => {
          const selected = changes.find((change) => change.type === 'select' && change.selected);
          if (selected?.type === 'select' && edgeLookup.has(selected.id)) selectEdge(selected.id);
        }}
        onEdgeClick={(_, edge) => {
          clearMenu();
          if (edgeLookup.has(edge.id)) selectEdge(edge.id);
        }}
        onEdgeContextMenu={(event, edge) => {
          if (edgeLookup.has(edge.id) && !derived.has(edge.id))
            onMenu(event, [{ label: '연결 삭제', ids: [edge.id] }]);
        }}
        isValidConnection={(e) =>
          !!e.sourceHandle &&
          !!e.targetHandle &&
          !manualConnectionIssue(
            graph,
            connection(e.source, e.sourceHandle, e.target, e.targetHandle),
          )
        }
        onConnect={(e) => {
          if (editable && e.sourceHandle && e.targetHandle)
            dispatch({
              type: 'connect',
              edge: connection(e.source, e.sourceHandle, e.target, e.targetHandle),
            });
        }}
        onNodeDragStart={() => {
          dragging.current = true;
        }}
        onNodesChange={(changes) => {
          if (dragging.current || !editable) return;
          for (const change of changes) {
            if (change.type === 'position' && change.dragging === false && change.position)
              dispatch({ type: 'move', id: change.id, position: change.position });
          }
        }}
        onNodeDragStop={(_, node) => {
          dragging.current = false;
          if (!editable) {
            flow.setNodes(nodeList);
            return;
          }
          const entity = entityMap.get(node.id);
          if (!entity) return;
          if (entity.kind === 'start' || entity.kind === 'end') {
            if (!dispatch({ type: 'move', id: entity.id, position: node.position }))
              flow.setNodes(nodeList);
            return;
          }
          const parent = entityMap.get(entity.parent);
          const point = parent ? absolute(graph, parent) : { x: 0, y: 0 };
          const x = point.x + node.position.x,
            y = point.y + node.position.y;
          const inner = descendants(graph, node.id);
          const group = [...visible].reverse().find((e) => {
            if (e.type !== 'system' || folded.includes(e.id) || inner.has(e.id)) return false;
            const p = absolute(graph, e);
            return (
              x + 70 >= p.x && y + 25 >= p.y && x + 70 <= p.x + e.width && y + 25 <= p.y + e.height
            );
          });
          const newParent = group?.id ?? rootId;
          const destination = entityMap.get(newParent);
          const offset = destination ? absolute(graph, destination) : { x: 0, y: 0 };
          const moved = dispatch({
            type: 'move',
            id: node.id,
            parent: newParent,
            position: { x: x - offset.x, y: y - offset.y },
          });
          if (!moved) flow.setNodes(nodeList);
        }}
        ariaLabelConfig={{
          'controls.zoomIn.ariaLabel': '확대',
          'controls.zoomOut.ariaLabel': '축소',
          'controls.fitView.ariaLabel': '전체 보기',
        }}
      >
        <Background gap={22} size={1} color="var(--color-rule-2)" />
        <Controls
          showInteractive={false}
          onFitView={() => {
            setFocusId(null);
            fit();
          }}
          aria-label="캔버스 확대·축소"
        />
      </ReactFlow>
    </div>
  );
}
