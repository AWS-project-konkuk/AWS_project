import type { HintRequest } from '../api/hint';
import type { Lesson } from '../curriculum/types';
import type { RunResult } from './engine';
import { definition, pilotLesson, serviceRoutes, signature, type Graph } from './model';

/** Matches SystemLab's animation state, not just the eagerly computed engine result. */
export interface HintRun {
  result: RunResult;
  stamp: string;
  cursor: number;
  stopped: boolean;
}

export function canRequestHint(lessonId: string, graph: Graph, run: HintRun | null): boolean {
  return (
    lessonId === pilotLesson &&
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
  // Copy the snapshot so later edits cannot change an in-flight request's evidence.
  return structuredClone({
    schemaVersion: 1,
    lessonId: pilotLesson,
    runId: run.result.id,
    graphSignature: run.stamp,
    lesson: { title: lesson.title, task: lesson.scenario, summary: lesson.summary },
    requirements: {
      requestIds: [...definition.requestIds],
      requiredPods: definition.requiredPods,
    },
    workflow: {
      nodes: graph.entities.map((entity) => {
        const base = {
          id: entity.id,
          name: entity.name,
          parent: entity.parent,
          enabled: entity.enabled,
          ports: entity.ports,
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
      connections: graph.connections,
      serviceRoutes: serviceRoutes(graph),
    },
    ruleCheck: {
      success: false,
      message: run.result.message,
      steps: run.result.steps,
      cycle: run.result.cycle,
      responses: run.result.responses,
    },
  });
}
