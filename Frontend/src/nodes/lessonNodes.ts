import type { LabState, Lesson } from '../curriculum/types';
import { createLab } from '../curriculum/engine';

export function createNodeLab(lesson: Lesson): LabState {
  if (lesson.workflow) return createLab(lesson);
  return {
    ...createLab(lesson),
    resources: undefined,
    activeNodes: lesson.practice === 'explore' ? lesson.nodes.map((n) => n.id) : [],
  };
}
export function activeNodeIds(lab: LabState): string[] {
  return lab.activeNodes ?? lab.nodes.map((node) => node.id);
}
export function addLessonNode(lab: LabState, id: string): LabState {
  if (!lab.nodes.some((node) => node.id === id) || activeNodeIds(lab).includes(id)) return lab;
  return { ...lab, activeNodes: [...activeNodeIds(lab), id], completed: false };
}
export function removeLessonNode(lab: LabState, id: string): LabState {
  return {
    ...lab,
    activeNodes: activeNodeIds(lab).filter((node) => node !== id),
    edges: lab.edges.filter((edge) => edge.source !== id && edge.target !== id),
    completed: false,
  };
}
export function nodeCanvas(lab: LabState) {
  const active = new Set(activeNodeIds(lab));
  return {
    nodes: lab.nodes.filter((node) => active.has(node.id)),
    edges: lab.edges.filter((edge) => active.has(edge.source) && active.has(edge.target)),
  };
}
