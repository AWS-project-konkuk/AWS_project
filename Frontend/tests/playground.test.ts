import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import {
  editablePortTypes,
  findPort,
  signature,
  type Graph,
  type SettingValue,
} from '../src/systemLab/lab';
import { labFor, playgroundLab as lab } from '../src/systemLab/labs';
import { datum, wired } from '../src/systemLab/labs/kit';
import { exampleWorkflows, examplePipeline } from '../src/systemLab/labs/playground-example';
import { mergedSpecs, playgroundTools } from '../src/systemLab/labs/playground';
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
  ['raw', 'input', 'sources', { source: 'raw' }],
  ['reqs', 'input', 'sources', { source: 'req-10' }],
  ['read', 'storageOp', 'storage', { operation: 'read' }],
  ['validate', 'validateData', 'ec2'],
  ['partition', 'partition', 'ec2'],
  ['train', 'train', 'ec2'],
  ['track', 'trackExperiment', 'ec2'],
  ['evaluate', 'evaluate', 'ec2', { threshold: 0.8 }],
  ['register', 'publish', 'registry', { action: 'register-production' }],
  ['deploy', 'publish', 'gateway', { action: 'deploy' }],
  ['serve', 'serve', 'gateway', { mode: 'infer' }],
  ['observe', 'observe', 'monitoring', { target: 'responses' }],
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
    const result = run(build([['raw', 'input', 'sources', { source: 'raw' }]]));
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
    const result = run(
      build([...pipeline, ['spare', 'input', 'sources', { source: 'job-8' }]], pipelineWires),
    );
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
      n[0] === 'register' ? [n[0], n[1], n[2], { action: 'register-staging' }] : n,
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
      ['ops', 'input', 'sources', { source: quality === 'low' ? 'ops-low' : 'ops-good' }],
      ['collect', 'observe', 'monitoring', { target: 'metrics' }],
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
      ['docs', 'input', 'sources', { source: 'doc' }],
      ['question', 'input', 'sources', { source: 'question' }],
      ['doc-embed', 'embed', 'ec2', { space: 'A' }],
      ['q-embed', 'embed', 'ec2', { space: 'A' }],
      ['index', 'storageOp', 'storage', { operation: 'index' }],
      ['search', 'storageOp', 'storage', { operation: 'search' }],
      ['api', 'serve', 'gateway', { mode: 'api' }],
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

  it('순환 연결은 3번 반복 실행하고 이전 반복의 값을 다음 반복에 전달한다', () => {
    const counter = (ctx: Parameters<(typeof lab.strategies)['validateData']>[0]) => {
      const input = ctx.byPort['in-dataset']?.[0];
      const before = input?.type === 'data' ? Number(input.data.count) : 0;
      const count = before + 1;
      ctx.emit(datum('dataset', '횟수 ' + count, { count }));
      ctx.report([{ label: ctx.node.id, value: String(count) }]);
      return '횟수 ' + count;
    };
    const counting = { ...lab, strategies: { ...lab.strategies, validateData: counter } };
    const graph = build(
      [
        ['a', 'validateData', 'ec2'],
        ['b', 'validateData', 'ec2'],
      ],
      [wired('a', 'dataset', 'b', 'dataset'), wired('b', 'dataset', 'a', 'dataset')],
    );
    const result = runLab(graph, 'loop', counting);
    expect(result.success).toBe(true);
    expect(result.cycle).toEqual([]);
    expect(result.message).toContain('3번 반복');
    // 반복마다 a, b가 차례로 1씩 늘어 마지막 반복의 b는 6이 된다.
    expect(Object.fromEntries(result.metrics.map((m) => [m.label, m.value]))).toMatchObject({
      b: '6',
      '순환 반복': '3회',
    });
    expect(result.steps.map((step) => step.node)).toEqual(['a', 'b']);
  });

  it('순환이 없으면 한 번만 실행한다', () => {
    const result = run(build(pipeline, pipelineWires));
    expect(result.metrics.some((m) => m.label === '순환 반복')).toBe(false);
  });
});

describe('플레이그라운드 AI 조언', () => {
  it('실패한 실행에서만 요청할 수 있고 요청에 구성이 담긴다', () => {
    const nodes = pipeline.map((n): Node =>
      n[0] === 'register' ? [n[0], n[1], n[2], { action: 'register-staging' }] : n,
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
    expect(request.nodes.some((node) => node.kind === 'publish' && node.id === 'deploy')).toBe(
      true,
    );
  });
});

describe('입출력 포트 조절과 노드 통합', () => {
  it('모든 노드의 포트를 추가·삭제·타입 변경할 수 있다', () => {
    const graph = build([['v', 'validateData', 'ec2']]);
    expect(lab.managedPorts).toEqual({});
    expect(editablePortTypes(lab, 'validateData', 'in')).toEqual(['dataset']);
    expect(editablePortTypes(lab, 'train', 'out')).toEqual([
      'checkpoint',
      'gradient',
      'activation',
      'partial',
    ]);
    const added = applyCommand(
      graph,
      { type: 'port-add', id: 'v', port: 'extra', direction: 'in', material: 'dataset' },
      lab,
    );
    expect(findPort(added, { node: 'v', port: 'extra' })?.material).toBe('dataset');
    const removed = applyCommand(added, { type: 'port-remove', id: 'v', port: 'extra' }, lab);
    expect(findPort(removed, { node: 'v', port: 'extra' })).toBeUndefined();
    expect(() =>
      applyCommand(
        graph,
        { type: 'port-add', id: 'v', port: 'x', direction: 'in', material: 'request' },
        lab,
      ),
    ).toThrow('처리할 수 없는');
  });

  it('통합 노드는 설정으로 변형을 고르면 포트가 바뀌고 맞지 않는 연결은 지워진다', () => {
    let graph = build(
      [
        ['in', 'input', 'sources', { source: 'raw' }],
        ['store', 'storageOp', 'storage', { operation: 'read' }],
      ],
      [wired('in', 'objects', 'store', 'objects')],
    );
    expect(graph.connections).toHaveLength(1);
    expect(findPort(graph, { node: 'in', port: 'out-objects' })).toBeDefined();
    graph = applyCommand(graph, { type: 'setting', id: 'in', key: 'source', value: 'req-10' }, lab);
    expect(findPort(graph, { node: 'in', port: 'out-objects' })).toBeUndefined();
    expect(findPort(graph, { node: 'in', port: 'out-request' })?.material).toBe('request');
    expect(graph.connections).toHaveLength(0);
  });

  it('합쳐도 원래 노드가 하던 일을 모두 고를 수 있다', () => {
    const covered = Object.values(mergedSpecs).flatMap((spec) => spec.variants.map((v) => v.from));
    for (const kind of [
      'rawData',
      'trainJob',
      'textInput',
      'requestStream',
      'clickLog',
      'featureQuery',
      'workspace',
      'opsLog',
      'repo',
      'file',
      'readObjects',
      'saveModel',
      'index',
      'search',
      'defineFeature',
      'lookupFeature',
      'registerModel',
      'deployModel',
      'infer',
      'api',
      'observeResponses',
      'collectMetrics',
    ])
      expect(covered, kind).toContain(kind);
    const nodeKinds = Object.values(playgroundTools).flat();
    expect(new Set(nodeKinds).size).toBeLessThan(25);
  });
});

describe('MLOps 예시 5단계', () => {
  const levels = exampleWorkflows.map((example) => ({ example, graph: example.build() }));
  const nodeCount = (graph: Graph) => graph.entities.filter((e) => e.type === 'resource').length;

  it('5개이며 단계가 올라갈수록 노드와 연결이 늘어난다', () => {
    expect(levels.map(({ example }) => example.id)).toEqual([
      'level-1',
      'level-2',
      'level-3',
      'level-4',
      'level-5',
    ]);
    for (let i = 1; i < levels.length; i++) {
      expect(nodeCount(levels[i].graph)).toBeGreaterThan(nodeCount(levels[i - 1].graph));
      expect(levels[i].graph.connections.length).toBeGreaterThan(
        levels[i - 1].graph.connections.length,
      );
    }
  });

  it('노드가 없는 서비스는 두지 않고 빠진 서비스는 다시 추가할 수 있다', () => {
    for (const { example, graph } of levels) {
      const services = graph.entities.filter((e) => e.type === 'system' && e.parent === 'root');
      for (const service of services)
        expect(
          graph.entities.some((e) => e.type === 'resource' && e.parent === service.id),
          example.title + ' · ' + service.id,
        ).toBe(true);
    }
    const first = levels[0].graph;
    expect(first.entities.some((e) => e.id === 'gateway')).toBe(false);
    const added = applyCommand(
      first,
      { type: 'add', id: 'gateway', kind: 'gateway', parent: 'root' },
      lab,
    );
    expect(added.entities.some((e) => e.id === 'gateway')).toBe(true);
  });

  it('모든 단계가 오류 없이 끝까지 실행된다', () => {
    for (const { example, graph } of levels) {
      const result = run(graph);
      const failed = result.steps.filter((s) => s.status !== 'success');
      expect(
        failed.map((s) => s.node + ': ' + s.message),
        example.title,
      ).toEqual([]);
      expect(result.success, example.title).toBe(true);
      expect(result.steps, example.title).toHaveLength(nodeCount(graph));
    }
  });

  it('저장 형식으로 다시 읽을 수 있다', () => {
    for (const { graph } of levels) {
      const raw = JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] });
      expect(signature(parseSaved(raw, lab).graph)).toBe(signature(graph));
    }
  });
});

describe('MLOps 5단계의 순환', () => {
  const graph = examplePipeline();

  it('재학습 모델을 현재 모델로 돌려보내는 순환을 3번 반복한다', () => {
    const result = run(graph);
    expect(result.success).toBe(true);
    expect(result.metrics.find((m) => m.label === '순환 반복')?.value).toBe('3회');
    expect(result.cycle).toEqual([]);
    // 첫 반복은 처음 배포한 model-v1, 이후에는 순환으로 돌아온 재학습 모델을 현재 모델로 쓴다.
    expect(result.steps.find((s) => s.node === 'diagnose')?.message).toContain(
      '현재 모델 feature-fix-v2',
    );
  });

  it('순환 입력을 끊으면 한 번만 실행하고 처음 모델을 쓴다', () => {
    const cut = applyCommand(
      graph,
      { type: 'disconnect', ids: ['deploy2:out-model>diagnose:in-current'] },
      lab,
    );
    const result = run(cut);
    expect(result.metrics.some((m) => m.label === '순환 반복')).toBe(false);
    expect(result.steps.find((s) => s.node === 'diagnose')?.message).toContain('현재 모델 model-v');
  });

  it('현재 모델 입력만 여러 선을 받고 다른 입력은 하나만 받는다', () => {
    const ports = graph.entities.find((e) => e.id === 'diagnose');
    const multiple = (ports?.ports ?? []).filter((p) => p.multiple).map((p) => p.id);
    expect(multiple).toEqual(['in-current']);
  });
});

describe('MLOps 예시 파이프라인', () => {
  const graph = examplePipeline();
  const result = run(graph);

  it('입력부터 서빙·관측, 재학습, 피처, 버전 복원까지 모두 성공한다', () => {
    const failed = result.steps.filter((s) => s.status !== 'success');
    expect(failed.map((s) => s.node + ': ' + s.message)).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(graph.entities.filter((e) => e.type === 'resource').length);
  });

  it('운영 지표가 재학습을 시작하고 재학습 모델이 평가 승인을 받는다', () => {
    expect(result.observations).toContain('retrain-triggered');
    expect(result.steps.find((s) => s.node === 'reeval')?.message).toContain('평가 승인');
  });

  it('서비스 영역이 겹치지 않고 저장 형식으로 다시 읽을 수 있다', () => {
    const areas = graph.entities.filter((e) => e.type === 'system' && e.parent === 'root');
    for (const a of areas)
      for (const b of areas) {
        if (a === b || a.type !== 'system' || b.type !== 'system') continue;
        const apart =
          a.position.x + a.width <= b.position.x ||
          b.position.x + b.width <= a.position.x ||
          a.position.y + a.height <= b.position.y ||
          b.position.y + b.height <= a.position.y;
        expect(apart, a.id + ' / ' + b.id).toBe(true);
      }
    const raw = JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] });
    expect(signature(parseSaved(raw, lab).graph)).toBe(signature(graph));
  });
});
