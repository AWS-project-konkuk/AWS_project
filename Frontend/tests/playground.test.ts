import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import { signature, type Graph, type SettingValue } from '../src/systemLab/lab';
import { labFor, playgroundLab as lab } from '../src/systemLab/labs';
import { wired } from '../src/systemLab/labs/kit';
import { playgroundTools } from '../src/systemLab/labs/playground';
import { playgroundView } from '../src/systemLab/labs/playground-view';
import { buildHintRequest, canRequestHint } from '../src/systemLab/hint';
import { parseSaved } from '../src/systemLab/store';

type Node = [id: string, kind: string, parent: string, settings?: Record<string, SettingValue>];
function build(nodes: Node[], wires: ReturnType<typeof wired>[] = []): Graph {
  let graph = lab.initial();
  for (const [id, kind, parent, settings] of nodes) {
    graph = applyCommand(graph, { type: 'add', id, kind, parent }, lab);
    for (const [key, value] of Object.entries(settings ?? {}))
      graph = applyCommand(graph, { type: 'setting', id, key, value }, lab);
  }
  return wires.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, lab), graph);
}
const run = (graph: Graph) => runLab(graph, 'test', lab);

const pipeline: Node[] = [
  ['raw', 'rawData', 'sources'],
  ['reqs', 'requestStream', 'sources', { count: '10' }],
  ['read', 'readObjects', 'storage'],
  ['validate', 'validateData', 'ec2'],
  ['partition', 'partition', 'ec2'],
  ['train', 'train', 'ec2'],
  ['track', 'trackExperiment', 'ec2'],
  ['evaluate', 'evaluate', 'ec2', { threshold: 0.8 }],
  ['register', 'registerModel', 'registry', { stage: 'production' }],
  ['deploy', 'deployModel', 'gateway'],
  ['serve', 'infer', 'gateway'],
  ['observe', 'observeResponses', 'monitoring'],
];
const pipelineWires = [
  wired('raw', 'objects', 'read', 'objects'),
  wired('read', 'dataset', 'validate', 'dataset'),
  wired('validate', 'dataset', 'partition', 'dataset'),
  wired('partition', 'job', 'train', 'job'),
  wired('train', 'result', 'track', 'checkpoint'),
  wired('track', 'checkpoint', 'evaluate', 'checkpoint'),
  wired('partition', 'eval', 'evaluate', 'dataset'),
  wired('evaluate', 'approval', 'register', 'approval'),
  wired('register', 'model', 'deploy', 'model'),
  wired('deploy', 'model', 'serve', 'model'),
  wired('reqs', 'request', 'serve', 'request'),
  wired('serve', 'prediction', 'observe', 'prediction'),
];

describe('플레이그라운드 구성', () => {
  it('강의 완료 집계에는 넣지 않고 labFor로만 찾는다', () => {
    expect(labFor('playground')).toBe(lab);
    expect(lab.freeform).toBe(true);
  });

  it('서비스와 노드가 모두 정의·설명·아이콘을 갖는다', () => {
    for (const [service, kinds] of Object.entries(playgroundTools)) {
      expect(lab.tools[service], service).toEqual(kinds);
      expect(lab.tools.root).toContain(service);
      for (const name of [service, ...kinds]) {
        expect(lab.labels[name], name).toBeTruthy();
        expect(playgroundView.icons[name], name).toBeTruthy();
        expect(playgroundView.hints[name], name).toBeTruthy();
      }
      for (const kind of kinds) expect(lab.strategies[kind], kind).toBeTypeOf('function');
    }
    for (const kind of Object.values(playgroundTools).flat())
      for (const direction of ['in', 'out'] as const)
        for (const material of lab.portTypes[kind][direction])
          expect(lab.materials[material], kind + ' ' + material).toBeTruthy();
  });

  it('초기 구성과 저장 형식을 다시 읽을 수 있다', () => {
    const graph = build(pipeline, pipelineWires);
    const raw = JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] });
    expect(signature(parseSaved(raw, lab).graph)).toBe(signature(graph));
    expect(lab.initial().entities.filter((e) => e.type === 'resource')).toHaveLength(0);
  });
});

describe('플레이그라운드 실행', () => {
  it('연결이 없으면 실행하지 않고 안내한다', () => {
    const result = run(build([['raw', 'rawData', 'sources']]));
    expect(result.success).toBe(false);
    expect(result.steps).toHaveLength(0);
    expect(result.message).toContain('연결');
  });

  it('데이터 검증부터 모니터링까지 이어 실행하면 연결된 노드가 모두 성공한다', () => {
    const result = run(build(pipeline, pipelineWires));
    expect(result.steps.map((s) => s.status)).not.toContain('failed');
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(pipeline.length);
    const track = result.steps.find((s) => s.node === 'track');
    expect(track?.message).toContain('에폭 10');
  });

  it('연결하지 않은 노드는 실행 대상에서 빠진다', () => {
    const result = run(build([...pipeline, ['spare', 'trainJob', 'sources']], pipelineWires));
    expect(result.success).toBe(true);
    expect(result.steps.some((s) => s.node === 'spare')).toBe(false);
  });

  it('평가 기준 미달은 승인을 막고 하류가 차단된다', () => {
    const nodes = pipeline.map((n): Node => (n[0] === 'evaluate' ? [n[0], n[1], n[2]] : n));
    const result = run(build(nodes, pipelineWires));
    expect(result.success).toBe(false);
    expect(result.observations).toContain('low-quality');
    expect(result.steps.find((s) => s.node === 'register')?.status).toBe('blocked');
  });

  it('Staging 단계로 등록한 모델은 배포되지 않는다', () => {
    const nodes = pipeline.map((n): Node =>
      n[0] === 'register' ? [n[0], n[1], n[2], { stage: 'staging' }] : n,
    );
    const result = run(build(nodes, pipelineWires));
    expect(result.success).toBe(false);
    expect(result.observations).toContain('stage-blocked');
    expect(result.message).toContain('Production');
  });

  it('데이터 검증은 표본이 적으면 학습으로 보내지 않는다', () => {
    const nodes = pipeline.map((n): Node =>
      n[0] === 'validate' ? [n[0], n[1], n[2], { minSamples: 150 }] : n,
    );
    const result = run(build(nodes, pipelineWires));
    expect(result.success).toBe(false);
    expect(result.observations).toContain('data-invalid');
    expect(result.steps.find((s) => s.node === 'partition')?.status).toBe('blocked');
  });

  it('재학습 트리거는 품질이 낮을 때만 신호를 보낸다', () => {
    const nodes = (quality: string): Node[] => [
      ['ops', 'opsLog', 'sources', { quality }],
      ['collect', 'collectMetrics', 'monitoring'],
      ['trigger', 'trigger', 'monitoring'],
    ];
    const wires = [
      wired('ops', 'metrics', 'collect', 'metrics'),
      wired('ops', 'labels', 'collect', 'labels'),
      wired('collect', 'signal', 'trigger', 'signal'),
    ];
    const low = run(build(nodes('low'), wires));
    expect(low.success).toBe(true);
    expect(low.observations).toContain('retrain-triggered');
    const good = run(build(nodes('good'), wires));
    expect(good.success).toBe(false);
    expect(good.message).toContain('재학습을 시작하지 않았습니다');
  });

  it('RAG 질문 응답을 입력 소스에서 이어 만들 수 있다', () => {
    const nodes: Node[] = [
      ['docs', 'textInput', 'sources', { role: 'document' }],
      ['question', 'textInput', 'sources', { role: 'question' }],
      ['doc-embed', 'embed', 'ec2', { space: 'A' }],
      ['q-embed', 'embed', 'ec2', { space: 'A' }],
      ['index', 'index', 'storage'],
      ['search', 'search', 'storage'],
      ['api', 'api', 'gateway'],
    ];
    const wires = [
      wired('docs', 'text', 'doc-embed', 'text'),
      wired('question', 'text', 'q-embed', 'text'),
      wired('doc-embed', 'vector', 'index', 'vector'),
      wired('index', 'index', 'search', 'index'),
      wired('q-embed', 'vector', 'search', 'query'),
      wired('search', 'evidence', 'api', 'evidence'),
      wired('question', 'text', 'api', 'question'),
    ];
    // 저장소 유형이 객체 저장소(기본값)이면 색인과 검색이 차단된다.
    const blocked = run(build(nodes, wires));
    expect(blocked.success).toBe(false);
    expect(blocked.message).toContain('Vector DB');
    let graph = build(nodes, wires);
    graph = applyCommand(
      graph,
      { type: 'setting', id: 'storage', key: 'type', value: 'vector' },
      lab,
    );
    expect(run(graph).success).toBe(true);
    graph = applyCommand(graph, { type: 'setting', id: 'q-embed', key: 'space', value: 'B' }, lab);
    const mismatch = run(graph);
    expect(mismatch.success).toBe(false);
    expect(mismatch.observations).toContain('space-mismatch');
  });

  it('순환 연결은 실행 전에 알려 준다', () => {
    const graph = build(
      [
        ['a', 'validateData', 'ec2'],
        ['b', 'validateData', 'ec2'],
      ],
      [wired('a', 'dataset', 'b', 'dataset'), wired('b', 'dataset', 'a', 'dataset')],
    );
    expect(run(graph).cycle.length).toBeGreaterThan(0);
  });
});

describe('플레이그라운드 AI 조언', () => {
  it('실패한 실행에서만 요청할 수 있고 요청에 구성이 담긴다', () => {
    const nodes = pipeline.map((n): Node =>
      n[0] === 'register' ? [n[0], n[1], n[2], { stage: 'staging' }] : n,
    );
    const graph = build(nodes, pipelineWires);
    const result = run(graph);
    const state = { result, stamp: signature(graph), cursor: result.steps.length, stopped: false };
    expect(canRequestHint('playground', graph, state)).toBe(true);
    const ok = run(build(pipeline, pipelineWires));
    expect(
      canRequestHint('playground', graph, { ...state, result: ok, cursor: ok.steps.length }),
    ).toBe(false);
    const request = buildHintRequest(
      { id: 'playground', title: 't', scenario: 's', summary: 'u' },
      graph,
      state,
    );
    expect(request.lessonId).toBe('playground');
    expect(request.ruleCheck.issues.join(' ')).toContain('Production');
    expect(request.nodes.some((node) => node.kind === 'deployModel')).toBe(true);
  });
});
