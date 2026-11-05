import type { ExperimentResult, LabState, Lesson } from '../curriculum/types';
import { evaluateGoals, runExperiment } from '../curriculum/engine';
import {
  parseResource,
  resourceDefaults,
  resourceErrors,
  resourceSummary,
  serviceById,
  type ResourceConfig,
  type Service,
} from './resources';

export interface ResourceBinding {
  node: string;
  service: Service;
  fields?: Record<string, string>;
  constants?: Record<string, string>;
}
const bind = (
  node: string,
  service: Service,
  fields?: Record<string, string>,
  constants?: Record<string, string>,
): ResourceBinding => ({ node, service, fields, constants });
const bindings: Record<string, ResourceBinding[]> = {
  'aws-ec2-ebs': [
    bind('ami', 'ami'),
    bind('ec2', 'ec2'),
    bind('ebs', 'ebs', { deletion: 'volume' }),
  ],
  'aws-s3-versions': [bind('bucket', 's3', { versioning: 'versioning' })],
  'aws-vpc-security': [
    bind('alb', 'alb'),
    bind('sg', 'security-group', { source: 'source', port: 'port' }),
    bind('service', 'ec2'),
  ],
  'aws-container-services': [
    bind('ecr', 'ecr'),
    bind('runtime', 'ecs', { compute: 'compute' }, { orchestrator: 'ecs' }),
  ],
  'aws-alb-health': [
    bind('alb', 'alb'),
    bind('target', 'target-group', { healthPath: 'healthPath' }),
    bind('server', 'ec2'),
  ],
  'aws-mlops-map': [bind('data', 's3'), bind('compute', 'ec2'), bind('artifact', 's3')],
  'iam-access': [bind('job', 'ec2'), bind('role', 'iam', { policy: 'policy' }), bind('s3', 's3')],
  'private-network': [
    bind('ec2', 'ec2'),
    bind('route', 'route-table', { target: 'route' }),
    bind('s3', 's3'),
  ],
  'spot-checkpoint': [bind('job', 'ec2'), bind('s3', 's3')],
  'container-image': [bind('ecr', 'ecr')],
  'storage-types': [bind('s3', 's3')],
};
export function lessonBindings(lesson: Lesson): ResourceBinding[] {
  return bindings[lesson.id] ?? [];
}
export function draftForLesson(
  lesson: Lesson,
  lab: LabState,
  binding: ResourceBinding,
): ResourceConfig {
  const current = lab.resources?.[binding.node];
  if (current) return current;
  const draft = resourceDefaults(binding.service, `${lesson.id}-${binding.node}`.slice(0, 63));
  for (const [configField, answerField] of Object.entries(binding.fields ?? {})) {
    const answer = lab.answers[answerField];
    if (typeof answer === 'string' || typeof answer === 'number')
      draft.settings[configField] = answer;
  }
  return draft;
}
export function configureLessonResource(
  lesson: Lesson,
  lab: LabState,
  binding: ResourceBinding,
  resource: ResourceConfig,
): LabState {
  if (binding.service !== resource.service || resourceErrors(resource).length)
    throw new Error('과제의 서비스 설정과 일치하지 않습니다.');
  const answers = { ...lab.answers, ...binding.constants };
  for (const [configField, answerField] of Object.entries(binding.fields ?? {})) {
    const answer = resource.settings[configField];
    const field = lesson.fields.find((field) => field.id === answerField);
    if (!field || (field.options && !field.options.some((option) => option.value === answer)))
      throw new Error('과제 설정 값이 올바르지 않습니다.');
    answers[answerField] = answer;
  }
  return {
    ...lab,
    answers,
    resources: { ...lab.resources, [binding.node]: resource },
    completed: false,
  };
}
export function provisionedGoals(lesson: Lesson, lab: LabState) {
  return [
    ...evaluateGoals(lesson, lab),
    ...lessonBindings(lesson).map((binding) => ({
      id: `provision-${binding.node}`,
      label: `${lesson.nodes.find((node) => node.id === binding.node)!.title} 생성`,
      hint: '리소스 목록의 생성 버튼에서 필요한 설정을 선택하세요.',
      passed: Boolean(lab.resources?.[binding.node]),
    })),
  ];
}
export function runProvisionedExperiment(lesson: Lesson, lab: LabState): ExperimentResult {
  const missing = provisionedGoals(lesson, lab).filter(
    (goal) => goal.id.startsWith('provision-') && !goal.passed,
  );
  return missing.length
    ? {
        success: false,
        headline: '먼저 콘솔에서 필요한 리소스를 생성하세요.',
        observations: missing.map((goal) => goal.label),
        metrics: [],
      }
    : runExperiment(lesson, lab);
}
export function lessonCanvas(lesson: Lesson, lab: LabState) {
  const managed = lessonBindings(lesson);
  const nodes = lab.nodes
    .filter(
      (node) => !managed.some((binding) => binding.node === node.id) || lab.resources?.[node.id],
    )
    .map((node) => {
      const resource = lab.resources?.[node.id];
      return resource
        ? {
            ...node,
            data: {
              ...node.data,
              detail: resourceSummary(resource),
              resourceName: resource.name,
              service: serviceById[resource.service].name,
            },
          }
        : node;
    });
  return {
    nodes,
    edges: lab.edges.filter(
      (edge) =>
        nodes.some((node) => node.id === edge.source) &&
        nodes.some((node) => node.id === edge.target),
    ),
  };
}
export function readLessonResources(
  lesson: Lesson,
  lab: LabState,
  raw: unknown,
): Record<string, ResourceConfig> {
  const managed = lessonBindings(lesson);
  if (raw === undefined)
    return Object.fromEntries(
      managed
        .filter((binding) =>
          Object.entries(binding.constants ?? {}).every(
            ([key, value]) => lab.answers[key] === value,
          ),
        )
        .map((binding) => [binding.node, draftForLesson(lesson, lab, binding)]),
    );
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('강의 리소스 설정을 읽을 수 없습니다.');
  const resources: Record<string, ResourceConfig> = {};
  let current = lab;
  for (const [id, value] of Object.entries(raw)) {
    const binding = managed.find((binding) => binding.node === id);
    if (!binding) throw new Error('과제에 없는 AWS 리소스입니다.');
    const resource = parseResource(value);
    if (resourceErrors(resource, Object.values(resources)).length)
      throw new Error('중복 리소스 설정입니다.');
    current = configureLessonResource(lesson, current, binding, resource);
    for (const answer of [
      ...Object.values(binding.fields ?? {}),
      ...Object.keys(binding.constants ?? {}),
    ])
      if (current.answers[answer] !== lab.answers[answer])
        throw new Error('리소스 설정과 과제 설정이 일치하지 않습니다.');
    resources[id] = resource;
  }
  return resources;
}
