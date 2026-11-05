import { simulate } from '../activities/simulation';
import { lessonById } from '../curriculum/blockml';
import { resourceDefaults, type Service } from '../console/resources';
import {
  examplePlayground,
  validatePlayground,
  type PlaygroundData,
  type PlaygroundIssue,
} from './model';
export interface PipelineStage {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'blocked';
  artifact: string;
}
export interface PipelineResult {
  issues: PlaygroundIssue[];
  stages: PipelineStage[];
  headline: string;
  observations: string[];
}
const order: Service[] = [
  'dataset',
  'preprocess',
  'training',
  'evaluation',
  'registry',
  'serving',
  'monitoring',
];
export function runPipeline(data: PlaygroundData): PipelineResult {
  const issues = validatePlayground(data);
  const byKind = new Map(
    order.map((k) => [k, data.resources.filter((r) => r.config.service === k)]),
  );
  for (const k of order)
    if (byKind.get(k)!.length !== 1)
      issues.push({ message: `종합 실행에는 ${k} 단계가 정확히 하나 필요합니다.` });
  const pairs: [Service, Service][] = [
    ['dataset', 'preprocess'],
    ['preprocess', 'training'],
    ['preprocess', 'evaluation'],
    ['training', 'evaluation'],
    ['evaluation', 'registry'],
    ['registry', 'serving'],
    ['serving', 'monitoring'],
  ];
  for (const [from, to] of pairs) {
    const f = byKind.get(from)?.[0],
      t = byKind.get(to)?.[0];
    if (
      f &&
      t &&
      !data.edges.some((e) => e.source === f.id && e.target === t.id && e.relation !== 'feedback')
    )
      issues.push({
        node: t.id,
        message: `${f.config.name} → ${t.config.name} 입력 연결이 필요합니다.`,
      });
  }
  if (issues.length)
    return {
      issues,
      stages: [],
      headline: '입력과 단계 구성을 먼저 확인하세요.',
      observations: [],
    };
  const threshold = Number(byKind.get('evaluation')![0].config.settings.threshold),
    pass = 0.85 >= threshold;
  const artifacts = [
    '원본 데이터 100개',
    '학습용 80개 / 평가용 20개',
    '모델 v1 · 가중치',
    '정확도 0.85',
    '등록 모델 v1',
    '예측 응답',
    '운영 지표·품질 피드백',
  ];
  const stages = order.map((kind, i) => {
    const r = byKind.get(kind)![0];
    return {
      id: r.id,
      name: r.config.name,
      status: (!pass && i === 3
        ? 'failed'
        : !pass && i > 3
          ? 'blocked'
          : 'success') as PipelineStage['status'],
      artifact: !pass && i > 3 ? '평가 실패로 실행 차단' : artifacts[i],
    };
  });
  return {
    issues: [],
    stages,
    headline: pass ? '평가 통과 · 전체 파이프라인 완료' : '평가 미달 · 모델 등록·서빙 차단',
    observations: [
      `예시 정확도 0.85 / 통과 기준 ${threshold}`,
      '모니터링 피드백은 다음 개선을 위한 관계이며 현재 실행의 데이터 순환이 아닙니다.',
    ],
  };
}
export const templates = [
  { id: 'pipeline', name: '전체 파이프라인' },
  { id: 'parallel', name: '분산 학습' },
  { id: 'containers', name: '이미지·컨테이너' },
  { id: 'storage', name: 'PV·PVC' },
  { id: 'versioning', name: 'DVC 버전 관리' },
  { id: 'rag', name: 'RAG 검색 흐름' },
  { id: 'release', name: '안전한 배포' },
];
export function templatePlayground(id: string): PlaygroundData {
  if (id === 'pipeline') return { ...examplePlayground(), scenario: 'pipeline' };
  const definitions: Record<string, { nodes: Service[]; edges: [number, number][] }> = {
    parallel: {
      nodes: ['dataset', 'gpu', 'sync', 'evaluation'],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    containers: {
      nodes: ['image', 'container', 'pod'],
      edges: [
        [0, 1],
        [1, 2],
      ],
    },
    storage: {
      nodes: ['pod', 'pvc', 'pv'],
      edges: [
        [0, 1],
        [1, 2],
      ],
    },
    versioning: {
      nodes: ['git-meta', 'cache', 's3', 'dataset'],
      edges: [
        [0, 1],
        [1, 2],
        [1, 3],
      ],
    },
    rag: {
      nodes: ['dataset', 'vector-db', 'context', 'generation'],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    release: {
      nodes: ['router', 'old-model', 'new-model', 'monitoring'],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
    },
  };
  const def = definitions[id];
  if (!def) return { ...examplePlayground(), scenario: 'pipeline' };
  return {
    version: 1,
    scenario: id,
    resources: def.nodes.map((service, i) => ({
      id: `topic-${i}`,
      position: { x: 30 + (i % 2) * 245, y: 35 + Math.floor(i / 2) * 175 },
      config: resourceDefaults(service, `${service} ${i + 1}`),
    })),
    edges: def.edges.map(([a, b]) => ({ source: `topic-${a}`, target: `topic-${b}` })),
  };
}
export function runPlayground(data: PlaygroundData): PipelineResult {
  if (!data.scenario || data.scenario === 'pipeline') return runPipeline(data);
  const issues = validatePlayground(data);
  const template = templates.some((t) => t.id === data.scenario)
    ? templatePlayground(String(data.scenario))
    : undefined;
  if (template) {
    for (const reference of template.resources)
      if (!data.resources.some((r) => r.config.service === reference.config.service))
        issues.push({ message: `이 실험에 ${reference.config.service} 노드가 필요합니다.` });
    for (const edge of template.edges) {
      const from = template.resources.find((r) => r.id === edge.source)!.config.service,
        to = template.resources.find((r) => r.id === edge.target)!.config.service;
      if (
        !data.edges.some(
          (e) =>
            data.resources.find((r) => r.id === e.source)?.config.service === from &&
            data.resources.find((r) => r.id === e.target)?.config.service === to &&
            e.relation !== 'feedback',
        )
      )
        issues.push({ message: `${from} → ${to} 관계를 연결하세요.` });
    }
  }
  if (issues.length)
    return { issues, stages: [], headline: '연결 관계를 확인하세요.', observations: [] };
  const ids: Record<string, string> = {
    parallel: 'data-parallel',
    containers: 'docker-image',
    storage: 'pv-pvc',
    versioning: 'dvc-architecture',
    rag: 'rag',
    release: 'canary',
  };
  const gpu = data.resources.find((r) => r.config.service === 'gpu');
  const lesson =
    lessonById[
      data.scenario === 'parallel'
        ? `${gpu?.config.settings.strategy ?? 'data'}-parallel`
        : ids[data.scenario]
    ];
  if (!lesson)
    return {
      issues: [],
      stages: [],
      headline: '자유 구성 확인 완료',
      observations: ['종합 실행에는 전체 파이프라인 템플릿을 선택하세요.'],
    };
  const answers = {
    ...Object.fromEntries(lesson.fields.map((f) => [f.id, f.initial])),
    ...gpu?.config.settings,
  };
  if (data.scenario === 'storage') answers.persistent = 'pv';
  if (data.scenario === 'rag') answers.evidence = 'relevant';
  const result = simulate(lesson.activity!, answers);
  return {
    issues: [],
    headline: result.headline,
    observations: [result.detail, ...result.metrics.map((m) => `${m.label}: ${m.value}`)],
    stages: result.steps.map((name, i) => ({
      id: `step-${i}`,
      name,
      status: result.warning ? 'failed' : 'success',
      artifact: result.steps[i + 1] ?? '결과 확인',
    })),
  };
}
