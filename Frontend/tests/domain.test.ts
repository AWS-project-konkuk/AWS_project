import { describe, expect, it } from 'vitest';
import { exampleGraph, makeEdge } from '../src/workflow/graph';
import { validateGraph } from '../src/workflow/validate';
import { simulate } from '../src/simulation/simulate';
import {
  loadWorkflow,
  parseSaved,
  saveWorkflow,
  storageKey,
  type StorageAdapter,
} from '../src/storage/persistence';
import { workflowReducer } from '../src/workflow/WorkflowContext';

describe('과제 워크플로 검증', () => {
  it('정상 파이프라인을 허용한다', () => expect(validateGraph(exampleGraph(true))).toEqual([]));
  it('평가 단계 누락과 잘못된 연결을 설명한다', () => {
    const issues = validateGraph(exampleGraph());
    expect(issues.some((issue) => issue.id === 'stage-evaluation')).toBe(true);
    expect(issues.some((issue) => issue.edgeIds.length > 0)).toBe(true);
  });
  it('평가용 데이터가 빠진 경우를 찾는다', () => {
    const graph = exampleGraph(true);
    graph.edges = graph.edges.filter((edge) => edge.targetHandle !== 'test');
    expect(validateGraph(graph).some((issue) => issue.id === 'input-evaluation-test')).toBe(true);
  });
  it('순환 연결과 잘못된 포트를 찾는다', () => {
    const graph = exampleGraph(true);
    graph.edges.push(makeEdge('serving', 'raw', 'dataset', 'raw'));
    expect(validateGraph(graph).some((issue) => issue.id === 'cycle')).toBe(true);
  });
  it.each([null, -1, 1.1, NaN])('잘못된 평가 기준 %s를 막는다', (threshold) => {
    const graph = exampleGraph(true);
    graph.nodes.find((node) => node.id === 'evaluation')!.data.threshold = threshold;
    expect(validateGraph(graph).some((issue) => issue.id.startsWith('threshold'))).toBe(true);
  });
});

describe('학습용 시뮬레이션', () => {
  it('기준을 만족하면 모든 단계를 통과한다', () => {
    const results = simulate(exampleGraph(true));
    expect(results).toHaveLength(6);
    expect(results.every((result) => result.status === 'success')).toBe(true);
    expect(results.find((result) => result.kind === 'training')!.artifact).toContain('train:v1');
  });
  it('기준 미달은 실패와 후속 차단으로 구분한다', () => {
    const graph = exampleGraph(true);
    graph.nodes.find((node) => node.id === 'evaluation')!.data.threshold = 0.9;
    const results = simulate(graph);
    expect(results.find((result) => result.kind === 'evaluation')!.status).toBe('failed');
    expect(
      results.filter((result) => result.status === 'blocked').map((result) => result.kind),
    ).toEqual(['registry', 'serving']);
  });
  it('배치와 배열 순서에 관계없이 같은 결과를 계산한다', () => {
    const graph = exampleGraph(true);
    const expected = simulate(graph);
    graph.nodes.reverse().forEach((node) => {
      node.position = { x: -400, y: 999 };
    });
    graph.edges.reverse();
    expect(simulate(graph)).toEqual(expected);
  });
  it('잘못된 그래프는 실행하지 않는다', () => expect(simulate(exampleGraph())).toEqual([]));
});

function memoryStorage(): StorageAdapter & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('저장과 복원', () => {
  it('워크플로와 읽은 단계를 복원하고 임시 선택 상태는 제외한다', () => {
    const storage = memoryStorage();
    const graph = exampleGraph(true);
    graph.nodes[0].selected = true;
    saveWorkflow(storage, graph, { readSections: ['dataset'] });
    const loaded = loadWorkflow(storage);
    expect(loaded.state).toBe('loaded');
    if (loaded.state !== 'loaded') throw new Error('복원 실패');
    expect(loaded.value.graph.nodes[0].selected).toBeUndefined();
    expect(loaded.value.progress.readSections).toEqual(['dataset']);
  });
  it('손상된 원본과 알 수 없는 버전을 덮어쓰지 않는다', () => {
    const storage = memoryStorage();
    storage.setItem(storageKey, '{broken');
    expect(loadWorkflow(storage).state).toBe('blocked');
    expect(storage.getItem(storageKey)).toBe('{broken');
    expect(() => parseSaved('{"version":2}')).toThrow();
  });
  it('중복 노드와 존재하지 않는 연결을 거절한다', () => {
    const graph = exampleGraph(true);
    graph.nodes.push(graph.nodes[0]);
    expect(() =>
      parseSaved(JSON.stringify({ version: 1, graph, progress: { readSections: [] } })),
    ).toThrow();
    graph.nodes.pop();
    graph.edges[0].source = 'missing';
    expect(() =>
      parseSaved(JSON.stringify({ version: 1, graph, progress: { readSections: [] } })),
    ).toThrow();
  });
  it('저장소 오류를 숨기지 않는다', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('용량 초과');
    };
    expect(() => saveWorkflow(storage, exampleGraph(), { readSections: [] })).toThrow('용량 초과');
    storage.getItem = () => {
      throw new Error('접근 차단');
    };
    expect(loadWorkflow(storage).state).toBe('blocked');
  });
});

describe('실행 상태 무효화', () => {
  it('연결 직후의 선택 변경이 새 연결을 없애지 않는다', () => {
    const state = {
      graph: exampleGraph(),
      progress: { readSections: [] },
      issues: [],
      validated: false,
      steps: [],
      cursor: 0,
      playing: false,
      selectedId: null,
      activeKind: 'dataset' as const,
      saveBlocked: false,
      initialWarning: '',
    };
    const connection = {
      source: 'preprocess',
      sourceHandle: 'test',
      target: 'training',
      targetHandle: 'train',
    };
    const connected = workflowReducer(state, { type: 'connect', connection });
    const selected = workflowReducer(connected, {
      type: 'nodes',
      changes: [{ type: 'select', id: 'training', selected: true }],
    });
    expect(selected.graph.edges).toHaveLength(state.graph.edges.length + 1);
    expect(workflowReducer(selected, { type: 'connect', connection }).graph.edges).toHaveLength(
      selected.graph.edges.length,
    );
    expect(
      workflowReducer(selected, {
        type: 'connect',
        connection: { ...connection, target: 'preprocess' },
      }).graph.edges,
    ).toHaveLength(selected.graph.edges.length);
  });
  it('구성 변경은 실행을 중단하고 위치 변경은 결과를 유지한다', () => {
    const state = {
      graph: exampleGraph(true),
      progress: { readSections: [] },
      issues: [],
      validated: true,
      steps: simulate(exampleGraph(true)),
      cursor: 2,
      playing: true,
      selectedId: null,
      activeKind: 'dataset' as const,
      saveBlocked: false,
      initialWarning: '',
    };
    expect(workflowReducer(state, { type: 'graph', graph: exampleGraph(true) }).steps).toEqual([]);
    expect(workflowReducer(state, { type: 'graph', graph: exampleGraph(true) }).playing).toBe(
      false,
    );
    expect(
      workflowReducer(state, { type: 'graph', graph: exampleGraph(true), semantic: false }).steps,
    ).toHaveLength(6);
  });
});
