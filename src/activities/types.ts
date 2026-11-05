import type { LabField } from '../curriculum/types';
export type ActivityKind =
  | 'compute'
  | 'layers'
  | 'memory'
  | 'parallel'
  | 'machine'
  | 'objects'
  | 'container'
  | 'commands'
  | 'virtual'
  | 'replicas'
  | 'storage'
  | 'io'
  | 'volume'
  | 'git'
  | 'lfs'
  | 'dvc'
  | 'restore'
  | 'features'
  | 'embedding'
  | 'search'
  | 'rag'
  | 'serving'
  | 'release'
  | 'drift'
  | 'metrics'
  | 'improve'
  | 'pipeline';
export interface ActivitySpec {
  kind: ActivityKind;
  variant?: string;
  fields: LabField[];
  question: string;
  options: { value: string; label: string }[];
  correct: string;
  explanation: string;
  task: string;
}
export interface ActivityResult {
  headline: string;
  detail: string;
  metrics: { label: string; value: string; amount?: number }[];
  steps: string[];
  warning?: string;
}
