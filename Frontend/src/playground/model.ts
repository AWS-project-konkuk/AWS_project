import type { ResourceConfig } from '../console/resources';
import { resourceDefaults, serviceById } from '../console/resources';
import { createConnection } from '../curriculum/engine';
import type { LearningNode } from '../curriculum/types';
import { parseNodeConfig, nodeErrors } from '../nodes/config';
export interface PlacedResource {
  id: string;
  position: { x: number; y: number };
  config: ResourceConfig;
}
export interface PlaygroundData {
  version: 1;
  resources: PlacedResource[];
  edges: { source: string; target: string; relation?: 'feedback' }[];
  scenario?: string;
}
export interface PlaygroundIssue {
  node?: string;
  message: string;
}
export const playgroundKey = 'flow-lab:playground:v1';
export const emptyPlayground = (): PlaygroundData => ({ version: 1, resources: [], edges: [] });
const record = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v);
export function parsePlayground(raw: string): PlaygroundData {
  const value: unknown = JSON.parse(raw);
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.resources) ||
    !Array.isArray(value.edges)
  )
    throw new Error('Playground 저장 형식이 올바르지 않습니다.');
  const ids = new Set<string>();
  const resources: PlacedResource[] = [];
  for (const item of value.resources) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      !record(item.position) ||
      typeof item.position.x !== 'number' ||
      !Number.isFinite(item.position.x) ||
      typeof item.position.y !== 'number' ||
      !Number.isFinite(item.position.y)
    )
      throw new Error('리소스 위치를 읽을 수 없습니다.');
    const config = parseNodeConfig(item.config);
    if (
      nodeErrors(
        config,
        resources.map((resource) => resource.config),
      ).length
    )
      throw new Error('리소스 이름이 중복됩니다.');
    resources.push({ id: item.id, position: { x: item.position.x, y: item.position.y }, config });
    ids.add(item.id);
  }
  const edges: PlaygroundData['edges'] = [];
  for (const edge of value.edges) {
    if (
      !record(edge) ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string' ||
      !ids.has(edge.source) ||
      !ids.has(edge.target) ||
      edge.source === edge.target ||
      edges.some((previous) => previous.source === edge.source && previous.target === edge.target)
    )
      throw new Error('Playground 연결을 읽을 수 없습니다.');
    if (edge.relation !== undefined && edge.relation !== 'feedback')
      throw new Error('알 수 없는 관계입니다.');
    edges.push({
      source: edge.source,
      target: edge.target,
      ...(edge.relation === 'feedback' ? { relation: 'feedback' as const } : {}),
    });
  }
  return {
    version: 1,
    resources,
    edges,
    ...(typeof value.scenario === 'string' ? { scenario: value.scenario } : {}),
  };
}
export function playgroundCanvas(data: PlaygroundData) {
  const nodes: LearningNode[] = data.resources.map((resource) => ({
    id: resource.id,
    type: 'resource',
    position: resource.position,
    data: {
      title: resource.config.name,
      detail: serviceById[resource.config.service].description,
      tone: '#9a87db',
      service: serviceById[resource.config.service].name,
    },
  }));
  return {
    nodes,
    edges: data.edges.map((edge) => ({
      ...createConnection(edge.source, edge.target),
      ...(edge.relation === 'feedback'
        ? {
            label: '개선 피드백',
            style: { strokeDasharray: '6 4' },
            data: { relation: 'feedback' },
          }
        : {}),
    })),
  };
}
const allowed: Record<string, string[]> = {
  monitoring: [],
  gpu: ['sync', 'gpu', 'evaluation'],
  sync: ['evaluation', 'training'],
  image: ['container'],
  container: ['pod'],
  pod: ['pvc'],
  pvc: ['pv'],
  pv: ['training'],
  'git-meta': ['cache'],
  cache: ['s3', 'dataset'],
  'vector-db': ['context'],
  context: ['generation'],
  generation: ['serving'],
  router: ['old-model', 'new-model'],
  'old-model': ['monitoring'],
  'new-model': ['monitoring'],
  dataset: ['preprocess', 'training', 'evaluation', 'gpu', 'vector-db'],
  preprocess: ['training', 'evaluation'],
  training: ['evaluation'],
  evaluation: ['registry'],
  registry: ['serving'],
  serving: ['monitoring'],
  ami: ['ec2'],
  ec2: ['s3', 'ebs', 'route-table', 'ecr'],
  s3: ['ec2', 'ecs'],
  iam: ['ec2', 'ecs', 's3', 'ecr'],
  'security-group': ['ec2', 'alb', 'ecs'],
  'route-table': ['s3', 'ec2'],
  alb: ['target-group', 'ec2', 'ecs'],
  'target-group': ['ec2', 'ecs'],
  ecr: ['ecs', 'ec2'],
  ecs: ['s3', 'ebs'],
  ebs: ['ec2'],
};
export function validatePlayground(data: PlaygroundData): PlaygroundIssue[] {
  if (!data.resources.length) return [{ message: '목록에서 노드를 추가하고 연결해 보세요.' }];
  const issues: PlaygroundIssue[] = [];
  const resourceById = new Map(data.resources.map((resource) => [resource.id, resource]));
  const seenEdges = new Set<string>();
  for (const resource of data.resources)
    for (const message of nodeErrors(
      resource.config,
      data.resources.filter((other) => other.id !== resource.id).map((other) => other.config),
    ))
      issues.push({ node: resource.id, message });
  for (const edge of data.edges) {
    const edgeId = `${edge.source}->${edge.target}`;
    if (seenEdges.has(edgeId)) issues.push({ message: '동일한 연결이 중복되어 있습니다.' });
    seenEdges.add(edgeId);
    const from = resourceById.get(edge.source),
      to = resourceById.get(edge.target);
    if (!from || !to) {
      issues.push({ message: '존재하지 않는 리소스의 연결입니다.' });
      continue;
    }
    if (
      edge.relation === 'feedback' &&
      !(from.config.service === 'monitoring' && to.config.service === 'dataset')
    )
      issues.push({
        node: from.id,
        message: '개선 피드백은 모니터링 → 데이터셋 관계에만 사용합니다.',
      });
    if (edge.relation !== 'feedback' && !allowed[from.config.service]?.includes(to.config.service))
      issues.push({
        node: from.id,
        message: `${from.config.name} → ${to.config.name}: 이 실습의 연결 규칙에 없는 관계입니다.`,
      });
    if (
      from.config.service === 'ami' &&
      to.config.service === 'ec2' &&
      from.config.settings.image !== to.config.settings.image
    )
      issues.push({ node: to.id, message: 'AMI와 EC2에서 선택한 시작 이미지가 다릅니다.' });
  }
  const visited = new Set<string>(),
    active = new Set<string>();
  const cycle = (id: string): boolean => {
    if (active.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    active.add(id);
    for (const edge of data.edges.filter(
      (edge) =>
        edge.source === id &&
        !(
          edge.relation === 'feedback' &&
          resourceById.get(edge.source)?.config.service === 'monitoring' &&
          resourceById.get(edge.target)?.config.service === 'dataset'
        ),
    ))
      if (cycle(edge.target)) return true;
    active.delete(id);
    return false;
  };
  if (data.resources.some((resource) => cycle(resource.id)))
    issues.push({
      message: '순환 연결이 있습니다. 이 Playground에서는 한 방향의 워크플로를 구성하세요.',
    });
  if (data.resources.length > 1)
    for (const resource of data.resources)
      if (!data.edges.some((edge) => edge.source === resource.id || edge.target === resource.id))
        issues.push({
          node: resource.id,
          message: `${resource.config.name}의 역할을 다른 리소스와 연결하세요.`,
        });
  return issues;
}
export const playgroundSignature = (data: PlaygroundData) =>
  JSON.stringify({
    resources: data.resources
      .map(({ id, config }) => ({ id, config }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...data.edges].sort((a, b) =>
      `${a.source}->${a.target}`.localeCompare(`${b.source}->${b.target}`),
    ),
    scenario: data.scenario,
  });
export function examplePlayground(): PlaygroundData {
  const templates = [
    { id: 'data', kind: 'dataset', name: '원본 데이터' },
    { id: 'preprocess', kind: 'preprocess', name: '데이터 전처리' },
    { id: 'compute', kind: 'training', name: '모델 학습' },
    { id: 'evaluate', kind: 'evaluation', name: '성능 평가' },
    { id: 'model', kind: 'registry', name: '모델 등록' },
    { id: 'serving', kind: 'serving', name: '모델 서빙' },
    { id: 'monitor', kind: 'monitoring', name: '모델 모니터링' },
  ] as const;
  return {
    version: 1,
    resources: templates.map((template, index) => ({
      id: template.id,
      position: { x: 30 + (index % 2) * 245, y: 35 + Math.floor(index / 2) * 195 },
      config: resourceDefaults(template.kind, template.name),
    })),
    edges: [
      { source: 'data', target: 'preprocess' },
      { source: 'preprocess', target: 'compute' },
      { source: 'preprocess', target: 'evaluate' },
      { source: 'compute', target: 'evaluate' },
      { source: 'evaluate', target: 'model' },
      { source: 'model', target: 'serving' },
      { source: 'serving', target: 'monitor' },
      { source: 'monitor', target: 'data', relation: 'feedback' },
    ],
  };
}
