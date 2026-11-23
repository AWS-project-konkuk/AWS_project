import { beforeEach, describe, expect, it } from 'vitest';
import {
  libraryLimit,
  parseLibrary,
  uniqueName,
  usePlaygroundLibrary,
} from '../src/playground/library';
import { playgroundLab } from '../src/systemLab/labs';

const graph = () => playgroundLab.initial();
const reset = () => usePlaygroundLibrary.setState({ items: [], openId: null, warning: '' });

describe('내 Playground 목록', () => {
  beforeEach(reset);

  it('같은 이름은 번호를 붙이고 저장한 항목을 연다', () => {
    const { saveAs } = usePlaygroundLibrary.getState();
    const first = saveAs('실험', graph());
    const second = saveAs('실험', graph());
    const { items, openId } = usePlaygroundLibrary.getState();
    expect(items.map((item) => item.name)).toEqual(['실험 (2)', '실험']);
    expect(first).not.toBe(second);
    expect(openId).toBe(second);
  });

  it('복제·이름 변경·삭제를 처리하고 삭제한 항목은 열어 둔 상태에서 해제한다', () => {
    const { saveAs, duplicate, rename, remove } = usePlaygroundLibrary.getState();
    const id = saveAs('원본', graph()) as string;
    duplicate(id);
    expect(usePlaygroundLibrary.getState().items.map((item) => item.name)).toEqual([
      '원본 복사본',
      '원본',
    ]);
    rename(id, '원본 복사본');
    expect(usePlaygroundLibrary.getState().items.find((item) => item.id === id)?.name).toBe(
      '원본 복사본 (2)',
    );
    remove(id);
    const state = usePlaygroundLibrary.getState();
    expect(state.items).toHaveLength(1);
    expect(state.openId).toBeNull();
  });

  it('덮어쓰기는 이름과 순서를 유지하고 그래프만 바꾼다', () => {
    const { saveAs, overwrite } = usePlaygroundLibrary.getState();
    const id = saveAs('원본', graph()) as string;
    const next = graph();
    next.entities = next.entities.slice(0, 1);
    overwrite(id, next);
    const [item] = usePlaygroundLibrary.getState().items;
    expect(item.name).toBe('원본');
    expect(item.graph.entities).toHaveLength(1);
  });

  it('한도를 넘으면 저장하지 않고 알린다', () => {
    const { saveAs } = usePlaygroundLibrary.getState();
    for (let i = 0; i < libraryLimit; i++) saveAs('항목 ' + i, graph());
    expect(usePlaygroundLibrary.getState().saveAs('넘침', graph())).toBeNull();
    const state = usePlaygroundLibrary.getState();
    expect(state.items).toHaveLength(libraryLimit);
    expect(state.warning).toContain(String(libraryLimit));
  });

  it('저장 값에서 읽을 수 없는 항목은 버린다', () => {
    const good = { id: 'a', name: '정상', updatedAt: 1, graph: graph() };
    const raw = JSON.stringify({
      version: 1,
      items: [good, { id: 'b', name: '깨짐', updatedAt: 2, graph: { entities: 1 } }, 7],
    });
    expect(parseLibrary(raw).map((item) => item.id)).toEqual(['a']);
    expect(parseLibrary('{')).toEqual([]);
    expect(parseLibrary(null)).toEqual([]);
  });

  it('빈 이름은 기본 이름을 쓴다', () => {
    expect(uniqueName('  ', [])).toBe('내 Playground');
  });
});
