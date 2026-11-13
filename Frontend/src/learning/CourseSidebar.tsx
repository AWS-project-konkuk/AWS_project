import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { chapters, chapterLabel, lessons } from '../curriculum/catalog';
import type { Lesson } from '../curriculum/types';
import { useLessonCompletion } from '../systemLab/store';
import { useLearning } from './LearningStore';
import styles from './LessonLayout.module.css';

export function CourseSidebar({
  lesson,
  open,
  onClose,
}: {
  lesson: Lesson;
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useLearning();
  const isComplete = useLessonCompletion(state.data);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 1023px)').matches);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 1023px)');
    const change = () => {
      setNarrow(media.matches);
      if (media.matches) onClose();
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [onClose]);
  useEffect(() => {
    if (!narrow || !dialog.current) return;
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open, narrow]);
  const content = (
    <>
      <header className={styles.sidebarHeader}>
        <Link to="/learn">
          <ArrowLeft size={16} />
          학습 과정
        </Link>
        <button type="button" onClick={onClose} aria-label="강의 목차 닫기">
          <X size={18} />
        </button>
      </header>
      <div className={styles.sidebarIntro}>
        <strong>MLOps 학습 목차</strong>
        <p>
          전체 지도 + {chapters[0].week}~{chapters[chapters.length - 1].week}단원
        </p>
      </div>
      <nav aria-label="강의 목차" className={styles.chapterNav}>
        {chapters.map((chapter) => {
          const items = lessons.filter((item) => item.week === chapter.week);
          return (
            <details key={chapter.week} open={chapter.week === lesson.week}>
              <summary>
                <span>
                  <small>{chapterLabel(chapter.week)}</small>
                  <strong>{chapter.title}</strong>
                </span>
                <ChevronDown size={14} />
              </summary>
              <div>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/learn/${item.id}`}
                    aria-current={item.id === lesson.id ? 'page' : undefined}
                    onClick={() => {
                      if (narrow) onClose();
                    }}
                  >
                    <span>
                      {isComplete(item.id) ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        String(lessons.indexOf(item) + 1).padStart(2, '0')
                      )}
                    </span>
                    <div className={styles.lessonLabel}>
                      {item.title}
                      {item.workflow ? (
                        <div>
                          <small className={styles.practiceBadge}>노드 실습</small>
                        </div>
                      ) : item.nodeExample || item.contentFeatures?.nodeExamples ? (
                        <div>
                          <small className={styles.practiceBadge}>본문 노드 학습</small>
                        </div>
                      ) : item.activity || item.contentFeatures?.activities ? (
                        <div>
                          <small className={styles.practiceBadge}>선택 활동</small>
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          );
        })}
      </nav>
      <footer className={styles.sidebarFooter}>강의는 원하는 순서로 살펴볼 수 있습니다.</footer>
    </>
  );
  return narrow ? (
    <dialog
      ref={dialog}
      id="course-sidebar"
      className={styles.drawer}
      aria-label="강의 전체 목차"
      onCancel={onClose}
    >
      {content}
    </dialog>
  ) : (
    <aside
      id="course-sidebar"
      className={styles.sidebar}
      hidden={!open}
      aria-label="강의 전체 목차"
    >
      {content}
    </aside>
  );
}
