import type { Edge, Node } from '@xyflow/react';

export type NodeKind =
  'dataset' | 'preprocess' | 'training' | 'evaluation' | 'registry' | 'serving';
export type PortType = 'raw' | 'train' | 'test' | 'model' | 'approved' | 'registered';
export type StepStatus = 'waiting' | 'running' | 'success' | 'failed' | 'blocked';
export type WorkflowNode = Node<
  {
    kind: NodeKind;
    threshold: number | null;
  },
  'stage'
>;
export type WorkflowEdge = Edge;
export interface Graph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
export interface Issue {
  id: string;
  message: string;
  hint: string;
  nodeIds: string[];
  edgeIds: string[];
}
export interface ValidationRule {
  id: string;
  check(graph: Graph): Issue[];
}
export interface SimulationStep {
  nodeId: string;
  kind: NodeKind;
  status: StepStatus;
  artifact: string;
  explanation: string;
}
export interface Progress {
  readSections: NodeKind[];
}
export interface SavedWorkflow {
  version: 1;
  graph: Graph;
  progress: Progress;
}
export interface Port {
  id: PortType;
  label: string;
}
