import { topologicalOrder, validateGraph } from '../workflow/validate';
import type { Graph, SimulationStep } from '../workflow/types';

export const exampleAccuracy = 0.85;

export function simulate(graph: Graph): SimulationStep[] {
  if (validateGraph(graph).length) return [];
  const results = new Map<string, SimulationStep>();
  for (const id of topologicalOrder(graph)) {
    const node = graph.nodes.find((candidate) => candidate.id === id)!;
    const upstreamFailed = graph.edges
      .filter((edge) => edge.target === id)
      .some((edge) => {
        const status = results.get(edge.source)?.status;
        return status === 'failed' || status === 'blocked';
      });
    let status: SimulationStep['status'] = upstreamFailed ? 'blocked' : 'success';
    let artifact = '';
    let explanation = '';
    switch (node.data.kind) {
      case 'dataset':
        artifact = 'dataset:v1 · 예시 데이터 1,000건';
        explanation = '버전이 기록된 원본 데이터를 가져왔습니다.';
        break;
      case 'preprocess':
        artifact = 'train:v1 800건 / test:v1 200건';
        explanation = '학습용과 평가용을 분리했습니다. 평가용 데이터는 학습에 전달하지 않습니다.';
        break;
      case 'training':
        artifact = 'model:v1 ← train:v1';
        explanation = '학습용 데이터로 만든 예시 모델입니다. 실제 학습은 실행하지 않습니다.';
        break;
      case 'evaluation': {
        const passed = exampleAccuracy >= node.data.threshold!;
        if (!upstreamFailed) status = passed ? 'success' : 'failed';
        artifact = `정확도 ${exampleAccuracy.toFixed(2)} / 기준 ${node.data.threshold!.toFixed(2)}`;
        explanation = passed
          ? '예시 모델이 평가 기준을 통과했습니다.'
          : '평가 기준 미달로 모델 등록과 서빙을 차단합니다.';
        break;
      }
      case 'registry':
        artifact = 'registry:model:v1';
        explanation = '평가를 통과한 모델과 데이터·평가 기록을 함께 등록했습니다.';
        break;
      case 'serving':
        artifact = 'serving:model:v1';
        explanation =
          '등록된 모델의 예측 제공을 모의 완료했습니다. 실제 서비스는 배포하지 않습니다.';
        break;
    }
    if (upstreamFailed) {
      artifact = '생성되지 않음';
      explanation = '이전 단계가 통과하지 못해 진행할 수 없습니다.';
    }
    results.set(id, { nodeId: id, kind: node.data.kind, status, artifact, explanation });
  }
  return [...results.values()];
}
