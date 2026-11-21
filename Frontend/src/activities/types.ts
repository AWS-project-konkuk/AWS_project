import type { Answer, LabField, Lesson } from '../curriculum/types';
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

export interface ActivityCase {
  label: string;
  result: string;
  cards: { title: string; value: string; detail: string }[];
  reason: string;
  flow?: string[];
}

interface ActivityCopy {
  title: string;
  instruction?: string;
  note?: string;
}

export type ActivityView = ActivityCopy &
  (
    | { type: 'machine' | 'virtual' | 'storage' | 'io' | 'feature-store' }
    | { type: 'numbers' | 'search' | 'parallel' | 'release' }
    | { type: 'structure' | 'scenario'; cases?: ActivityCase[] }
  );

export interface ActivitySimulationProps {
  lesson: Lesson;
  spec: ActivitySpec;
}

export interface ActivitySceneProps {
  spec: ActivitySpec;
  answers: Record<string, Answer>;
  result: ActivityResult;
}
export interface ActivityResult {
  headline: string;
  detail: string;
  metrics: { label: string; value: string; amount?: number }[];
  steps: string[];
  warning?: string;
}
