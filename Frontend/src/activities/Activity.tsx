import type { Lesson } from '../curriculum/types';
import styles from './Activity.module.css';
import { getActivityDefinition } from './activityRegistry';

/** 펼침·접힘과 공통 안내를 제공하고, 종류별 동작은 등록된 본문에 위임합니다. */
export function Activity({ lesson, open = false }: { lesson: Lesson; open?: boolean }) {
  const spec = lesson.activity;
  if (!spec) throw new Error(`${lesson.id}: Activity를 사용하려면 activity 설정이 필요합니다.`);
  const definition = getActivityDefinition(spec.kind);
  const Body = definition.component;

  return (
    <details className={styles.optionalActivity} open={open}>
      <summary>{definition.summary}</summary>
      <p>브라우저의 교육용 모형입니다. 실제 도구 실행이나 필수 완료 조건이 아닙니다.</p>
      <section
        className={styles.activity}
        aria-label={definition.label ?? '본문 시각 활동'}
        data-testid="inline-activity"
      >
        <header>
          <h3>{definition.title ?? spec.task}</h3>
        </header>
        <Body key={lesson.id} lesson={lesson} spec={spec} />
      </section>
    </details>
  );
}
