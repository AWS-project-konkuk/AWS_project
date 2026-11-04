import { ArrowUpRight, Check, ChevronDown, BookOpen, Lightbulb } from 'lucide-react';
import { stages, stageByKind, quiz } from './lesson';
import { useWorkflow } from '../workflow/WorkflowContext';
import { StageIcon } from '../canvas/StageIcon';
import styles from './Lesson.module.css';

export function LessonPanel() {
  const { state, dispatch } = useWorkflow();
  const stage = stageByKind[state.activeKind];
  return (
    <aside className={styles.panel} aria-label="학습 콘텐츠">
      <div className={styles.course}>
        <span className={styles.eyebrow}>LEARNING PATH · 01</span>
        <h2>모델이 서비스가 되기까지</h2>
        <p>
          데이터에서 시작해 서빙까지,
          <br />
          MLOps의 첫 워크플로를 만듭니다.
        </p>
        <div className={styles.progressLabel}>
          <span>나의 학습 진행</span>
          <strong>{state.progress.readSections.length} / 6</strong>
        </div>
        <div className={styles.progress}>
          <i style={{ width: `${(state.progress.readSections.length / 6) * 100}%` }} />
        </div>
      </div>
      <div className={styles.lessonBody}>
        <div className={styles.sectionTitle}>
          <BookOpen size={15} /> 여섯 단계 이해하기 <span>약 15분</span>
        </div>
        <nav className={styles.stageNav} aria-label="학습 단계">
          {stages.map((item, index) => (
            <button
              key={item.kind}
              className={state.activeKind === item.kind ? styles.active : ''}
              onClick={() => dispatch({ type: 'select', id: null, kind: item.kind })}
              aria-expanded={state.activeKind === item.kind}
            >
              <span
                className={`${styles.number} ${state.progress.readSections.includes(item.kind) ? styles.read : ''}`}
              >
                {state.progress.readSections.includes(item.kind) ? (
                  <Check size={12} />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              <span>{item.title}</span>
              <ChevronDown size={14} />
            </button>
          ))}
        </nav>
        <article className={styles.explanation} key={stage.kind}>
          <span className={styles.articleTitle}>
            <StageIcon kind={stage.kind} />
            <strong>{stage.title}</strong>
          </span>
          <p>{stage.description}</p>
          <a href={stage.source.url} target="_blank" rel="noreferrer">
            공식 자료 읽기 <ArrowUpRight size={12} />
          </a>
          <div className={styles.question}>
            <Lightbulb size={16} />
            <p>{stage.question}</p>
          </div>
          <button
            className={styles.readButton}
            onClick={() => dispatch({ type: 'read', kind: stage.kind })}
          >
            <Check size={14} />
            {state.progress.readSections.includes(stage.kind)
              ? '읽음 표시됨'
              : '이 단계 이해했어요'}
          </button>
        </article>
        <div className={styles.mission}>
          <span>이번 과제</span>
          <h3>
            평가를 통과한 모델만
            <br />
            서비스로 보내기
          </h3>
          <p>6개 단계를 연결한 뒤, 평가 기준이 달라지면 어떤 일이 생기는지 확인하세요.</p>
          <div>
            <span>예시 정확도</span>
            <strong>0.85</strong>
          </div>
        </div>
        <details className={styles.quiz}>
          <summary>
            학습 확인 질문 <span>3문항</span>
          </summary>
          {quiz.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </details>
      </div>
      <div className={styles.bottomNote}>학습용 예시 · 실제 학습 및 배포 없음</div>
    </aside>
  );
}
