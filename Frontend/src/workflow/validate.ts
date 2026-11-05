import { stages, stageByKind } from '../content/lesson';
import type { Graph, Issue, ValidationRule } from './types';

// 전략 패턴: 각 규칙은 같은 계약을 따르며 UI나 시뮬레이션에 의존하지 않는다.
const requiredStages: ValidationRule = {
  id: 'stages',
  check: (graph) =>
    stages.flatMap((stage) => {
      const matches = graph.nodes.filter((node) => node.data.kind === stage.kind);
      if (matches.length === 1) return [];
      return [
        {
          id: `stage-${stage.kind}`,
          message:
            matches.length === 0
              ? `${stage.title} 단계가 없습니다.`
              : `${stage.title} 단계가 여러 개입니다.`,
          hint: '첫 과제에서는 각 단계를 하나씩 구성해 전체 흐름을 확인하세요.',
          nodeIds: matches.map((node) => node.id),
          edgeIds: [],
        },
      ];
    }),
};

const compatiblePorts: ValidationRule = {
  id: 'ports',
  check: (graph) =>
    graph.edges.flatMap((edge) => {
      const source = graph.nodes.find((node) => node.id === edge.source);
      const target = graph.nodes.find((node) => node.id === edge.target);
      const output =
        source &&
        stageByKind[source.data.kind].outputs.find((port) => port.id === edge.sourceHandle);
      const input =
        target &&
        stageByKind[target.data.kind].inputs.find((port) => port.id === edge.targetHandle);
      if (output && input && output.id === input.id) return [];
      return [
        {
          id: `port-${edge.id}`,
          message: '연결된 입출력의 유형이 맞지 않습니다.',
          hint:
            output && input
              ? `${output.label}를 ${input.label} 입력에 전달할 수 없습니다. 알맞은 단계를 거쳐 연결하세요.`
              : '노드에 존재하는 입출력 연결점을 사용하세요.',
          nodeIds: [edge.source, edge.target],
          edgeIds: [edge.id],
        },
      ];
    }),
};

const requiredInputs: ValidationRule = {
  id: 'inputs',
  check: (graph) =>
    graph.nodes.flatMap((node) =>
      stageByKind[node.data.kind].inputs.flatMap((port) => {
        const incoming = graph.edges.filter(
          (edge) => edge.target === node.id && edge.targetHandle === port.id,
        );
        if (incoming.length === 1) return [];
        return [
          {
            id: `input-${node.id}-${port.id}`,
            message: `${stageByKind[node.data.kind].title}: ${port.label} ${incoming.length ? '입력이 여러 개입니다.' : '입력이 없습니다.'}`,
            hint: `${port.label} 입력에는 알맞은 출력 하나를 연결하세요.`,
            nodeIds: [node.id],
            edgeIds: incoming.map((edge) => edge.id),
          },
        ];
      }),
    ),
};

const validThreshold: ValidationRule = {
  id: 'threshold',
  check: (graph) =>
    graph.nodes
      .filter(
        (node) =>
          node.data.kind === 'evaluation' &&
          (node.data.threshold === null ||
            !Number.isFinite(node.data.threshold) ||
            node.data.threshold < 0 ||
            node.data.threshold > 1),
      )
      .map((node) => ({
        id: `threshold-${node.id}`,
        message: '평가 기준은 0부터 1 사이의 숫자여야 합니다.',
        hint: '예: 정확도 80%를 기준으로 하려면 0.80을 입력하세요.',
        nodeIds: [node.id],
        edgeIds: [],
      })),
};

export function topologicalOrder(graph: Graph): string[] {
  const degree = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges)
    if (degree.has(edge.source) && degree.has(edge.target))
      degree.set(edge.target, degree.get(edge.target)! + 1);
  const queue = graph.nodes
    .filter((node) => degree.get(node.id) === 0)
    .map((node) => node.id)
    .sort();
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const edge of graph.edges.filter((edge) => edge.source === id)) {
      if (!degree.has(edge.target)) continue;
      degree.set(edge.target, degree.get(edge.target)! - 1);
      if (degree.get(edge.target) === 0) {
        queue.push(edge.target);
        queue.sort();
      }
    }
  }
  return order;
}

const acyclicGraph: ValidationRule = {
  id: 'cycle',
  check: (graph) => {
    const ordered = topologicalOrder(graph);
    if (ordered.length === graph.nodes.length) return [];
    return [
      {
        id: 'cycle',
        message: '워크플로에 순환 연결이 있습니다.',
        hint: '결과가 이전 단계로 돌아가지 않도록 연결을 정리하세요.',
        nodeIds: graph.nodes.filter((node) => !ordered.includes(node.id)).map((node) => node.id),
        edgeIds: [],
      },
    ];
  },
};

export const rules: ValidationRule[] = [
  requiredStages,
  compatiblePorts,
  requiredInputs,
  validThreshold,
  acyclicGraph,
];
export function validateGraph(graph: Graph): Issue[] {
  return rules.flatMap((rule) => rule.check(graph));
}
