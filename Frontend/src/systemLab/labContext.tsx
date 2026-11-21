import type { LucideIcon } from 'lucide-react';
import { createContext, useContext, type ReactNode } from 'react';
import { kindColor } from './appearance';
import type { Command } from './commands';
import type { Direction, Entity, Graph, LabConfig, Material } from './lab';

export interface PortListProps {
  node: Entity;
  graph: Graph;
  direction: Direction;
  dispatch: (command: Command) => boolean;
}
export interface LabSettingsProps {
  node: Entity;
  graph: Graph;
  dispatch: (command: Command) => boolean;
  PortList: (props: PortListProps) => ReactNode;
}
/** 화면에서 실습별로 달라지는 문구·아이콘·설정 항목. 규칙은 LabConfig가 가진다. */
export interface LabView {
  title: string;
  /** 제목 아래 실습 목표. 백틱으로 감싼 키워드는 인라인 코드로 표시한다. */
  description: string;
  ariaLabel: string;
  /** 본문 끝의 실습 시작 안내 문구. */
  entry: string;
  icons: Record<string, LucideIcon>;
  materialIcons: Record<Material, LucideIcon>;
  /** 캔버스의 선과 포트에 쓰는 자료 타입별 색. */
  tones: Record<Material, string>;
  /** 종류별 색. 없으면 기본 색을 쓴다. */
  kindColors?: Record<string, string>;
  hints: Record<string, string>;
  /** 노드 종류별 안내 패널(시작·도착 등). */
  panels: Record<string, (graph: Graph, lab: LabConfig) => ReactNode>;
  systemSettings?: (props: LabSettingsProps) => ReactNode;
  /** 소속 시스템 선택보다 앞에 놓는 리소스 설정(예: 라벨). */
  resourceHeader?: (props: LabSettingsProps) => ReactNode;
  resourceSettings?: (props: LabSettingsProps) => ReactNode;
}
interface LabContextValue {
  lab: LabConfig;
  view: LabView;
}
const LabContext = createContext<LabContextValue | null>(null);
export const LabProvider = LabContext.Provider;
export const kindClass = (view: LabView, kind: string) =>
  view.kindColors?.[kind] ?? kindColor[kind] ?? kindColor.root;
export function useLab(): LabContextValue {
  const value = useContext(LabContext);
  if (!value) throw new Error('시스템 실습 설정이 없습니다.');
  return value;
}
