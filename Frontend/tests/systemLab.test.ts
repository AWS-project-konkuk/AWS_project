import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import {
  absolute,
  connection,
  makeEntity,
  definition,
  signature,
  starterTasks,
  type Graph,
} from '../src/systemLab/model';
import { parseSaved, useSystemLab } from '../src/systemLab/store';

const model = connection('start', 'out-model', 'pod-b', 'in-model');
function ready() {
  let graph = applyCommand(definition.initial(), {
    type: 'toggle',
    id: 'root',
    enabled: true,
    children: true,
  });
  for (const edge of starterTasks) graph = applyCommand(graph, { type: 'connect', edge });
  return graph;
}
describe('Docker·Kubernetes 시범 실행', () => {
  it('요청 10건을 두 Pod로 분배하고 새 노드 ID로 바꿔도 판정한다', () => {
    const graph = ready();
    const rebuilt: Graph = {
      entities: graph.entities.map((e) =>
        e.kind === 'pod' ? { ...e, id: 'new-' + e.id, name: '새 ' + e.name } : e,
      ),
      connections: graph.connections.map((e) =>
        connection(
          e.from.node.startsWith('pod-') ? 'new-' + e.from.node : e.from.node,
          e.from.port,
          e.to.node.startsWith('pod-') ? 'new-' + e.to.node : e.to.node,
          e.to.port,
        ),
      ),
    };
    const result = runLab(rebuilt, 'run-1');
    expect(result.success).toBe(true);
    expect(result.responses.map((r) => r.id).sort((a, b) => a - b)).toEqual(definition.requestIds);
    expect(result.responses.filter((r) => r.pod === 'new-pod-b')).toHaveLength(5);
  });
  it('선언과 자료는 개별 실행 상태 없이 동작하고 이전 완료 기록을 읽는다', () => {
    const graph = ready();
    for (const id of ['deployment', 'service', 'start', 'image']) {
      expect(graph.entities.find((item) => item.id === id)).not.toHaveProperty('enabled');
      expect(() => applyCommand(graph, { type: 'toggle', id, enabled: false })).toThrow();
    }
    const legacy = {
      ...graph,
      entities: graph.entities.map((item) => ({ ...item, enabled: true })),
    };
    const restored = parseSaved(
      JSON.stringify({ version: 1, graph: legacy, proof: signature(legacy), quiz: true }),
    );
    expect(restored.graph).toEqual(graph);
    expect(restored.proof).toBe(signature(graph));
    expect(runLab(restored.graph, 'migrated').success).toBe(true);
    const stoppedDocker = applyCommand(graph, { type: 'toggle', id: 'docker', enabled: false });
    expect(
      runLab(stoppedDocker, 'stopped').steps.find((step) => step.node === 'image')?.status,
    ).toBe('blocked');
  });
  it('빠진 모델, 태그 불일치, 관리 대상 수, 시스템 정지를 구분한다', () => {
    const graph = ready();
    const cases = [
      [applyCommand(graph, { type: 'disconnect', ids: [model.id] }), '모델 입력이 없습니다.'],
      [
        applyCommand(graph, { type: 'settings', id: 'deployment', version: 'v2' }),
        '받은 이미지 v1',
      ],
      [applyCommand(graph, { type: 'settings', id: 'deployment', replicas: 3 }), '원하는 수 3개'],
      [
        applyCommand(graph, { type: 'toggle', id: 'kubernetes', enabled: false }),
        'Kubernetes 정지 상태',
      ],
    ] as const;
    for (const [config, message] of cases) {
      const result = runLab(config, 'run');
      expect(result.success).toBe(false);
      expect(result.steps.map((step) => step.message).join('\n')).toContain(message);
    }
  });
  it('순환 경로의 선을 반환하고, 같은 응답이 두 번 오면 실패한다', () => {
    let graph = applyCommand(ready(), {
      type: 'add',
      kind: 'service',
      parent: 'kubernetes',
      id: 'service-b',
    });
    graph = applyCommand(graph, {
      type: 'port-change',
      id: 'service',
      port: 'in-request',
      changes: { multiple: true },
    });
    const a = connection('service', 'out-request', 'service-b', 'in-request');
    const b = connection('service-b', 'out-request', 'service', 'in-request');
    for (const edge of [a, b]) graph = applyCommand(graph, { type: 'connect', edge });
    expect(runLab(graph, 'cycle').cycle.sort()).toEqual([a.id, b.id].sort());
    graph = applyCommand(ready(), {
      type: 'port-add',
      id: 'pod-b',
      port: 'extra',
      direction: 'out',
      material: 'prediction',
    });
    graph = applyCommand(graph, {
      type: 'connect',
      edge: connection('pod-b', 'extra', 'end', 'in-prediction'),
    });
    expect(runLab(graph, 'duplicate').message).toContain('중복');
  });
  it('시스템 삭제 후 실행 취소가 자식과 경계 연결을 복원하며 초기 복원도 취소할 수 있다', () => {
    const store = useSystemLab.getState();
    store.recover();
    const before = useSystemLab.getState().saved.graph;
    expect(store.dispatch({ type: 'remove', id: 'end' })).toBe(false);
    expect(
      store.dispatch({ type: 'move', id: 'ec2', parent: 'kubernetes', position: { x: 0, y: 0 } }),
    ).toBe(false);
    for (const id of [
      'start',
      'image',
      'deployment',
      'service',
      'pod-a',
      'pod-b',
      'ec2',
      'docker',
      'kubernetes',
    ]) {
      expect(store.dispatch({ type: 'remove', id })).toBe(false);
    }
    store.dispatch({ type: 'add', id: 'extra-ec2', kind: 'ec2', parent: 'root' });
    store.dispatch({ type: 'add', id: 'extra-docker', kind: 'docker', parent: 'extra-ec2' });
    store.dispatch({ type: 'add', id: 'extra-image', kind: 'image', parent: 'extra-docker' });
    store.dispatch({
      type: 'connect',
      edge: connection('extra-image', 'out-image', 'pod-a', 'in-image'),
    });
    const expanded = useSystemLab.getState().saved.graph;
    expect(store.dispatch({ type: 'remove', id: 'extra-ec2' })).toBe(true);
    expect(useSystemLab.getState().saved.graph).toEqual(before);
    store.undo();
    expect(useSystemLab.getState().saved.graph).toEqual(expanded);
    store.dispatch({ type: 'restore' });
    expect(useSystemLab.getState().saved.graph).toEqual(before);
    store.undo();
    expect(useSystemLab.getState().saved.graph).toEqual(expanded);
    expect(
      store.dispatch({
        type: 'move',
        id: 'image',
        parent: 'extra-docker',
        position: { x: 20, y: 50 },
      }),
    ).toBe(true);
    expect(store.dispatch({ type: 'remove', id: 'extra-ec2' })).toBe(false);
  });
  it('기존 저장에서 사라진 필수 항목을 복구하고 기존 연결은 유지한다', () => {
    const baseline = definition.initial();
    const entities = baseline.entities.filter(
      (entity) => !['image', 'docker', 'pod-b'].includes(entity.id),
    );
    const saved = parseSaved(
      JSON.stringify({ version: 1, graph: { ...baseline, entities }, proof: null, quiz: true }),
    );
    expect(saved.graph.entities.map((entity) => entity.id).sort()).toEqual(
      baseline.entities.map((entity) => entity.id).sort(),
    );
    expect(saved.graph.connections).toEqual(baseline.connections);
    expect(saved.quiz).toBe(true);
  });
  it('출발·도착 위치를 복원하며 이전 해금 필드는 무시한다', () => {
    let graph = ready();
    for (const id of ['start', 'end']) {
      graph = applyCommand(graph, { type: 'move', id, position: { x: 100, y: 75 } });
      expect(() =>
        applyCommand(graph, { type: 'move', id, parent: 'ec2', position: { x: 0, y: 0 } }),
      ).toThrow();
      expect(() => applyCommand(graph, { type: 'remove', id })).toThrow();
    }
    const saved = parseSaved(
      JSON.stringify({ version: 1, graph, proof: signature(graph), quiz: true, unlocked: 0 }),
    );
    expect(saved.graph).toEqual(graph);
    expect(saved.proof).toBe(signature(graph));
    expect(saved).not.toHaveProperty('unlocked');
  });
  it('이전 모델 출력을 출발로 옮겨 저장된 완료 기록을 복원한다', () => {
    const graph = ready();
    const old: Graph = {
      entities: [
        ...graph.entities.map((entity) =>
          entity.kind === 'start' && entity.type === 'resource'
            ? { ...entity, ports: entity.ports.filter((port) => port.material !== 'model') }
            : entity,
        ),
        {
          ...makeEntity('model', 'model', 'root', { x: 0, y: 475 }),
          version: 'v2',
        } as Graph['entities'][number],
      ],
      connections: graph.connections.map((edge) =>
        edge.from.node === 'start' && edge.from.port === 'out-model'
          ? connection('model', 'out-model', edge.to.node, edge.to.port)
          : edge,
      ),
    };
    const saved = parseSaved(
      JSON.stringify({ version: 1, graph: old, proof: signature(old), quiz: true }),
    );
    expect(saved.graph.entities.some((entity) => entity.kind === 'model')).toBe(false);
    expect(saved.graph.connections).toEqual(graph.connections);
    expect(saved.proof).toBe(signature(saved.graph));
    const run = runLab(saved.graph, 'old-save');
    expect(run.success).toBe(true);
    expect(run.responses.every((response) => response.model === 'v2')).toBe(true);
  });
  it('영역 정리는 자식의 화면 위치와 연결을 그대로 둔다', () => {
    const graph = applyCommand(ready(), {
      type: 'resize',
      id: 'kubernetes',
      width: 1300,
      height: 900,
    });
    const before = graph.entities.find((entity) => entity.id === 'pod-a')!;
    const compact = applyCommand(graph, { type: 'compact', id: 'kubernetes' });
    const group = compact.entities.find((entity) => entity.id === 'kubernetes');
    expect(group?.type === 'system' && group.width).toBeLessThan(1300);
    expect(
      absolute(
        compact,
        compact.entities.find((entity) => entity.id === 'pod-a')!,
      ),
    ).toEqual(absolute(graph, before));
    expect(compact.connections).toEqual(graph.connections);
    expect(signature(compact)).toBe(signature(graph));
  });
  it('위치 이동은 완료 증거를 유지하고 잘못된 저장 구조를 거부한다', () => {
    const graph = ready();
    const proof = signature(graph);
    const moved = applyCommand(graph, { type: 'move', id: 'pod-a', position: { x: 420, y: 56 } });
    expect(signature(moved)).toBe(proof);
    const saved = { version: 1, graph: moved, proof, quiz: true };
    expect(parseSaved(JSON.stringify(saved)).proof).toBe(proof);
    const bad = {
      ...graph,
      entities: graph.entities.map((e) => (e.id === 'pod-a' ? { ...e, parent: 'start' } : e)),
    };
    expect(() => parseSaved(JSON.stringify({ ...saved, graph: bad }))).toThrow();
  });
});
