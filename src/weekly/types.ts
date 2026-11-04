import type { LabField } from '../curriculum/types';
export type Material =
  | 'data'
  | 'model'
  | 'task'
  | 'gradient'
  | 'activation'
  | 'partial'
  | 'checkpoint'
  | 'image'
  | 'control'
  | 'request'
  | 'prediction'
  | 'volume'
  | 'claim'
  | 'metadata'
  | 'document'
  | 'vector'
  | 'context'
  | 'metrics'
  | 'decision'
  | 'approval'
  | 'feedback';
export interface Port {
  id: string;
  label: string;
  material: Material;
  required?: boolean;
}
export interface Stage {
  id: string;
  title: string;
  purpose: string;
  lane: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  fields?: string[];
}
export interface Wire {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}
export interface Scenario {
  id: string;
  week: number;
  title: string;
  problem: string;
  task: string;
  takeaway: string;
  nodes: Stage[];
  fields: LabField[];
  wires: Wire[];
  starter: Wire[];
  question: string;
  options: [string, string];
  explanation: string;
}
export interface Artifact {
  port: string;
  material: Material;
  name: string;
  content: string;
}
export interface TraceStage {
  node: string;
  title: string;
  status: 'success' | 'failed' | 'blocked';
  inputs: { from: string; name: string; content: string }[];
  outputs: Artifact[];
  reason: string;
  fix?: string;
}
export interface Run {
  signature: string;
  success: boolean;
  stages: TraceStage[];
  metrics: { label: string; value: string }[];
  headline: string;
}
