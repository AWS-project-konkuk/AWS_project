import { useId, type ReactNode } from 'react';
import type { Lesson } from '../curriculum/types';
import styles from './Activity.module.css';
import { dedicatedActivities, simulationScenes } from './activityRegistry';
import { ScenarioActivity } from './ScenarioActivity';
import { SimulationActivity } from './SimulationActivity';
import type { ActivityView } from './types';

function ActivityFrame({
  view,
  open,
  children,
}: {
  view: ActivityView;
  open: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <details className={styles.optionalActivity} open={open} data-testid="activity-frame">
      <summary>
        <h3 id={titleId}>{view.title}</h3>
        <span>선택 활동</span>
      </summary>
      <section className={styles.activity} aria-labelledby={titleId} data-testid="inline-activity">
        {view.instruction && <p className={styles.instruction}>{view.instruction}</p>}
        {children}
        <p className={styles.notice}>
          브라우저에서 관찰하는 교육용 모형입니다. 강의 완료 조건과 별개입니다.
        </p>
        {view.note && <p className={styles.notice}>{view.note}</p>}
      </section>
    </details>
  );
}

function ActivityBody({ lesson, view }: { lesson: Lesson; view: ActivityView }) {
  switch (view.type) {
    case 'machine':
    case 'virtual':
    case 'storage':
    case 'io':
    case 'feature-store': {
      const Body = dedicatedActivities[view.type];
      return <Body />;
    }
    default: {
      if ('cases' in view && view.cases) {
        return <ScenarioActivity cases={view.cases} showFlow={view.type === 'structure'} />;
      }
      if (!lesson.activity) throw new Error(`${lesson.id}: 활동 계산 설정이 필요합니다.`);
      return (
        <SimulationActivity
          lesson={lesson}
          spec={lesson.activity}
          scene={simulationScenes[view.type]}
        />
      );
    }
  }
}

export function Activity({ lesson, open = false }: { lesson: Lesson; open?: boolean }) {
  const view = lesson.activityView;
  if (!view) throw new Error(`${lesson.id}: Activity 화면 설정이 필요합니다.`);
  return (
    <ActivityFrame key={lesson.id} view={view} open={open}>
      <ActivityBody lesson={lesson} view={view} />
    </ActivityFrame>
  );
}
