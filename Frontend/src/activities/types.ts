import type { ComponentType } from 'react';
import type { LabField, Lesson } from '../curriculum/types';
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

/** 모든 활동 본문이 사용하는 공통 입력입니다. */
export interface ActivityViewProps {
  lesson: Lesson;
  spec: ActivitySpec;
}

/** 종류별 본문과 공통 프레임에 표시할 문구입니다. */
export interface ActivityDefinition {
  component: ComponentType<ActivityViewProps>;
  summary: string;
  title?: string;
  label?: string;
}
export interface ActivityResult {
  headline: string;
  detail: string;
  metrics: { label: string; value: string; amount?: number }[];
  steps: string[];
  warning?: string;
}
