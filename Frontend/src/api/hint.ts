import { api } from './client';
import type { RunResult } from '../systemLab/engine';
import type { Connection, ResourceEntity, SystemEntity } from '../systemLab/model';

/** Proposed /api/ai/hint contract for the unit 1 pilot; not implemented by Java yet. */
export interface HintRequest {
  schemaVersion: 1;
  lessonId: 'week2-workflow';
  runId: string;
  graphSignature: string;
  lesson: { title: string; task: string; summary: string };
  requirements: { requestIds: number[]; requiredPods: number };
  workflow: {
    nodes: (
      Omit<SystemEntity, 'position' | 'width' | 'height'> | Omit<ResourceEntity, 'position'>
    )[];
    connections: Connection[];
    serviceRoutes: Connection[];
  };
  ruleCheck: Omit<RunResult, 'id' | 'success'> & { success: false };
}

/** Success is deliberately excluded: successful runs do not receive advice. */
export interface HintResponse {
  status: 'ok' | 'fallback';
  concept: string;
  hint: string;
}

function isHintResponse(value: unknown): value is HintResponse {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    (data.status === 'ok' || data.status === 'fallback') &&
    typeof data.concept === 'string' &&
    Boolean(data.concept.trim()) &&
    Array.from(data.concept).length <= 200 &&
    typeof data.hint === 'string' &&
    Boolean(data.hint.trim()) &&
    Array.from(data.hint).length <= 160 &&
    data.hint.trimEnd().endsWith('?')
  );
}

export async function requestHint(
  request: HintRequest,
  signal?: AbortSignal,
): Promise<HintResponse> {
  if (request.schemaVersion !== 1 || request.lessonId !== 'week2-workflow') {
    throw new Error('AI 조언은 현재 1단원 노드 실습에서만 사용할 수 있습니다.');
  }
  if (request.ruleCheck.success !== false || !request.runId.trim() || !request.graphSignature) {
    throw new Error('실패한 실습 실행 결과가 있어야 AI 조언을 요청할 수 있습니다.');
  }
  const { data } = await api.post<unknown>('/ai/hint', request, {
    signal,
    timeout: 130_000,
  });
  if (!isHintResponse(data)) {
    throw new Error('AI 조언 응답이 비어 있거나 올바르지 않습니다. 다시 요청해 주세요.');
  }
  return { status: data.status, concept: data.concept, hint: data.hint };
}
