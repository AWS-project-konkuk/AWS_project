import { ThemeControl } from '../settings/ThemeControl';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  Search,
  Target,
} from 'lucide-react';
import { lessons, lessonById, chapters, chapterLabel } from '../curriculum/catalog';
import { useLessonCompletion } from '../systemLab/store';
import { useLearning } from './LearningStore';
import styles from './Learning.module.css';

const href = (id: string) => `#/learn/${id}`;
const LessonPage = lazy(() =>
  import('./LessonPage').then((module) => ({ default: module.LessonPage })),
);
const PlaygroundPage = lazy(() =>
  import('../playground/PlaygroundPage').then((module) => ({ default: module.PlaygroundPage })),
);
function Header() {
  const { state, saveStatus, recover } = useLearning();
  const [recovery, setRecovery] = useState(false);
  const isComplete = useLessonCompletion(state.data);
  const count = lessons.filter((lesson) => isComplete(lesson.id)).length;
  return (
    <>
      <header className={styles.header}>
        <a className={styles.logo} href="#/learn" aria-label="BlockML 학습 과정 홈">
          <span>
            <GraduationCap size={24} />
          </span>
          <strong>
            Block<span>ML</span>
          </strong>
          <small>MLOps 학습실</small>
        </a>
        <nav>
          <a href="#/learn" aria-current={location.hash !== '#/playground' ? 'page' : undefined}>
            학습 과정
          </a>
          <a
            href="#/playground"
            aria-current={location.hash === '#/playground' ? 'page' : undefined}
          >
            Playground
          </a>
          <span className={styles.progressPill}>
            <CheckCircle2 size={14} />
            {count} / {lessons.length} 완료
          </span>
        </nav>
        <ThemeControl />
        <div className={styles.save} role="status">
          {saveStatus}
        </div>
      </header>
      {(state.blocked || saveStatus.includes('실패')) && (
        <div className={styles.saveWarning} role="alert">
          {saveStatus}
          {state.blocked && <button onClick={() => setRecovery(true)}>학습 저장 초기화</button>}
        </div>
      )}
      {recovery && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
          >
            <h2 id="recovery-title">학습 저장 데이터를 초기화할까요?</h2>
            <p>
              새 학습 과정의 진행과 설정을 초기화합니다. 이전 버전의 파이프라인 실습 데이터는
              보존합니다.
            </p>
            <div>
              <button autoFocus onClick={() => setRecovery(false)}>
                취소
              </button>
              <button
                className={styles.primary}
                onClick={() => {
                  recover();
                  setRecovery(false);
                }}
              >
                저장 초기화
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function LearningHub() {
  const { state } = useLearning();
  const [query, setQuery] = useState('');
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const isComplete = useLessonCompletion(state.data);
  const count = lessons.filter((lesson) => isComplete(lesson.id)).length;
  const next = lessons.find((lesson) => !isComplete(lesson.id)) ?? lessons[0];
  const matches = lessons.filter(
    (lesson) =>
      (activeWeek === null || lesson.week === activeWeek) &&
      `${lesson.title} ${lesson.summary} ${lesson.concepts.join(' ')} ${lesson.reading.map((part) => `${part.title} ${part.body}`).join(' ')} ${(lesson.advanced ?? []).map((part) => `${part.title} ${part.body}`).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <main className={styles.hub}>
      <section className={styles.hero}>
        <div>
          <h1>
            MLOps, 하나씩 이해하고
            <br />
            직접 해결해 보세요.
          </h1>
          <p>AWS 기초부터 모델 운영까지, 읽고 연결하며 전체 흐름을 익힙니다.</p>
          <a className={styles.primary} href={href(next.id)}>
            {count ? '이어서 학습하기' : '첫 강의 시작하기'}
            <ArrowRight size={16} />
          </a>
          <a
            className={styles.heroSecondary}
            href="#curriculum"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('curriculum')?.scrollIntoView({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              });
            }}
          >
            전체 과정 살펴보기
            <ArrowDown size={13} />
          </a>
        </div>
        <aside className={styles.journey}>
          <strong>읽고, 연결하고, 설명하기</strong>
          <div className={styles.journeyIcons}>
            <span>
              <BookOpen aria-hidden="true" />
              <span>개념 이해</span>
            </span>
            <i />
            <span>
              <Layers3 aria-hidden="true" />
              <span>흐름 연결</span>
            </span>
            <i />
            <span>
              <Target aria-hidden="true" />
              <span>이해 확인</span>
            </span>
          </div>
          <p>실제 인프라 설치 없이 브라우저에서 안전하게 실험합니다.</p>
          <div className={styles.journeyProgress}>
            <span>나의 학습 진행</span>
            <b>
              {count} / {lessons.length}
            </b>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-label="나의 학습 진행"
            aria-valuemin={0}
            aria-valuemax={lessons.length}
            aria-valuenow={count}
          >
            <i style={{ transform: `scaleX(${count / lessons.length})` }} />
          </div>
        </aside>
      </section>
      <section className={styles.principles}>
        <div>
          <BookOpen size={19} />
          <span>
            <strong>개념 먼저 이해하기</strong>
            <small>강의별 설명과 공식 자료</small>
          </span>
        </div>
        <div>
          <Layers3 size={19} />
          <span>
            <strong>직접 바꿔보기</strong>
            <small>연결과 설정으로 살펴보는 원리</small>
          </span>
        </div>
        <div>
          <Target size={19} />
          <span>
            <strong>목표를 이루며 학습하기</strong>
            <small>실험 결과를 통한 완료 확인</small>
          </span>
        </div>
      </section>
      <section id="curriculum" className={styles.curriculum}>
        <div className={styles.curriculumHeading}>
          <div>
            <h2>필수 기초부터 MLOps의 전체 흐름까지</h2>
            <p>
              설명 중심 학습과 선택 활동·워크플로·종합 과제로 총 {lessons.length}개 강의를
              학습합니다.
            </p>
          </div>
          <label className={styles.search}>
            <Search size={16} />
            <input
              aria-label="강의 검색"
              placeholder="궁금한 개념을 찾아보세요"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <nav className={styles.filters} aria-label="단원 선택">
          {[null, ...chapters.map((chapter) => chapter.week)].map((week) => (
            <button
              key={week ?? 'all'}
              aria-pressed={activeWeek === week}
              onClick={() => setActiveWeek(week)}
            >
              {week === null ? '전체 과정' : chapterLabel(week)}
            </button>
          ))}
        </nav>
        {chapters.map((week) => {
          const items = matches.filter((lesson) => lesson.week === week.week);
          if (!items.length) return null;
          return (
            <section
              key={week.title}
              className={styles.chapter}
              aria-label={chapterLabel(week.week)}
            >
              <div className={styles.chapterHeading}>
                <span>{chapterLabel(week.week)}</span>
                <div>
                  <h3>{week.title}</h3>
                  <p>{week.summary}</p>
                </div>
                <span>
                  {
                    lessons.filter((lesson) => lesson.week === week.week && isComplete(lesson.id))
                      .length
                  }{' '}
                  / {lessons.filter((lesson) => lesson.week === week.week).length} 완료
                </span>
              </div>
              <div className={styles.cards}>
                {items.map((lesson) => {
                  const complete = isComplete(lesson.id);
                  return (
                    <a
                      key={lesson.id}
                      href={href(lesson.id)}
                      className={styles.lessonCard}
                      data-testid={`lesson-card-${lesson.id}`}
                    >
                      <span className={styles.lessonNumber}>
                        {String(lessons.indexOf(lesson) + 1).padStart(2, '0')}
                      </span>
                      <div className={styles.lessonIdentity}>
                        <h4>{lesson.title}</h4>
                        <p>{lesson.summary}</p>
                      </div>
                      <div className={styles.lessonDetails}>
                        {(lesson.workflow ||
                          lesson.nodeExample ||
                          lesson.activity ||
                          lesson.contentFeatures?.nodeExamples ||
                          lesson.contentFeatures?.activities) && (
                          <span className={styles.practiceBadge}>
                            {lesson.workflow
                              ? '노드 실습'
                              : lesson.nodeExample || lesson.contentFeatures?.nodeExamples
                                ? '본문 노드 학습'
                                : '선택 활동'}
                          </span>
                        )}
                        <div className={styles.concepts}>
                          {lesson.concepts.slice(0, 3).map((concept) => (
                            <span key={concept}>{concept}</span>
                          ))}
                        </div>
                      </div>
                      <footer>
                        <span className={complete ? styles.cardComplete : styles.cardPending}>
                          {complete ? (
                            <>
                              <Check size={12} />
                              완료
                            </>
                          ) : (
                            <>
                              <Clock3 size={11} />
                              {lesson.minutes}분
                            </>
                          )}
                        </span>
                        <span className={styles.lessonAction}>
                          {complete ? '다시 학습하기' : '학습 시작'}
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </span>
                      </footer>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!matches.length && (
          <div className={styles.noMatches}>
            <h3>해당하는 강의가 없습니다.</h3>
            <p>다른 검색어 또는 단원으로 찾아보세요.</p>
            <button
              onClick={() => {
                setQuery('');
                setActiveWeek(null);
              }}
            >
              전체 과정 보기
            </button>
          </div>
        )}
      </section>
      <footer className={styles.siteFooter}>
        <span>BlockML, 연결하며 배우는 MLOps</span>
        <span>학습자를 위한 개념 실습. 실제 클라우드 비용 없음</span>
      </footer>
    </main>
  );
}

function RoutedLearning() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const change = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const slug = hash.startsWith('#/learn/') ? hash.slice('#/learn/'.length) : '';
  const lesson = Object.hasOwn(lessonById, slug) ? lessonById[slug] : undefined;
  const isPlayground = hash === '#/playground';
  useEffect(() => {
    document.title = isPlayground
      ? 'Playground | BlockML'
      : lesson
        ? `${lesson.title} | BlockML`
        : 'BlockML | MLOps 학습 과정';
  }, [lesson, isPlayground]);
  return (
    <div className={styles.appFrame} data-lesson={Boolean(lesson) || isPlayground}>
      <Header />
      {isPlayground ? (
        <Suspense
          fallback={
            <main className={styles.lessonLoading} aria-busy="true">
              Playground를 여는 중입니다.
            </main>
          }
        >
          <PlaygroundPage />
        </Suspense>
      ) : slug && !lesson ? (
        <main className={styles.notFound}>
          <h1>강의를 찾을 수 없습니다.</h1>
          <a href="#/learn">학습 과정으로 돌아가기</a>
        </main>
      ) : lesson ? (
        <Suspense
          fallback={
            <main className={styles.lessonLoading} aria-busy="true">
              강의를 여는 중입니다.
            </main>
          }
        >
          <LessonPage key={lesson.id} lesson={lesson} />
        </Suspense>
      ) : (
        <LearningHub />
      )}
    </div>
  );
}
export function LearningApp() {
  return <RoutedLearning />;
}
