import { Link } from 'react-router';
import { useState } from 'react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { ArrowRight, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { createConnection, evaluateGoals } from '../curriculum/engine';
import type { LabState, Lesson } from '../curriculum/types';
import { ResourceCanvas } from '../console/ResourceCanvas';
import { nodeCanvas } from '../nodes/lessonNodes';
import { LessonNodePalette } from '../nodes/LessonNodePalette';
import { Fields } from '../activities/Fields';
import { getLab } from './blockProgress';
import { useLearning } from './LearningStore';
import styles from './Learning.module.css';
export function LessonLab({ lesson }: { lesson: Lesson }) {
  const { state, edit, resetLesson } = useLearning();
  const lab = getLab(state.data, lesson.id),
    canvas = nodeCanvas(lab);
  const [source, setSource] = useState(''),
    [target, setTarget] = useState(''),
    [message, setMessage] = useState(''),
    [feedback, setFeedback] = useState(false);
  const required = lesson.practice === 'required';
  const goals = evaluateGoals(lesson, lab),
    ready = goals.every((g) => g.passed);
  const change = (fn: (c: LabState) => LabState, semantic = required) =>
    edit(
      lesson.id,
      (c) => {
        const next = fn(c);
        return semantic ? next : { ...next, completed: c.completed };
      },
      semantic,
    );
  const connect = (from: string, to: string) => {
    if (!from || !to) return;
    if (from === to) {
      setMessage('다른 노드와 연결하세요.');
      return;
    }
    setMessage('');
    change((c) =>
      c.edges.some((e) => e.source === from && e.target === to)
        ? c
        : { ...c, edges: [...c.edges, createConnection(from, to)] },
    );
  };
  const labels: Record<string, string> = {
    'n0->n1': '원본 데이터',
    'n1->n2': '학습용 데이터',
    'n1->n3': '평가용 데이터',
    'n2->n3': '학습한 모델',
    'n3->n4': '평가 통과 모델',
    'n4->n5': '등록 모델',
    'n5->n6': '운영 지표',
  };
  const edges = canvas.edges.map((original) => {
    const e =
      lesson.id === 'pipeline-capstone' ? { ...original, label: labels[original.id] } : original;
    return lesson.id === 'pipeline-capstone' && e.source === 'n6' && e.target === 'n0'
      ? {
          ...e,
          label: '개선 피드백',
          style: { strokeDasharray: '6 4' },
          data: { relation: 'feedback' },
        }
      : e;
  });
  return (
    <section className={styles.lab} aria-label="강의 노드 실습">
      <div className={styles.labHeading}>
        <strong>노드로 이해하기</strong>
        <span>{required ? '필수 연결 과제' : '선택 탐색 · 완료 조건 아님'}</span>
      </div>
      <div className={styles.scenario}>
        <p>{lesson.scenario}</p>
      </div>
      <div className={styles.labCanvas} data-testid="lesson-canvas">
        <ResourceCanvas
          nodes={canvas.nodes}
          edges={edges}
          onNodesChange={(changes) =>
            change(
              (c) => ({
                ...c,
                nodes: applyNodeChanges(
                  changes.filter((v) => v.type !== 'remove'),
                  c.nodes,
                ),
              }),
              false,
            )
          }
          onEdgesChange={(changes) =>
            change(
              (c) => ({ ...c, edges: applyEdgeChanges(changes, c.edges) }),
              required && changes.some((v) => v.type === 'remove'),
            )
          }
          onConnect={(c) => connect(c.source, c.target)}
        />
        {!canvas.nodes.length && (
          <div className={styles.emptyCanvas}>아래 목록에서 노드를 추가하고 연결하세요.</div>
        )}
      </div>
      <div
        className={styles.labDetails}
        data-testid="lab-details"
        tabIndex={0}
        aria-label="실습 설정과 결과"
      >
        <LessonNodePalette lesson={lesson} lab={lab} onChange={change} />
        {!required && (
          <button
            className={styles.subtle}
            onClick={() =>
              change((c) => ({
                ...c,
                activeNodes: c.nodes.map((n) => n.id),
                edges: (lesson.flow ?? []).map(([a, b]) => createConnection(a, b)),
              }))
            }
          >
            예시 흐름 복원
          </button>
        )}
        <div className="connection-form" aria-label="키보드로 연결">
          <label>
            출발
            <select
              aria-label="연결 출발"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">선택</option>
              {canvas.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.title}
                </option>
              ))}
            </select>
          </label>
          <ArrowRight size={14} />
          <label>
            도착
            <select
              aria-label="연결 도착"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">선택</option>
              {canvas.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.title}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => connect(source, target)}>연결 추가</button>
        </div>
        {message && <p role="status">{message}</p>}
        <div className={styles.connections} aria-label="현재 연결">
          {canvas.edges.map((edge) => (
            <div key={edge.id}>
              <span>
                {lesson.nodes.find((n) => n.id === edge.source)?.title}
                <ArrowRight size={11} />
                {lesson.nodes.find((n) => n.id === edge.target)?.title}
                {lesson.id === 'pipeline-capstone' && edge.source === 'n6' && edge.target === 'n0'
                  ? ' · 개선 피드백'
                  : ''}
              </span>
              <button
                aria-label={`연결 삭제 ${edge.source} ${edge.target}`}
                onClick={() =>
                  change((c) => ({ ...c, edges: c.edges.filter((e) => e.id !== edge.id) }))
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        {lesson.fields.length > 0 && (
          <details>
            <summary>본문 활동과 공유하는 설정</summary>
            <Fields
              fields={lesson.fields}
              answers={lab.answers}
              onChange={(id, value) =>
                edit(lesson.id, (c) => ({ ...c, answers: { ...c.answers, [id]: value } }))
              }
            />
          </details>
        )}
        <div className={styles.goals} data-tour="goals" aria-label="학습 목표">
          <strong>이번 학습의 달성 목표</strong>
          {goals.map((goal) => (
            <div className={styles.goal} key={goal.id}>
              {goal.passed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              <span>
                {goal.label}
                {feedback && !goal.passed && <small>{goal.hint}</small>}
              </span>
            </div>
          ))}
          <button
            className={lab.completed ? styles.completedButton : styles.verifyButton}
            data-testid="verify-goals"
            onClick={() => {
              setFeedback(true);
              if (ready) edit(lesson.id, (c) => ({ ...c, completed: true }), false);
            }}
          >
            {lab.completed ? '강의 목표를 달성했어요' : '목표 달성 확인'}
          </button>
          {feedback && !ready && (
            <p className={styles.inlineHint}>
              본문 활동의 관찰·확인 문제와 미완료 연결을 확인하세요.
            </p>
          )}
        </div>
        {lesson.id === 'pipeline-capstone' && (
          <p className={styles.inlineHint}>
            모니터링 → 원본 데이터는 개선 피드백 선입니다. 데이터 실행 순서의 순환과 구분합니다.{' '}
            <Link to="/playground">자유 Playground에서 이어서 구성하기</Link>
          </p>
        )}
        <button
          className={styles.subtle}
          onClick={() => {
            if (confirm('이 강의의 활동·노드·완료 기록을 초기화할까요?')) {
              resetLesson(lesson.id);
              setFeedback(false);
            }
          }}
        >
          이 실습 초기화
        </button>
      </div>
    </section>
  );
}
