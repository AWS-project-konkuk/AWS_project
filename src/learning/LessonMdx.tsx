import type { MDXComponents } from 'mdx/types';
import { createContext, isValidElement, useContext, useState, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Activity as LearningActivity } from '../activities/Activity';
import { lessonById } from '../curriculum/blockml';
import type { NodeExampleSpec } from '../curriculum/nodeExamples';
import type { Lesson, Reading } from '../curriculum/types';
import { WeeklyLab } from '../weekly/WeeklyLab';
import { getLab } from './blockProgress';
import { InlineNodeExample } from './InlineNodeExample';
import { useLearning } from './LearningStore';
import styles from './LessonLayout.module.css';
import { LessonMedia } from './LessonMedia';
import { Understanding } from './Understanding';

const Context = createContext<Lesson | null>(null);
function useLesson() {
  const lesson = useContext(Context);
  if (!lesson) throw new Error('강의 컴포넌트는 MDX 강의 안에서 사용하세요.');
  return lesson;
}
export function LessonMdxProvider({ lesson, children }: { lesson: Lesson; children: ReactNode }) {
  return <Context.Provider value={lesson}>{children}</Context.Provider>;
}
function NodeExample({ spec }: { spec?: NodeExampleSpec }) {
  const lesson = useLesson();
  const selected = spec ?? lesson.nodeExample;
  if (!selected)
    throw new Error(`${lesson.id}: NodeExample의 spec 또는 강의 설정의 nodeExample을 작성하세요.`);
  return <InlineNodeExample lessonId={lesson.id} spec={selected} />;
}
function Activity({ open = false }: { open?: boolean }) {
  const lesson = useLesson();
  if (!lesson.activity)
    throw new Error(`${lesson.id}: Activity를 사용하려면 activity 설정이 필요합니다.`);
  return (
    <details className={styles.optionalActivity} open={open}>
      <summary>선택 활동 · 결과를 예측하고 비교하기</summary>
      <p>브라우저의 교육용 모형입니다. 실제 도구 실행이나 필수 완료 조건이 아닙니다.</p>
      <LearningActivity lesson={lesson} />
    </details>
  );
}
function Quiz() {
  return <Understanding lesson={useLesson()} />;
}
function LessonSummary({ children }: { children?: ReactNode }) {
  const lesson = useLesson();
  return (
    <section className={styles.recap}>
      <h2>핵심 정리</h2>
      {children ?? <p>{lesson.caution}</p>}
      {lesson.devops && <p>이 강의에서는 DevOps의 {lesson.devops} 개념을 함께 사용했습니다.</p>}
    </section>
  );
}
function Reflection() {
  return (
    <blockquote className={styles.reflection}>
      <strong>스스로 설명해 보기</strong>
      <p>{useLesson().reflection}</p>
    </blockquote>
  );
}
function AdvancedReadings() {
  const lesson = useLesson();
  return lesson.advanced ? (
    <details className={styles.references}>
      <summary>심화 읽기 · 기본 완료 조건에 포함하지 않습니다</summary>
      {lesson.advanced.map((part) => (
        <section key={part.title}>
          <h2>{part.title}</h2>
          <p>{part.body}</p>
          <LessonMedia part={part} />
        </section>
      ))}
    </details>
  ) : null;
}
function References() {
  const lesson = useLesson();
  return (
    <details className={styles.references}>
      <summary>참고 자료 {lesson.references.length}개</summary>
      {lesson.references.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          {source.title}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      ))}
    </details>
  );
}
function Figure({
  src,
  alt,
  caption,
  sourceTitle,
  sourceUrl,
}: {
  src: string;
  alt: string;
  caption?: string;
  sourceTitle?: string;
  sourceUrl?: string;
}) {
  const image: NonNullable<Reading['image']> = {
    src,
    alt,
    caption,
    ...(sourceTitle && sourceUrl ? { source: { title: sourceTitle, url: sourceUrl } } : {}),
  };
  return <LessonMedia part={{ title: alt, body: '', image }} />;
}
function MdxImage({ src = '', alt = '', title }: { src?: string; alt?: string; title?: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span role="status">이미지를 불러오지 못했습니다. {alt}</span>
  ) : (
    <a
      className={styles.mdxImage}
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={`${alt} 원본 보기`}
    >
      <img
        src={src}
        alt={alt}
        title={title}
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </a>
  );
}
function MdxPre({ children }: { children?: ReactNode }) {
  if (
    isValidElement<{ className?: string; children?: ReactNode }>(children) &&
    typeof children.props.children === 'string'
  ) {
    const language = children.props.className?.replace(/^language-/, '') ?? 'text';
    return (
      <LessonMedia
        part={{
          title: language,
          body: '',
          code: { language, text: children.props.children.replace(/\n$/, '') },
        }}
      />
    );
  }
  return <pre>{children}</pre>;
}
function MdxTable({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.tableWrap} role="region" aria-label="강의 비교표" tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}
function Reveal({ title = '해설 보기', children }: { title?: string; children?: ReactNode }) {
  return (
    <details className={styles.references}>
      <summary>{title}</summary>
      {children}
    </details>
  );
}
function Callout({ title = '참고', children }: { title?: string; children?: ReactNode }) {
  return (
    <aside className={styles.mdxCallout}>
      <strong>{title}</strong>
      {children}
    </aside>
  );
}
function Question({
  id,
  question,
  options,
  correct,
  explanation,
}: {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}) {
  const lesson = useLesson();
  const { state, edit } = useLearning();
  if (
    !id ||
    !options.length ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct >= options.length
  )
    throw new Error('Question의 고유 id, 선택지, 정답 번호를 확인하세요.');
  const key = `_mdxQuestion:${id}`,
    answer = getLab(state.data, lesson.id).answers[key];
  return (
    <section className={styles.understanding} aria-label={`연습 문제 · ${question}`}>
      <fieldset>
        <legend>{question}</legend>
        {options.map((option, index) => (
          <label key={`${index}-${option}`}>
            <input
              type="radio"
              name={`${lesson.id}-${id}`}
              checked={answer === index}
              onChange={() =>
                edit(
                  lesson.id,
                  (lab) => ({ ...lab, answers: { ...lab.answers, [key]: index } }),
                  false,
                )
              }
            />
            {option}
          </label>
        ))}
      </fieldset>
      {answer !== undefined && (
        <p role="status">
          {answer === correct ? '맞습니다.' : '다시 생각해 보세요.'} {explanation}
        </p>
      )}
    </section>
  );
}
function WorkflowLab({ lessonId }: { lessonId: string }) {
  const lesson = lessonById[lessonId];
  if (!lesson?.workflow) throw new Error(`${lessonId}: 종합 실습 강의 ID가 필요합니다.`);
  return (
    <div className={styles.mdxWorkflow}>
      <WeeklyLab lesson={lesson} />
    </div>
  );
}

// 컴포넌트는 모듈 단위로 고정해 문항 선택·노드 이동 때 실습이 재생성되지 않게 합니다.
export const lessonMdxComponents: MDXComponents = {
  NodeExample,
  Activity,
  Quiz,
  LessonSummary,
  Reflection,
  AdvancedReadings,
  References,
  Figure,
  Reveal,
  Callout,
  Question,
  WorkflowLab,
  img: MdxImage,
  pre: MdxPre,
  table: MdxTable,
};
