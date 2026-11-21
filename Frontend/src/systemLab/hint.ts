import type { HintRequest } from '../api/hint';
import type { Lesson } from '../curriculum/types';
import type { RunResult } from './engine';
import { signature, type Graph } from './lab';
import { labFor } from './labs';

/** Matches SystemLab's animation state, not just the eagerly computed engine result. */
export interface HintRun {
  result: RunResult;
  stamp: string;
  cursor: number;
  stopped: boolean;
}

export function canRequestHint(lessonId: string, graph: Graph, run: HintRun | null): boolean {
  return (
    labFor(lessonId)?.aiHint === true &&
    run !== null &&
    run.stamp === signature(graph) &&
    !run.stopped &&
    run.cursor === run.result.steps.length &&
    run.result.success === false &&
    Boolean(run.result.id.trim())
  );
}

export function buildHintRequest(
  lesson: Pick<Lesson, 'id' | 'title' | 'scenario' | 'summary'>,
  graph: Graph,
  run: HintRun | null,
): HintRequest {
  if (!run || !canRequestHint(lesson.id, graph, run)) {
    throw new Error('현재 구성을 끝까지 실행한 뒤 실패한 경우에만 AI 조언을 요청할 수 있습니다.');
  }
  const lab = labFor(lesson.id);
  if (!lab) throw new Error('시스템 실습이 없는 강의입니다.');
  const { steps, cycle, responses, message, metrics, observations } = run.result;
  const names = new Map(graph.entities.map(({ id, name }) => [id, name]));
  const stepIssues = steps.flatMap(({ node, status, message }) =>
    status === 'success'
      ? []
      : [`${names.get(node) ?? node} (${status === 'blocked' ? '차단' : '실패'}): ${message}`],
  );
  // A cycle can end the run before any node is executed.
  const issues = [...new Set(cycle.length ? [message, ...stepIssues] : [...stepIssues, message])];

  // Copy the snapshot so later edits cannot change an in-flight request's evidence.
  return structuredClone({
    lessonId: lesson.id,
    nodes: graph.entities.map((entity) => {
      const base = {
        id: entity.id,
        name: entity.name,
        parent: entity.parent,
        ports: entity.ports,
        settings: entity.settings,
      };
      return entity.type === 'system'
        ? { ...base, type: entity.type, kind: entity.kind, kubernetes: entity.kubernetes }
        : {
            ...base,
            type: entity.type,
            kind: entity.kind,
            ports: entity.ports,
            version: entity.version,
            replicas: entity.replicas,
            appLabel: entity.appLabel,
          };
    }),
    edges: [
      ...graph.connections.map((edge) => ({ ...edge, kind: 'manual' as const })),
      ...lab.routes(graph).map((edge) => ({ ...edge, kind: 'service-route' as const })),
    ],
    settings: {
      lesson: { title: lesson.title, task: lesson.scenario, summary: lesson.summary },
      requirements: {
        requestIds: [...lab.requestIds],
        requiredPods: lab.requiredPods,
      },
      responses,
      cycle,
      metrics,
      observations,
    },
    ruleCheck: {
      success: false,
      issues,
      first_failure: issues[0],
    },
  });
}
