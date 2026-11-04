import { getLab as legacyGetLab } from './progress';
import { create } from 'zustand';
import {
  emptyLearning,
  getLab,
  learningKey,
  parseLearning,
  serializeLearning,
} from './blockProgress';
import { legacyLessonById, lessonById } from '../curriculum/catalog';
import { createNodeLab } from '../nodes/lessonNodes';
import type { LabState, LearningData } from '../curriculum/types';

interface State {
  data: LearningData;
  blocked: boolean;
  warning: string;
}
type Action =
  | { type: 'edit'; id: string; change: (lab: LabState) => LabState; semantic: boolean }
  | { type: 'reset'; id: string }
  | { type: 'recover' };
function initial(): State {
  try {
    const raw = localStorage.getItem(learningKey);
    return { data: raw ? parseLearning(raw) : emptyLearning(), blocked: false, warning: '' };
  } catch {
    return {
      data: emptyLearning(),
      blocked: true,
      warning: '저장된 학습 진행을 읽을 수 없습니다.',
    };
  }
}
export function learningReducer(state: State, action: Action): State {
  if (action.type === 'recover') return { data: emptyLearning(), blocked: false, warning: '' };
  if (action.type === 'reset')
    return {
      ...state,
      data: {
        ...state.data,
        lessons: {
          ...state.data.lessons,
          [action.id]: createNodeLab(
            (state.data.version === 2 ? legacyLessonById : lessonById)[action.id],
          ),
        },
      },
    };
  const previous = (state.data.version === 2 ? legacyGetLab : getLab)(state.data, action.id);
  const lab = action.change(previous);
  if (lab === previous) return state;
  const lesson = lessonById[action.id];
  const invalidates =
    action.semantic &&
    (!lesson?.assessment || lab.answers._understanding !== previous.answers._understanding);
  return {
    ...state,
    data: {
      ...state.data,
      lessons: {
        ...state.data.lessons,
        [action.id]: { ...lab, completed: invalidates ? false : lab.completed },
      },
    },
  };
}
interface LearningStore extends State {
  saveStatus: string;
  edit: (id: string, change: (lab: LabState) => LabState, semantic?: boolean) => void;
  resetLesson: (id: string) => void;
  recover: () => void;
}
export const useLearningStore = create<LearningStore>()((set) => ({
  ...(typeof localStorage === 'undefined'
    ? { data: emptyLearning(), blocked: false, warning: '' }
    : initial()),
  saveStatus: '이 브라우저에 자동 저장',
  edit: (id, change, semantic = true) =>
    set((state) => learningReducer(state, { type: 'edit', id, change, semantic })),
  resetLesson: (id) => set((state) => learningReducer(state, { type: 'reset', id })),
  recover: () => set((state) => learningReducer(state, { type: 'recover' })),
}));
let saveTimer: ReturnType<typeof setTimeout>;
useLearningStore.subscribe((state, previous) => {
  if (state.blocked || state.data === previous.data || typeof localStorage === 'undefined') return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(learningKey, serializeLearning(state.data));
      useLearningStore.setState({ saveStatus: '학습 진행 저장됨' });
    } catch {
      useLearningStore.setState({ saveStatus: '저장 실패 · 현재 학습은 계속할 수 있습니다' });
    }
  }, 300);
});
/** 기존 호출부를 유지하면서 Context 없이 구독한다. */
export function useLearning() {
  const data = useLearningStore((s) => s.data);
  const blocked = useLearningStore((s) => s.blocked);
  const warning = useLearningStore((s) => s.warning);
  const saveStatus = useLearningStore((s) => s.saveStatus);
  const edit = useLearningStore((s) => s.edit);
  const resetLesson = useLearningStore((s) => s.resetLesson);
  const recover = useLearningStore((s) => s.recover);
  return {
    state: { data, blocked, warning },
    saveStatus: blocked
      ? '저장된 진행을 읽지 못했습니다. 원본을 유지하며 자동 저장을 중지했습니다.'
      : saveStatus,
    edit,
    resetLesson,
    recover,
  };
}
