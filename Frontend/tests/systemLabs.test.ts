import { describe, expect, it } from 'vitest';
import { applyCommand, type Command } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import { isComplete, signature, type Graph, type LabConfig } from '../src/systemLab/lab';
import { labFor } from '../src/systemLab/labs';
import { wired } from '../src/systemLab/labs/kit';
import { parseSaved } from '../src/systemLab/store';

const lab = (id: string) => labFor(id)!;
function edit(graph: Graph, config: LabConfig, ...commands: Command[]) {
  return commands.reduce((next, command) => applyCommand(next, command, config), graph);
}
const connect = (config: LabConfig, graph: Graph, ...edges: ReturnType<typeof wired>[]) =>
  edit(graph, config, ...edges.map((edge): Command => ({ type: 'connect', edge })));
const disconnect = (config: LabConfig, graph: Graph, ...edges: ReturnType<typeof wired>[]) =>
  edit(graph, config, { type: 'disconnect', ids: edges.map((edge) => edge.id) });
const setting = (id: string, key: string, value: string | number): Command => ({
  type: 'setting',
  id,
  key,
  value,
});
const add = (parent: string, kind: string, id: string): Command => ({
  type: 'add',
  parent,
  kind,
  id,
});
const messages = (graph: Graph, config: LabConfig) =>
  runLab(graph, 'run', config)
    .steps.map((step) => step.message)
    .join('\n');
const metric = (graph: Graph, config: LabConfig, label: string) =>
  runLab(graph, 'metric', config).metrics.find((item) => item.label === label)?.value;

describe('3단원 과거 실험 재현', () => {
  const config = lab('week4-workflow');
  const empty = () => config.initial();
  const base = () =>
    connect(
      config,
      empty(),
      wired('repo', 'code', 'restore', 'code'),
      wired('start', 'workdata', 'restore', 'workdata'),
      wired('restore', 'restored', 'end', 'restored'),
    );
  const fileLink = wired('file', 'file', 'restore', 'file');
  const cached = () =>
    edit(
      base(),
      config,
      setting('repo', 'commit', 'v1'),
      setting('restore', 'operation', 'checkout'),
      setting('restore', 'cache', 'present'),
    );

  it('초기에는 선이 없고 빠진 입력을 알려 준다', () => {
    expect(empty().connections).toHaveLength(0);
    expect(runLab(empty(), 'empty', config).success).toBe(false);
    expect(messages(empty(), config)).toContain('복원 결과 입력이 없습니다');
    const onlyEnd = connect(config, empty(), wired('restore', 'restored', 'end', 'restored'));
    expect(messages(onlyEnd, config)).toContain('코드·포인터 입력이 없습니다');
  });
  it('커밋을 v1로 옮겨도 Git만 이동하면 작업 데이터 v2와 맞지 않는다', () => {
    expect(runLab(base(), 'latest', config).message).toContain('재현할 실험은 v1인데 v2');
    const graph = edit(base(), config, setting('repo', 'commit', 'v1'));
    const result = runLab(graph, 'git', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('git-mismatch');
    expect(result.metrics.map((item) => item.value)).toEqual(['v1', 'v2', '기존 작업 폴더']);
  });
  it('캐시 적중이면 파일 없이도 복원하고 원격 읽기를 표시하지 않는다', () => {
    const result = runLab(cached(), 'hit', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('cache-restore');
    expect(metric(cached(), config, '데이터 출처')).toBe('로컬 캐시');
  });
  it('캐시가 없으면 파일의 데이터 버전을 맞춰야 원격에서 복원한다', () => {
    const miss = edit(
      base(),
      config,
      setting('repo', 'commit', 'v1'),
      setting('restore', 'operation', 'checkout'),
    );
    expect(runLab(miss, 'miss', config).observations).toContain('cache-miss');
    const pull = edit(miss, config, setting('restore', 'operation', 'pull'));
    expect(messages(pull, config)).toContain('dvc pull에는 파일 입력이 필요합니다');
    const stale = connect(config, pull, fileLink);
    expect(messages(stale, config)).toContain('파일 노드의 데이터 버전을 v1으로 맞추세요');
    const fixed = edit(stale, config, setting('file', 'version', 'v1'));
    const result = runLab(fixed, 'remote', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('remote-restore');
    expect(metric(fixed, config, '데이터 출처')).toBe('원격 다운로드');
  });
  it('이전 단원의 학습 실행을 만들 수 있고 판정에는 영향이 없다', () => {
    const graph = edit(cached(), config, add('ec2', 'train', 'train-1'));
    expect(graph.entities.some((e) => e.id === 'train-1')).toBe(true);
    expect(runLab(graph, 'train', config).success).toBe(true);
  });
  it('초기 구성의 핵심 노드만 삭제할 수 없다', () => {
    for (const id of ['repo', 'file', 'restore', 'github', 'storage', 'ec2', 'start', 'end'])
      expect(() => applyCommand(empty(), { type: 'remove', id }, config)).toThrow();
    const extra = edit(empty(), config, add('ec2', 'train', 'extra'));
    expect(applyCommand(extra, { type: 'remove', id: 'extra' }, config).entities).toHaveLength(
      empty().entities.length,
    );
  });
  it('같은 타입끼리만 연결하고 잘못된 설정값을 거부한다', () => {
    expect(() => connect(config, empty(), wired('file', 'file', 'end', 'restored'))).toThrow(
      '같은 자료 타입',
    );
    expect(() => edit(empty(), config, setting('restore', 'operation', 'rsync'))).toThrow();
  });
  it('저장을 복원하고 관찰 조건이 모두 있어야 완료로 본다', () => {
    const graph = edit(base(), config, setting('restore', 'operation', 'pull'));
    const saved = parseSaved(
      JSON.stringify({
        version: 1,
        graph,
        quiz: true,
        proof: signature(graph),
        observed: ['git-mismatch'],
      }),
      config,
    );
    expect(saved.graph.entities.find((e) => e.id === 'restore')?.settings?.operation).toBe('pull');
    expect(isComplete(config, saved)).toBe(false);
    expect(isComplete(config, { ...saved, observed: [...config.requiredObservations] })).toBe(true);
  });
});

describe('4단원 GPU 두 장 학습', () => {
  const config = lab('week1-workflow');
  const single = () =>
    connect(
      config,
      config.initial(),
      wired('start', 'job', 'worker1', 'job'),
      wired('worker1', 'result', 'end', 'checkpoint'),
    );
  const split = [
    wired('start', 'job', 'split', 'job'),
    wired('split', 'a', 'worker1', 'job'),
    wired('split', 'b', 'worker2', 'job'),
    wired('worker1', 'result', 'merge', 'a'),
    wired('worker2', 'result', 'merge', 'b'),
    wired('merge', 'checkpoint', 'end', 'checkpoint'),
  ];
  /** 워커 둘, 분할, 결합을 만들고 선을 다시 잇는다. */
  const build = (strategy?: string) => {
    let graph = edit(
      single(),
      config,
      add('ec2', 'train', 'worker2'),
      add('ec2', 'split', 'split'),
      add('ec2', 'merge', 'merge'),
    );
    graph = disconnect(config, graph, wired('start', 'job', 'worker1', 'job'));
    graph = connect(config, graph, ...split);
    return strategy ? edit(graph, config, setting('split', 'strategy', strategy)) : graph;
  };
  const material = (graph: Graph, id: string, port: string) => {
    const entity = graph.entities.find((e) => e.id === id);
    return entity?.type === 'resource'
      ? entity.ports.find((p) => p.id === port)?.material
      : undefined;
  };

  it('초기에는 워커 하나뿐이고 작업 전체를 맡으면 OOM으로 실패한다', () => {
    const initial = config.initial();
    expect(initial.entities.filter((e) => e.kind === 'train')).toHaveLength(1);
    expect(initial.connections).toHaveLength(0);
    const result = runLab(single(), 'single', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('single-oom');
    expect(messages(single(), config)).toContain('OOM: 한 장에 24GiB가 필요하지만 16GiB뿐입니다');
  });
  it('분할을 만들면 워커 출력 타입이 바뀌어 도착으로 가던 연결이 지워진다', () => {
    const graph = edit(single(), config, add('ec2', 'split', 'split'));
    expect(graph.connections.some((edge) => edge.to.node === 'end')).toBe(false);
    expect(material(graph, 'worker1', 'out-result')).toBe('gradient');
    const removed = edit(graph, config, { type: 'remove', id: 'split' });
    expect(material(removed, 'worker1', 'out-result')).toBe('checkpoint');
  });
  it('데이터 병렬로 나눠도 장치마다 모델을 복제해 OOM이 남는다', () => {
    const result = runLab(build(), 'data', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('data-oom');
    expect(result.observations).not.toContain('single-oom');
  });
  it('텐서 병렬은 두 부분 결과를 합쳐 완료한다', () => {
    const result = runLab(build('tensor'), 'tensor', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('split-complete');
    expect(result.metrics.map((item) => item.value)).toEqual([
      '12 / 16 GiB',
      '부분 행렬 결과',
      '8',
    ]);
  });
  it('레이어 분할은 앞 워커의 활성값을 뒤 워커가 받아야 한다', () => {
    const skipped = build('model');
    expect(material(skipped, 'worker2', 'in-act')).toBe('activation');
    expect(messages(skipped, config)).toContain('마지막 레이어를 맡은 워커의 결과가 필요합니다');
    const chained = connect(config, skipped, wired('worker1', 'result', 'worker2', 'act'));
    const result = runLab(chained, 'chain', config);
    expect(result.success).toBe(true);
    expect(result.metrics[1].value).toBe('중간 활성값');
  });
  it('전략을 바꾸면 활성값 입력 연결만 지워지고 새 타입과 맞는 연결은 유지된다', () => {
    const chained = connect(config, build('model'), wired('worker1', 'result', 'worker2', 'act'));
    const tensor = edit(chained, config, setting('split', 'strategy', 'tensor'));
    expect(tensor.connections.some((edge) => edge.to.port === 'in-act')).toBe(false);
    expect(material(tensor, 'worker2', 'in-act')).toBeUndefined();
    expect(tensor.connections.some((edge) => edge.to.node === 'merge')).toBe(true);
  });
  it('통신 비용 설정이 통신량에 반영된다', () => {
    const graph = connect(
      config,
      edit(build('model'), config, setting('merge', 'communication', 10)),
      wired('worker1', 'result', 'worker2', 'act'),
    );
    expect(metric(graph, config, '통신량')).toBe('10');
  });
  it('처음 있던 워커와 시작·도착만 잠그고 만든 노드는 삭제할 수 있다', () => {
    const graph = build('tensor');
    for (const id of ['worker1', 'start', 'end', 'ec2'])
      expect(() => applyCommand(graph, { type: 'remove', id }, config)).toThrow();
    for (const id of ['worker2', 'split', 'merge'])
      expect(
        applyCommand(graph, { type: 'remove', id }, config).entities.some((e) => e.id === id),
      ).toBe(false);
  });
  it('두 번째 워커 없이 결과를 합치면 실패한다', () => {
    const graph = edit(build('tensor'), config, { type: 'remove', id: 'worker2' });
    expect(runLab(graph, 'missing-worker', config).success).toBe(false);
  });
});

describe('6단원 문서 준비와 질문 응답', () => {
  const config = lab('rag-workflow');
  const query = [
    wired('start', 'question', 'query-embed', 'text'),
    wired('query-embed', 'vector', 'search', 'query'),
    wired('index', 'index', 'search', 'index'),
    wired('search', 'evidence', 'api', 'evidence'),
    wired('start', 'question', 'api', 'question'),
  ];
  const build = () =>
    connect(
      config,
      edit(
        config.initial(),
        config,
        add('ec2', 'embed', 'query-embed'),
        add('storage', 'search', 'search'),
      ),
      ...query,
    );
  const vector = () => edit(build(), config, setting('storage', 'type', 'vector'));
  const aligned = () => edit(vector(), config, setting('query-embed', 'space', 'A'));

  it('초기에는 문서 임베딩과 색인만 있고 문서 경로만 연결되어 있다', () => {
    const initial = config.initial();
    expect(initial.entities.filter((e) => e.kind === 'embed')).toHaveLength(1);
    expect(initial.entities.some((e) => e.kind === 'search')).toBe(false);
    expect(initial.connections).toHaveLength(3);
  });
  it('객체 저장소에서는 색인할 수 없고 유형을 Vector DB로 바꿔야 한다', () => {
    expect(runLab(build(), 'object', config).success).toBe(false);
    expect(messages(build(), config)).toContain('저장소 유형을 Vector DB로 바꾸세요');
  });
  it('다른 임베딩 공간에서는 검색이 차단된다', () => {
    const result = runLab(vector(), 'blocked', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('space-mismatch');
    expect(messages(vector(), config)).toContain('서로 다른 공간의 벡터는 거리를 비교할 수 없어');
  });
  it('같은 공간으로 맞추면 근거 ID가 붙은 답변이 도착한다', () => {
    const result = runLab(aligned(), 'ok', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('grounded-answer');
    expect(result.metrics[0]).toEqual({ label: '근거 문서 ID', value: 'doc-return' });
    expect(result.metrics[1].value).toContain('[doc-return]');
  });
  it('질문 경로를 빼면 어떤 입력이 빠졌는지 알려 준다', () => {
    const graph = disconnect(config, aligned(), query[4]);
    expect(runLab(graph, 'missing', config).success).toBe(false);
    expect(messages(graph, config)).toContain('질문 입력이 없습니다');
  });
  it('문서 벡터를 검색에 잘못 연결하면 알려 준다', () => {
    const swapped = connect(
      config,
      disconnect(config, aligned(), query[1]),
      wired('doc-embed', 'vector', 'search', 'query'),
    );
    expect(messages(swapped, config)).toContain('검색에는 질문 벡터를 연결하세요');
  });
  it('청킹 단위는 벡터 수만 바꾸고 근거는 유지한다', () => {
    const graph = edit(aligned(), config, setting('doc-embed', 'chunk', 'sentence'));
    const result = runLab(graph, 'chunk', config);
    expect(result.success).toBe(true);
    expect(result.steps.find((step) => step.node === 'doc-embed')?.message).toContain('벡터 4개');
  });
  it('처음 있던 노드만 삭제할 수 없다', () => {
    for (const id of ['doc-embed', 'index', 'api', 'ec2', 'storage', 'gateway'])
      expect(() => applyCommand(build(), { type: 'remove', id }, config)).toThrow();
    expect(
      applyCommand(build(), { type: 'remove', id: 'search' }, config).entities.some(
        (e) => e.id === 'search',
      ),
    ).toBe(false);
  });
});
