import { TourGuide } from './TourGuide';
import { useCallback, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { chapterLabel, lessons } from '../curriculum/catalog';
import type { Lesson } from '../curriculum/types';
import { CourseSidebar } from './CourseSidebar';
import { LessonArticle } from './LessonArticle';
import { SystemLab } from '../systemLab/SystemLab';
import { pilotLesson } from '../systemLab/model';
import { useLessonCompletion } from '../systemLab/store';
import { WeeklyLab } from '../weekly/WeeklyLab';
import { useLearning } from './LearningStore';
import styles from './LessonLayout.module.css';
import { getLab } from './blockProgress';
import { workflowGoals } from '../weekly/engine';

export function LessonPage({ lesson }: { lesson: Lesson }) {
  const { state } = useLearning();
  const [sidebarOpen, setSidebarOpen] = useState(() => matchMedia('(min-width: 1024px)').matches);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const [view, setView] = useState<'split' | 'reading' | 'practice'>('reading');
  const changeView = (next: 'split' | 'reading' | 'practice') => {
    setView(next);
    if (next !== 'reading') setSidebarOpen(false);
  };
  const index = lessons.indexOf(lesson);
  const next = lessons[index + 1];
  const completed = useLessonCompletion(state.data)(lesson.id);
  const pilot = lesson.id === pilotLesson;
  const pendingGoal =
    lesson.workflow && !pilot
      ? workflowGoals(lesson, getLab(state.data, lesson.id)).find((goal) => !goal.passed)
      : undefined;
  const startPractice = () => changeView('practice');
  return (
    <main className={styles.shell}>
      <CourseSidebar lesson={lesson} open={sidebarOpen} onClose={closeSidebar} />
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.sidebarToggle}
            aria-label={sidebarOpen ? '강의 목차 접기' : '강의 목차 열기'}
            aria-expanded={sidebarOpen}
            aria-controls="course-sidebar"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
            <span>강의 목차</span>
          </button>
          <div className={styles.breadcrumb}>
            <a href="#/learn">학습 과정</a>
            <ChevronRight size={13} />
            <span>{chapterLabel(lesson.week)}</span>
            <ChevronRight size={13} />
            <span>{lesson.title}</span>
          </div>
          {lesson.workflow && (
            <div className={styles.viewControls} role="group" aria-label="학습 화면 보기">
              <button
                type="button"
                aria-pressed={view === 'split'}
                onClick={() => changeView('split')}
              >
                설명과 실습
              </button>
              <button
                type="button"
                aria-pressed={view === 'reading'}
                onClick={() => changeView('reading')}
              >
                학습 영역 확장
              </button>
              <button
                type="button"
                aria-pressed={view === 'practice'}
                onClick={() => changeView('practice')}
              >
                실습 영역 확장
              </button>
            </div>
          )}
          <TourGuide workflow={Boolean(lesson.workflow)} prepare={() => setView('split')} />
        </div>
        <div
          className={styles.content}
          data-view={lesson.workflow ? view : 'interactive'}
          data-testid="lesson-workspace"
        >
          <LessonArticle
            lesson={lesson}
            completed={completed}
            onStartPractice={lesson.workflow ? startPractice : undefined}
          />
          {lesson.workflow && (
            <div
              className={styles.practice}
              aria-label="고정 실습 영역"
              data-testid="lesson-practice"
              data-system-lab={pilot || undefined}
            >
              {pilot ? (
                <SystemLab key={lesson.id} />
              ) : (
                <WeeklyLab key={lesson.id} lesson={lesson} />
              )}
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <a href={index ? `#/learn/${lessons[index - 1].id}` : '#/learn'}>
            <ArrowLeft size={15} />
            {index ? '이전 강의' : '전체 과정'}
          </a>
          <span>
            {completed
              ? '목표 달성이 기록되었습니다.'
              : lesson.workflow
                ? view === 'reading'
                  ? '설명을 읽었다면 실습을 시작하세요.'
                  : pendingGoal
                    ? `남은 목표: ${pendingGoal.label}`
                    : pilot
                      ? '실행 성공 후 결과 패널에서 이해 확인에 답하세요.'
                      : '설정·결과에서 실습 완료를 기록하세요.'
                : '설명을 읽고 이해 확인 문제에 답하세요.'}
          </span>
          {lesson.workflow && !completed && view === 'reading' && (
            <button className={styles.next} onClick={startPractice}>
              실습 시작하기
            </button>
          )}
          {next ? (
            completed ? (
              <a className={styles.next} href={`#/learn/${next.id}`}>
                다음 강의
                <ArrowRight size={15} />
              </a>
            ) : (
              <button type="button" disabled>
                다음 강의
                <ArrowRight size={15} />
              </button>
            )
          ) : (
            <a className={styles.next} href="#/learn">
              전체 과정
              <ArrowRight size={15} />
            </a>
          )}
        </footer>
      </div>
    </main>
  );
}
