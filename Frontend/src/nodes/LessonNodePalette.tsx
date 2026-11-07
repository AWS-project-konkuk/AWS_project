import type { LabState, Lesson } from '../curriculum/types';
import { activeNodeIds, addLessonNode, removeLessonNode } from './lessonNodes';
import styles from './Nodes.module.css';
export function LessonNodePalette({
  lesson,
  lab,
  onChange,
}: {
  lesson: Lesson;
  lab: LabState;
  onChange: (change: (current: LabState) => LabState) => void;
}) {
  const active = new Set(activeNodeIds(lab));
  return (
    <section className={styles.palette} aria-label="과제 노드">
      <header>
        <strong>노드 추가</strong>
        <button
          disabled={active.size === lesson.nodes.length}
          onClick={() =>
            onChange((current) => ({
              ...current,
              activeNodes: current.nodes.map((node) => node.id),
              completed: false,
            }))
          }
        >
          필요 노드 모두 추가
        </button>
      </header>
      <p>버튼을 눌러 추가한 뒤 출력 점과 입력 점을 연결하세요.</p>
      <div>
        {lesson.nodes.map((node) => (
          <div className={styles.paletteRow} key={node.id}>
            <span>
              <strong>{node.title}</strong>
              <small>{node.detail}</small>
            </span>
            <button
              data-testid={`add-node-${node.id}`}
              disabled={active.has(node.id)}
              onClick={() => onChange((current) => addLessonNode(current, node.id))}
            >
              {active.has(node.id) ? '추가됨' : '추가'}
            </button>
            {active.has(node.id) && (
              <button
                aria-label={`${node.title} 노드 삭제`}
                onClick={() => onChange((current) => removeLessonNode(current, node.id))}
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
