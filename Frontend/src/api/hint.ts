import { api } from './client';
import type { RunResult } from '../systemLab/engine';
import type { Connection, ResourceEntity, SystemEntity } from '../systemLab/model';

/** Request body for POST /api/chat/ai/hint. */
export interface HintRequest {
  lessonId: 'week2-workflow';
  nodes: (Omit<SystemEntity, 'position' | 'width' | 'height'> | Omit<ResourceEntity, 'position'>)[];
  edges: (Connection & { kind: 'manual' | 'service-route' })[];
  settings: {
    lesson: { title: string; task: string; summary: string };
    requirements: { requestIds: number[]; requiredPods: number };
    responses: RunResult['responses'];
    cycle: string[];
  };
  ruleCheck: { success: false; issues: string[]; first_failure: string };
}

/** Success is deliberately excluded: successful runs do not receive advice. */
export interface HintResponse {
  status: 'ok' | 'fallback';
  concept: string;
  hint: string;
}

function parseHintResponse(value: unknown): HintResponse | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  // The current Java DTO serializes this field as "conecpt".
  const concept = data.concept ?? data.conecpt;
  const { status, hint } = data;
  if (
    (status !== 'ok' && status !== 'fallback') ||
    typeof concept !== 'string' ||
    !concept.trim() ||
    concept.length > 200 ||
    typeof hint !== 'string' ||
    hint.length > 160 ||
    !hint.trimEnd().endsWith('?')
  ) {
    return null;
  }
  return { status, concept, hint };
}

export async function requestHint(
  request: HintRequest,
  signal?: AbortSignal,
): Promise<HintResponse> {
  if (request.lessonId !== 'week2-workflow') {
    throw new Error('AI 조언은 현재 1단원 노드 실습에서만 사용할 수 있습니다.');
  }
  if (request.ruleCheck.success !== false || !request.ruleCheck.first_failure.trim()) {
    throw new Error('실패한 실습 실행 결과가 있어야 AI 조언을 요청할 수 있습니다.');
  }
  const { data } = await api.post<unknown>('/chat/ai/hint', request, {
    signal,
    timeout: 130_000,
  });
  const response = parseHintResponse(data);
  if (!response) {
    throw new Error('AI 조언 응답이 비어 있거나 올바르지 않습니다. 다시 요청해 주세요.');
  }
  return response;
}
