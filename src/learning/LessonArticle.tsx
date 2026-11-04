import { useEffect, useRef } from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { chapterLabel } from '../curriculum/catalog';
import type { Lesson } from '../curriculum/types';
import { lessonBodies } from '../content/lessons';
import { WorkflowMap } from './WorkflowMap';
import { LessonMdxProvider, lessonMdxComponents } from './LessonMdx';
import styles from './LessonLayout.module.css';

export function LessonArticle({ lesson, completed }: { lesson: Lesson; completed: boolean }) {
  const article = useRef<HTMLElement>(null);
  const Content = lessonBodies[lesson.id];
  useEffect(() => {
    if (article.current) article.current.scrollTop = 0;
  }, [lesson.id]);
  return (
    <article
      ref={article}
      className={styles.article}
      aria-label="강의 설명"
      tabIndex={0}
      data-testid="lesson-reading"
    >
      <header className={styles.documentHeader}>
        <h1>{lesson.title}</h1>
        <p className={styles.lead}>{lesson.summary}</p>
        <div className={styles.documentMeta}>
          <span>{chapterLabel(lesson.week)}</span>
          <span>MLOps</span>
          <span>원문 {lesson.sourceWeek ?? lesson.week}주차</span>
          <span>
            <Clock3 size={14} />약 {lesson.minutes}분
          </span>
          {completed && (
            <span className={styles.completed}>
              <CheckCircle2 size={14} />
              목표 달성
            </span>
          )}
        </div>
      </header>
      <p className={styles.learningAim}>
        <strong>이 강의에서 할 일</strong>
        {lesson.scenario}
      </p>
      <LessonMdxProvider lesson={lesson}>
        <Content components={lessonMdxComponents} />
      </LessonMdxProvider>
      <WorkflowMap lesson={lesson} />
      <p className={styles.documentEnd}>
        원문 링크의 명령·YAML은 실제 환경에서 수행하는 추가 실습입니다. 사이트의 이해 확인과 별도로
        진행하세요.
      </p>
    </article>
  );
}
