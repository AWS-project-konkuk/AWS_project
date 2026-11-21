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
const setting = (id: string, key: string, value: string | number): Command => ({
  type: 'setting',
  id,
  key,
  value,
});
const messages = (graph: Graph, config: LabConfig) =>
  runLab(graph, 'run', config)
    .steps.map((step) => step.message)
    .join('\n');

describe('3단원 과거 실험 재현', () => {
  const config = lab('week4-workflow');
  const start = () => config.initial();
  const remoteWires = [
    wired('start', 'version', 's3-files', 'version'),
    wired('s3-files', 'file', 'restore', 'file'),
  ];
  it('Git만 이동하면 코드 v1과 작업 데이터 v2의 불일치로 실패한다', () => {
    const result = runLab(start(), 'git', config);
    expect(result.success).toBe(false);
    expect(result.message).toContain('코드는 v1인데 작업 데이터는 v2');
    expect(result.observations).toContain('git-mismatch');
    expect(result.metrics.map((metric) => metric.value)).toEqual(['v1', 'v2', '기존 작업 폴더']);
  });
  it('캐시 적중으로 복원하면 원격 읽기 없이 성공한다', () => {
    const graph = edit(
      connect(config, start(), ...remoteWires),
      config,
      setting('restore', 'operation', 'checkout'),
      setting('restore', 'cache', 'present'),
    );
    const result = runLab(graph, 'hit', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('cache-restore');
    expect(result.metrics.find((metric) => metric.label === '데이터 출처')?.value).toBe(
      '로컬 캐시',
    );
  });
  it('캐시가 없으면 checkout은 실패하고 pull은 원격 파일 입력이 있어야 성공한다', () => {
    const checkout = edit(start(), config, setting('restore', 'operation', 'checkout'));
    expect(runLab(checkout, 'miss', config).observations).toContain('cache-miss');
    const pull = edit(checkout, config, setting('restore', 'operation', 'pull'));
    expect(messages(pull, config)).toContain('S3의 버전 파일 입력이 필요합니다');
    const remote = connect(config, pull, ...remoteWires);
    const result = runLab(remote, 'remote', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('remote-restore');
    expect(result.metrics.find((metric) => metric.label === '데이터 출처')?.value).toBe(
      '원격 다운로드',
    );
  });
  it('핵심 노드와 서비스는 삭제할 수 없고 추가 노드는 삭제할 수 있다', () => {
    for (const id of ['git-read', 's3-files', 'restore', 'github', 's3', 'ec2', 'start', 'end'])
      expect(() => applyCommand(start(), { type: 'remove', id }, config)).toThrow();
    const extra = applyCommand(
      start(),
      { type: 'add', parent: 'github', kind: 'git-read', id: 'extra' },
      config,
    );
    expect(applyCommand(extra, { type: 'remove', id: 'extra' }, config).entities).toHaveLength(
      start().entities.length,
    );
  });
  it('같은 타입끼리만 연결하고 잘못된 설정값을 거부한다', () => {
    expect(() =>
      applyCommand(
        start(),
        { type: 'connect', edge: wired('s3-files', 'file', 'end', 'restored') },
        config,
      ),
    ).toThrow('같은 자료 타입');
    expect(() => edit(start(), config, setting('restore', 'operation', 'rsync'))).toThrow();
  });
  it('저장을 복원하고 관찰 조건이 모두 있어야 완료로 본다', () => {
    const graph = edit(start(), config, setting('restore', 'operation', 'pull'));
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
  const results = [
    wired('worker1', 'result', 'merge', 'a'),
    wired('worker2', 'result', 'merge', 'b'),
  ];
  const data = () => connect(config, config.initial(), ...results);
  it('16GiB 장치에서 데이터 병렬은 OOM으로 실패한다', () => {
    const result = runLab(data(), 'oom', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('data-oom');
    expect(messages(data(), config)).toContain('OOM: 한 장에 24GiB가 필요하지만 16GiB뿐입니다');
  });
  it('전략을 바꾸면 워커 출력과 결합 입력의 자료 타입이 함께 바뀐다', () => {
    const tensor = edit(data(), config, setting('gpu', 'strategy', 'tensor'));
    const material = (id: string, port: string) => {
      const entity = tensor.entities.find((e) => e.id === id);
      return entity?.type === 'resource'
        ? entity.ports.find((p) => p.id === port)?.material
        : undefined;
    };
    expect(material('worker1', 'out-result')).toBe('partial');
    expect(material('merge', 'in-a')).toBe('partial');
    expect(tensor.connections).toHaveLength(data().connections.length);
  });
  it('전략을 바꾸면 새 타입과 맞지 않는 연결만 지워진다', () => {
    const model = connect(
      config,
      edit(data(), config, setting('gpu', 'strategy', 'model')),
      wired('worker1', 'result', 'worker2', 'act'),
    );
    expect(model.connections.some((edge) => edge.to.port === 'in-act')).toBe(true);
    const back = edit(model, config, setting('gpu', 'strategy', 'data'));
    expect(back.connections.some((edge) => edge.to.port === 'in-act')).toBe(false);
    expect(back.connections.some((edge) => edge.to.node === 'merge')).toBe(true);
  });
  it('텐서 병렬은 두 부분 결과를 합쳐 완료한다', () => {
    const graph = edit(data(), config, setting('gpu', 'strategy', 'tensor'));
    const result = runLab(graph, 'tensor', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('split-complete');
    expect(result.metrics.map((metric) => metric.value)).toEqual([
      '12 / 16 GiB',
      '부분 행렬 결과',
      '8',
    ]);
  });
  it('레이어 분할은 앞 워커의 활성값을 뒤 워커가 받아야 한다', () => {
    const skipped = edit(data(), config, setting('gpu', 'strategy', 'model'));
    expect(runLab(skipped, 'skip', config).success).toBe(false);
    expect(messages(skipped, config)).toContain('마지막 레이어를 맡은 워커의 결과가 필요합니다');
    const chained = connect(config, skipped, wired('worker1', 'result', 'worker2', 'act'));
    const result = runLab(chained, 'chain', config);
    expect(result.success).toBe(true);
    expect(result.metrics[1].value).toBe('중간 활성값');
  });
  it('GPU 메모리를 늘려 데이터 병렬이 성공해도 분할 완료로 기록하지 않는다', () => {
    const graph = edit(
      data(),
      config,
      setting('worker1', 'vram', 32),
      setting('worker2', 'vram', 32),
    );
    const result = runLab(graph, 'big', config);
    expect(result.success).toBe(true);
    expect(result.observations).not.toContain('split-complete');
  });
  it('워커를 끄면 실행이 차단된다', () => {
    const graph = edit(data(), config, { type: 'toggle', id: 'worker2', enabled: false });
    expect(messages(graph, config)).toContain('GPU 워커 2 정지 상태');
  });
});

describe('6단원 문서 준비와 질문 응답', () => {
  const config = lab('rag-workflow');
  const paths = [
    wired('start', 'question', 'query-embed', 'question'),
    wired('index', 'index', 'search', 'index'),
    wired('query-embed', 'qvec', 'search', 'qvec'),
    wired('search', 'evidence', 'answer', 'evidence'),
    wired('start', 'question', 'answer', 'question'),
  ];
  const wiredGraph = () => connect(config, config.initial(), ...paths);
  it('다른 임베딩 공간에서는 검색이 차단된다', () => {
    const result = runLab(wiredGraph(), 'blocked', config);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('space-mismatch');
    expect(messages(wiredGraph(), config)).toContain(
      '서로 다른 공간의 벡터는 거리를 비교할 수 없어',
    );
  });
  it('같은 공간으로 맞추면 근거 ID가 붙은 답변이 도착한다', () => {
    const graph = edit(wiredGraph(), config, setting('query-embed', 'space', 'A'));
    const result = runLab(graph, 'ok', config);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('grounded-answer');
    expect(result.metrics[0]).toEqual({ label: '근거 문서 ID', value: 'doc-return' });
    expect(result.metrics[1].value).toContain('[doc-return]');
  });
  it('질문 경로를 빼면 어떤 입력이 빠졌는지 알려 준다', () => {
    const graph = applyCommand(
      edit(wiredGraph(), config, setting('query-embed', 'space', 'A')),
      { type: 'disconnect', ids: [paths[4].id] },
      config,
    );
    expect(runLab(graph, 'missing', config).success).toBe(false);
    expect(messages(graph, config)).toContain('질문 입력이 없습니다');
  });
  it('청킹 단위는 벡터 수만 바꾸고 근거는 유지한다', () => {
    const graph = edit(
      wiredGraph(),
      config,
      setting('query-embed', 'space', 'A'),
      setting('doc-embed', 'chunk', 'sentence'),
    );
    const result = runLab(graph, 'chunk', config);
    expect(result.success).toBe(true);
    expect(result.steps.find((step) => step.node === 'doc-embed')?.message).toContain('벡터 4개');
  });
});
