import type { NodeExampleSpec } from './nodeExamples';
import type { Node, Edge } from '@xyflow/react';
import type { ResourceConfig } from '../console/resources';
import type { ActivitySpec } from '../activities/types';

export type Answer = string | number | boolean;
export interface Reading {
  title: string;
  body: string;
  table?: { columns: string[]; rows: string[][] };
  code?: { language: string; text: string };
  image?: { src: string; alt: string; caption?: string; source?: { title: string; url: string } };
}
export interface Reference {
  title: string;
  url: string;
}
export interface LabNode {
  id: string;
  title: string;
  detail: string;
  tone?: string;
}
export interface LabField {
  id: string;
  label: string;
  help: string;
  initial: Answer;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}
export type Goal =
  | { id: string; label: string; hint: string; kind: 'edge'; from: string; to: string }
  | {
      id: string;
      label: string;
      hint: string;
      kind: 'answer';
      field: string;
      value: Answer;
      comparison?: 'atLeast' | 'atMost';
    };
export interface Lesson {
  contentFeatures?: { nodeExamples: boolean; activities: boolean; quiz: boolean };
  nodeExample?: NodeExampleSpec;
  assessment?: { question: string; options: string[]; correct: number; explanation: string };
  mapStages?: string[];
  advanced?: Reading[];
  sourceWeek?: number;
  contentRevision?: number;
  workflow?: string;
  activity?: ActivitySpec;
  practice?: 'required' | 'explore' | 'interactive';
  flow?: [string, string][];
  id: string;
  week: number;
  title: string;
  summary: string;
  minutes: number;
  concepts: string[];
  reading: Reading[];
  caution: string;
  scenario: string;
  nodes: LabNode[];
  initialEdges: [string, string][];
  fields: LabField[];
  goals: Goal[];
  experiment: string;
  reflection: string;
  references: Reference[];
  devops?: string;
}
export type LearningNode = Node<
  { title: string; detail: string; tone: string; service?: string; resourceName?: string },
  'resource'
>;
export interface LabState {
  nodes: LearningNode[];
  edges: Edge[];
  answers: Record<string, Answer>;
  completed: boolean;
  attempts: number;
  resources?: Record<string, ResourceConfig>;
  activeNodes?: string[];
}
export interface GoalResult {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
}
export interface ExperimentResult {
  success: boolean;
  headline: string;
  observations: string[];
  metrics: { label: string; value: string }[];
}
export interface LearningData {
  version: 2 | 3 | 4 | 5;
  lessons: Record<string, LabState>;
}
