import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import { type Connection, type Graph, type LabConfig, signature } from '../src/systemLab/lab';
import { lessonById } from '../src/curriculum/blockml';
import { labConfigs } from '../src/systemLab/labs';
import { josa, wired } from '../src/systemLab/labs/kit';
import { quizzes } from '../src/systemLab/labs/quizzes';
import { transitionLab } from '../src/systemLab/labs/transition';
import { createLabStore } from '../src/systemLab/store';

const lab = transitionLab;
const connect = (graph: Graph, edges: Connection[], target: LabConfig = lab) =>
  edges.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, target), graph);
const withNewModel = (): Graph =>
  applyCommand(lab.initial(), { type: 'add', parent: 'gateway', kind: 'infer', id: 'new' }, lab);
const newModelWires = [
  wired('router', 'new', 'new', 'request'),
  wired('start', 'new', 'new', 'model'),
  wired('new', 'prediction', 'observe', 'prediction'),
];

describe('이미 찬 입력 포트', () => {
  it('새 연결이 기존 연결을 바꾼다', () => {
    const wrong = connect(withNewModel(), [
      wired('router', 'new', 'new', 'request'),
      wired('start', 'old', 'new', 'model'),
    ]);
    const swapped = connect(wrong, [wired('start', 'new', 'new', 'model')]);
    const inputs = swapped.connections.filter(
      (e) => e.to.node === 'new' && e.to.port === 'in-model',
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0].from.port).toBe('out-new');
  });

  it('같은 연결을 다시 만들면 거절한다', () => {
    const graph = connect(withNewModel(), newModelWires);
    expect(() => connect(graph, [newModelWires[1]])).toThrow('이미 연결');
  });
});

describe('실패 원인 표시', () => {
  it('도착이 입력을 받지 못하면 처음 실패한 노드의 이유를 보여 준다', () => {
    const wrong = connect(withNewModel(), [
      wired('router', 'new', 'new', 'request'),
      wired('start', 'old', 'new', 'model'),
      wired('new', 'prediction', 'observe', 'prediction'),
    ]);
    const result = runLab(wrong, 'test', lab);
    expect(result.success).toBe(false);
    expect(result.message).toContain('요청 분배가 지정한 모델을 연결하세요.');
  });
});

describe('완료 기록과 되돌리기', () => {
  const store = () => {
    const created = createLabStore(lab);
    const { dispatch } = created.getState();
    dispatch({ type: 'add', parent: 'gateway', kind: 'infer', id: 'new' });
    for (const edge of newModelWires) dispatch({ type: 'connect', edge });
    dispatch({ type: 'setting', id: 'router', key: 'strategy', value: 'canary' });
    created.getState().prove(signature(created.getState().saved.graph));
    return created;
  };

  it('편집을 되돌려 같은 구성이 되면 완료가 유지된다', () => {
    const created = store();
    const proof = created.getState().saved.proof;
    expect(proof).not.toBeNull();
    created.getState().dispatch({ type: 'disconnect', ids: [newModelWires[2].id] });
    expect(created.getState().saved.proof).toBeNull();
    created.getState().undo();
    expect(created.getState().saved.proof).toBe(proof);
  });

  it('다시 실행하기 전에 다른 구성이면 완료를 인정하지 않는다', () => {
    const created = store();
    created.getState().dispatch({ type: 'setting', id: 'router', key: 'share', value: '50' });
    expect(created.getState().saved.proof).toBeNull();
    created.getState().dispatch({ type: 'restore' });
    expect(created.getState().saved.proof).toBeNull();
    created.getState().undo();
    expect(created.getState().saved.proof).toBeNull();
  });
});

describe('조사', () => {
  it('받침에 맞게 붙인다', () => {
    expect(josa('기울기', '을/를')).toBe('기울기를');
    expect(josa('중간 활성값', '을/를')).toBe('중간 활성값을');
    expect(josa('doc-return', '을/를')).toBe('doc-return을');
    expect(josa('근거 doc-return', '이/가')).toBe('근거 doc-return이');
    expect(josa('데이터 v2', '을/를')).toBe('데이터 v2를');
    expect(josa('데이터 v1', '을/를')).toBe('데이터 v1을');
    expect(josa('모델 v2', '과/와')).toBe('모델 v2와');
    expect(josa('Pod', '으로/로')).toBe('Pod로');
    expect(josa('count_rows.py', '으로/로')).toBe('count_rows.py로');
    expect(josa('v1', '으로/로')).toBe('v1로');
    expect(josa('커밋', '으로/로')).toBe('커밋으로');
  });
});

describe('이해 확인', () => {
  it('시스템 실습의 문항은 모두 4지선다이고 정답 위치가 고르게 나뉜다', () => {
    const positions = new Set<number>();
    for (const id of Object.keys(labConfigs)) {
      const quiz = lessonById[id]?.assessment ?? quizzes[id];
      expect(quiz, id).toBeDefined();
      expect(quiz.options, id).toHaveLength(4);
      expect(new Set(quiz.options).size, id).toBe(4);
      expect(quiz.correct, id).toBeGreaterThanOrEqual(0);
      expect(quiz.correct, id).toBeLessThan(4);
      positions.add(quiz.correct);
    }
    expect(positions.size).toBe(4);
  });
});
