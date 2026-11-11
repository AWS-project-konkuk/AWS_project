import { useEffect, useRef } from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { chapterLabel } from '../curriculum/catalog';
import type { Lesson } from '../curriculum/types';
import { lessonBodies } from '../content/lessons';
import { pilotLesson } from '../systemLab/model';
import { WorkflowMap } from './WorkflowMap';
import { LessonMdxProvider, lessonMdxComponents } from './LessonMdx';
import styles from './LessonLayout.module.css';

export function LessonArticle({
  lesson,
  completed,
  onStartPractice,
}: {
  lesson: Lesson;
  completed: boolean;
  onStartPractice?: () => void;
}) {
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
      {onStartPractice && (
        <section className={styles.practiceEntry} aria-label="실습 시작 안내">
          <h2>읽은 내용을 실습으로 확인하기</h2>
          <p>
            {lesson.id === pilotLesson
              ? '시스템과 노드를 실행 상태로 바꾸고 입출력을 연결해 두 Pod의 응답을 확인하세요.'
              : '예시 실행, 잘못된 구성 수정, 새 구성 만들기 순서로 연습하세요. 실습 화면의 완료 조건에서 남은 목표를 확인할 수 있습니다.'}
          </p>
          <button onClick={onStartPractice}>이제 실습 시작하기</button>
        </section>
      )}
      <WorkflowMap lesson={lesson} />
      {lesson.id !== pilotLesson && (
        <p className={styles.documentEnd}>
          원문 링크의 명령·YAML은 실제 환경에서 수행하는 추가 실습입니다. 사이트의 이해 확인과
          별도로 진행하세요.
        </p>
      )}
    </article>
  );
}
