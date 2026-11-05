import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  ArrowUpRight,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FilePlus2,
  GitBranch,
  LoaderCircle,
  Play,
  RotateCcw,
  SkipForward,
  Square,
} from 'lucide-react';
import { WorkflowProvider, useWorkflow } from './workflow/WorkflowContext';
import { exampleGraph } from './workflow/graph';
import { validateGraph } from './workflow/validate';
import { simulate } from './simulation/simulate';
import { LessonPanel } from './content/LessonPanel';
import { WorkflowCanvas } from './canvas/WorkflowCanvas';
import { Inspector } from './canvas/Inspector';
import { ResultsPanel } from './simulation/ResultsPanel';
import styles from './App.module.css';

function LearningRoom() {
  const { state, dispatch, saveMessage, saving, reset } = useWorkflow();
  const [dialog, setDialog] = useState<'reset' | 'example' | null>(null);
  const [help, setHelp] = useState(false);
  const loadExample = () => {
    if (state.graph.nodes.length) {
      setDialog('example');
      return;
    }
    dispatch({ type: 'graph', graph: exampleGraph() });
  };
  const run = (playing: boolean) => {
    const issues = validateGraph(state.graph);
    if (issues.length) {
      dispatch({ type: 'validate', issues });
      return;
    }
    if (!playing && state.steps.length && state.cursor < state.steps.length)
      dispatch({ type: 'tick' });
    else dispatch({ type: 'run', steps: simulate(state.graph), playing });
  };
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="./" aria-label="BlockML 홈">
          <span>
            <GitBranch size={23} />
          </span>
          <strong>
            Block<span>ML</span>
            <sup>LEARN</sup>
          </strong>
        </a>
        <div className={styles.headerDivider} />
        <span className={styles.headerLabel}>연결하며 배우는 MLOps</span>
        <nav>
          <span className={styles.localBadge}>
            <i /> 브라우저 학습실
          </span>
          <button aria-label="사용 방법" onClick={() => setHelp(!help)}>
            <CircleHelp size={18} />
          </button>
          <a href="https://aws.amazon.com/what-is/mlops/" target="_blank" rel="noreferrer">
            MLOps 알아보기 <ArrowUpRight size={13} />
          </a>
        </nav>
      </header>
      <div className={styles.pageTitle}>
        <div>
          <div className={styles.breadcrumb}>
            학습실 <ChevronRight size={12} /> MLOps 기초
          </div>
          <h1>
            나의 첫 MLOps 워크플로<span>실습 01</span>
          </h1>
        </div>
        <div
          className={`${styles.saveStatus} ${state.saveBlocked || saveMessage.includes('실패') ? styles.saveError : ''}`}
          role="status"
        >
          {saving ? <LoaderCircle size={14} className={styles.spin} /> : <CheckCircle2 size={14} />}
          <span>
            {state.saveBlocked
              ? '저장 복구 필요'
              : saving
                ? '저장 중…'
                : saveMessage || '브라우저에 자동 저장'}
          </span>
        </div>
      </div>
      {help && (
        <div className={styles.help}>
          ① 위의 노드 버튼으로 단계 추가 ② 출력 점과 입력 점을 차례로 클릭해 연결 ③ 검증 후 실행.
          연결은 오른쪽 목록에서, 노드는 선택 후 삭제할 수 있습니다.{' '}
          <button onClick={() => setHelp(false)}>닫기</button>
        </div>
      )}
      {(state.saveBlocked || saveMessage.includes('실패')) && (
        <div className={styles.warning} role="alert">
          {saveMessage}
          <button onClick={() => setDialog('reset')}>저장 데이터 초기화</button>
        </div>
      )}
      <main className={styles.layout}>
        <LessonPanel />
        <div className={styles.workspace}>
          <div className={styles.workspaceToolbar}>
            <div>
              <span className={styles.canvasTab}>
                <GitBranch size={15} />
                워크플로 캔버스
              </span>
              <span className={styles.draft}>DRAFT</span>
            </div>
            <div className={styles.actions}>
              <button onClick={loadExample}>
                <FilePlus2 size={14} />
                예제 불러오기
              </button>
              <button aria-label="초기화" title="초기화" onClick={() => setDialog('reset')}>
                <RotateCcw size={14} />
              </button>
              <span className={styles.separator} />
              <button
                onClick={() => dispatch({ type: 'validate', issues: validateGraph(state.graph) })}
              >
                <CheckCheck size={15} />
                검증
              </button>
              <button disabled={state.playing} onClick={() => run(false)}>
                <SkipForward size={15} />
                <span>다음 단계</span>
              </button>
              {state.playing ? (
                <button className={styles.runButton} onClick={() => dispatch({ type: 'stop' })}>
                  <Square size={13} />
                  중단
                </button>
              ) : (
                <button className={styles.runButton} onClick={() => run(true)}>
                  <Play size={14} fill="currentColor" />
                  실행
                </button>
              )}
            </div>
          </div>
          <div className={styles.editorRow}>
            <WorkflowCanvas onExample={loadExample} />
            <Inspector />
          </div>
          <ResultsPanel />
        </div>
      </main>
      <footer className={styles.footer}>
        <span>
          BLOCKML <i /> 작은 연결이 만드는 큰 이해
        </span>
        <span>로컬 저장 · 학습용 예시 데이터</span>
      </footer>
      {dialog && (
        <div className={styles.modalBackdrop}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className={styles.modal}
          >
            <span className={styles.modalIcon}>
              <RotateCcw size={23} />
            </span>
            <h2 id="dialog-title">
              {dialog === 'reset' ? '학습실을 초기화할까요?' : '예제로 바꿀까요?'}
            </h2>
            <p>
              {dialog === 'reset'
                ? '현재 구성과 이 브라우저의 학습 진행을 지우고 빈 캔버스로 돌아갑니다.'
                : '현재 구성을 평가 단계가 빠진 예제로 바꿉니다. 학습 진행은 유지됩니다.'}
            </p>
            <div>
              <button autoFocus onClick={() => setDialog(null)}>
                취소
              </button>
              <button
                className={styles.runButton}
                onClick={() => {
                  if (dialog === 'reset') reset();
                  else dispatch({ type: 'graph', graph: exampleGraph() });
                  setDialog(null);
                }}
              >
                {dialog === 'reset' ? '초기화하기' : '예제 불러오기'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <WorkflowProvider>
      <ReactFlowProvider>
        <LearningRoom />
      </ReactFlowProvider>
    </WorkflowProvider>
  );
}
