import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { loadWorkflow, saveWorkflow, storageKey } from '../storage/persistence';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { makeEdge } from './graph';
import type { Connection } from '@xyflow/react';
import type { WorkflowNode } from './types';
import type { Graph, Issue, NodeKind, Progress, SimulationStep } from './types';

interface State {
  graph: Graph;
  progress: Progress;
  issues: Issue[];
  validated: boolean;
  steps: SimulationStep[];
  cursor: number;
  playing: boolean;
  selectedId: string | null;
  activeKind: NodeKind;
  saveBlocked: boolean;
  initialWarning: string;
}
type Action =
  | { type: 'graph'; graph: Graph; semantic?: boolean }
  | { type: 'nodes'; changes: NodeChange<WorkflowNode>[] }
  | { type: 'edges'; changes: EdgeChange[] }
  | { type: 'connect'; connection: Connection }
  | { type: 'validate'; issues: Issue[] }
  | { type: 'select'; id: string | null; kind?: NodeKind }
  | { type: 'read'; kind: NodeKind }
  | { type: 'run'; steps: SimulationStep[]; playing: boolean }
  | { type: 'tick' }
  | { type: 'stop' }
  | { type: 'reset' };

function initialState(): State {
  let loaded: ReturnType<typeof loadWorkflow>;
  try {
    loaded = loadWorkflow(window.localStorage);
  } catch {
    loaded = {
      state: 'blocked',
      message: '브라우저 저장소를 사용할 수 없습니다. 편집은 계속할 수 있습니다.',
    };
  }
  return {
    graph: loaded.state === 'loaded' ? loaded.value.graph : { nodes: [], edges: [] },
    progress: loaded.state === 'loaded' ? loaded.value.progress : { readSections: [] },
    issues: [],
    validated: false,
    steps: [],
    cursor: 0,
    playing: false,
    selectedId: null,
    activeKind: 'dataset',
    saveBlocked: loaded.state === 'blocked',
    initialWarning: loaded.state === 'blocked' ? loaded.message : '',
  };
}

export function workflowReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'nodes': {
      const nodes = applyNodeChanges(action.changes, state.graph.nodes);
      return workflowReducer(state, {
        type: 'graph',
        graph: {
          nodes,
          edges: state.graph.edges.filter(
            (edge) =>
              nodes.some((node) => node.id === edge.source) &&
              nodes.some((node) => node.id === edge.target),
          ),
        },
        semantic: action.changes.some((change) => change.type === 'remove'),
      });
    }
    case 'edges':
      return workflowReducer(state, {
        type: 'graph',
        graph: { ...state.graph, edges: applyEdgeChanges(action.changes, state.graph.edges) },
        semantic: action.changes.some((change) => change.type === 'remove'),
      });
    case 'connect': {
      const connection = action.connection;
      if (
        connection.source === connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      )
        return state;
      const edge = makeEdge(
        connection.source,
        connection.sourceHandle,
        connection.target,
        connection.targetHandle,
      );
      if (state.graph.edges.some((existing) => existing.id === edge.id)) return state;
      return workflowReducer(state, {
        type: 'graph',
        graph: { ...state.graph, edges: [...state.graph.edges, edge] },
      });
    }
    case 'graph':
      return {
        ...state,
        graph: action.graph,
        ...(action.semantic === false
          ? {}
          : { issues: [], validated: false, steps: [], cursor: 0, playing: false }),
        selectedId: action.graph.nodes.some((node) => node.id === state.selectedId)
          ? state.selectedId
          : null,
      };
    case 'validate':
      return {
        ...state,
        issues: action.issues,
        validated: true,
        steps: [],
        cursor: 0,
        playing: false,
      };
    case 'select':
      return { ...state, selectedId: action.id, activeKind: action.kind ?? state.activeKind };
    case 'read':
      return {
        ...state,
        activeKind: action.kind,
        progress: { readSections: [...new Set([...state.progress.readSections, action.kind])] },
      };
    case 'run':
      return {
        ...state,
        issues: [],
        validated: true,
        steps: action.steps,
        cursor: action.playing ? 0 : 1,
        playing: action.playing,
      };
    case 'tick': {
      const cursor = Math.min(state.cursor + 1, state.steps.length);
      return { ...state, cursor, playing: state.playing && cursor < state.steps.length };
    }
    case 'stop':
      return { ...state, playing: false };
    case 'reset':
      return {
        ...state,
        graph: { nodes: [], edges: [] },
        progress: { readSections: [] },
        issues: [],
        validated: false,
        steps: [],
        cursor: 0,
        playing: false,
        selectedId: null,
        activeKind: 'dataset',
        saveBlocked: false,
        initialWarning: '',
      };
  }
}

const WorkflowContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
  saveMessage: string;
  saving: boolean;
  reset: () => void;
} | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, undefined, initialState);
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.saveBlocked) return;
    const savingTimer = window.setTimeout(() => setSaving(true), 0);
    const timer = window.setTimeout(() => {
      try {
        saveWorkflow(window.localStorage, state.graph, state.progress);
        setSaveMessage('이 브라우저에 저장됨');
      } catch {
        setSaveMessage('저장 실패 · 편집은 계속할 수 있습니다');
      }
      setSaving(false);
    }, 350);
    return () => {
      clearTimeout(savingTimer);
      clearTimeout(timer);
    };
  }, [state.graph, state.progress, state.saveBlocked]);
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 650);
    return () => clearInterval(timer);
  }, [state.playing]);
  const reset = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* 저장소 차단 시에도 메모리 상태는 초기화한다. */
    }
    dispatch({ type: 'reset' });
  };
  return (
    <WorkflowContext.Provider
      value={{ state, dispatch, saveMessage: state.initialWarning || saveMessage, saving, reset }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const value = useContext(WorkflowContext);
  if (!value) throw new Error('WorkflowProvider가 필요합니다.');
  return value;
}
