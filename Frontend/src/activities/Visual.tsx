import { motion } from 'motion/react';
import type { Answer } from '../curriculum/types';
import type { ActivitySpec, ActivityResult } from './types';
import { metricSamples } from './simulation';
import styles from './Activity.module.css';
export function Visual({
  spec,
  answers: a,
  result: r,
  phase,
  reduced,
}: {
  spec: ActivitySpec;
  answers: Record<string, Answer>;
  result: ActivityResult;
  phase: number;
  reduced: boolean;
}) {
  const n = (k: string, d = 0) => Number(a[k] ?? d);
  const active = Math.min(phase, Math.max(r.steps.length - 1, 0));
  const box = (title: string, items: string[]) => (
    <div className={styles.layerBox}>
      <strong>{title}</strong>
      {items.map((s, i) => (
        <motion.div
          key={`${i}-${s}`}
          layout={!reduced}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {s}
        </motion.div>
      ))}
    </div>
  );
  if (spec.kind === 'compute') {
    const count = Math.min(n('jobs'), 64);
    const elapsed =
      (phase / 12) * Math.max(n('jobs'), n('setup') + Math.ceil(n('jobs') / n('width')));
    const cpuDone = Math.floor(elapsed),
      gpuDone = Math.max(0, Math.floor(elapsed - n('setup'))) * n('width');
    return (
      <div className={styles.compute}>
        <div>
          <strong>CPU · 순차 예시</strong>
          <div className={styles.jobs}>
            {Array.from({ length: count }, (_, i) => (
              <motion.i
                key={i}
                aria-hidden="true"
                animate={{
                  opacity: i < cpuDone ? 1 : 0.2,
                  scale: !reduced && i === cpuDone ? 1.15 : 1,
                }}
              />
            ))}
          </div>
          <small>공통 시간축에서 연산 1개씩 처리</small>
        </div>
        <div>
          <strong>GPU · 병렬 묶음</strong>
          <div className={styles.jobs}>
            {Array.from({ length: count }, (_, i) => (
              <motion.i key={i} aria-hidden="true" animate={{ opacity: i < gpuDone ? 1 : 0.2 }} />
            ))}
          </div>
          <small>준비 후 묶음당 {n('width')}개 · 화면은 최대 64개 표시</small>
        </div>
      </div>
    );
  }
  if (spec.kind === 'memory') {
    const total = 3 + n('batch') * (a.precision === 'amp' ? 0.1 : 0.2);
    return (
      <div>
        <div
          className={styles.memory}
          role="img"
          aria-label={`VRAM ${n('vram')} GiB 중 ${total.toFixed(1)} GiB 사용`}
        >
          <motion.div
            animate={{ width: `${Math.min(100, (3 / n('vram')) * 100)}%` }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          >
            학습 상태
          </motion.div>
          <motion.div
            animate={{
              width: `${Math.min(100, (Math.max(0, Math.min(total, n('vram')) - 3) / n('vram')) * 100)}%`,
            }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          >
            활성값
          </motion.div>
        </div>
        <p>
          {total.toFixed(1)} / {n('vram')} GiB {total > n('vram') ? '· OOM' : '· 할당 가능'}
        </p>
      </div>
    );
  }
  if (spec.kind === 'parallel') {
    const g = n('gpus'),
      isData = spec.variant === 'data';
    return (
      <div className={styles.parallel}>
        <strong>
          {isData
            ? '데이터 조각 → 전체 모델 복제본'
            : spec.variant === 'model'
              ? '레이어 1 → 레이어 2 → …'
              : '하나의 행렬 → 부분 행렬 연산 → 결합'}
        </strong>
        <div className={styles.gpus}>
          {Array.from({ length: g }, (_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: phase === 0 || spec.variant !== 'model' || i === phase % g ? 1 : 0.4,
              }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              <b>GPU {i + 1}</b>
              <span>
                {isData
                  ? `데이터 ${i + 1} / 전체 모델`
                  : spec.variant === 'model'
                    ? `레이어 그룹 ${i + 1}`
                    : `행렬 조각 ${i + 1}`}
              </span>
              <small>{isData ? n('model') : (n('model') / g).toFixed(1)} GiB</small>
            </motion.div>
          ))}
        </div>
        <p className={styles.flowBand}>
          {isData
            ? '기울기 동기화 ↔ 모든 복제본 갱신'
            : spec.variant === 'model'
              ? '중간 활성값 전달 → 다음 GPU가 계산'
              : '부분 연산 결과 ↔ 통신·결합'}
        </p>
      </div>
    );
  }
  if (spec.kind === 'virtual')
    return (
      <div className={styles.comparison}>
        {box(
          '가상머신',
          Array.from({ length: n('copies') }, (_, i) => `앱 ${i + 1} + 게스트 OS·커널`),
        )}
        {box('컨테이너', [
          ...Array.from({ length: n('copies') }, (_, i) => `격리된 앱 ${i + 1}`),
          '공유 호스트 커널',
        ])}
        <div className={styles.flowBand}>하이퍼바이저 / 컨테이너 런타임 · 호스트 하드웨어</div>
      </div>
    );
  if (['embedding', 'search'].includes(spec.kind)) {
    const fruit = a.query === 'fruit';
    const points = [
      { x: 90, y: 65, t: '사과' },
      { x: 130, y: 95, t: '바나나' },
      { x: 290, y: 175, t: 'PyTorch' },
      { x: 330, y: 145, t: 'Docker' },
    ];
    return (
      <svg
        className={styles.plot}
        viewBox="0 0 440 260"
        role="img"
        aria-label="설명용 임베딩 좌표: 과일 문서와 ML 도구 문서가 각각 모여 있습니다."
      >
        <path d="M35 20 V225 H425" fill="none" stroke="var(--soft)" />
        {points.map((p, i) => (
          <g key={p.t}>
            <circle cx={p.x} cy={p.y} r="7" fill={i < 2 ? 'var(--accent)' : 'var(--soft)'} />
            <text x={p.x + 12} y={p.y + 5}>
              {p.t}
            </text>
          </g>
        ))}
        <motion.circle
          animate={{ cx: fruit ? 105 : 310, cy: fruit ? 80 : 160 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          r="18"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        <text x="40" y="250">
          동그라미: 질문 · 실제 임베딩을 단순화한 고정 좌표
        </text>
      </svg>
    );
  }
  if (['metrics', 'drift'].includes(spec.kind)) {
    const isMetrics = spec.kind === 'metrics',
      pts = isMetrics
        ? metricSamples(n('interval'))
        : Array.from({ length: 12 }, (_, i) => ({
            x: i * 5,
            y:
              a.change === 'data'
                ? 80 + Math.sin(i * 0.7) * 45 + (i > 5 ? n('shift') : 0)
                : 100 - (i > 5 ? n('shift') : 0),
          }));
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${35 + p.x * 6} ${210 - p.y * 0.55}`).join(' ');
    return (
      <svg
        className={styles.plot}
        viewBox="0 0 440 250"
        role="img"
        aria-label={isMetrics ? '수집한 지연 시계열' : '기준 구간 이후의 데이터·품질 변화'}
      >
        <path d="M35 20 V210 H420" stroke="var(--soft)" fill="none" />
        <path d="M35 155 H420" stroke="var(--soft)" strokeDasharray="4 4" fill="none" />
        {isMetrics && (
          <>
            <path
              d={`M35 ${210 - n('limit') * 0.55} H420`}
              stroke="var(--accent)"
              strokeDasharray="5 5"
            />
            <text x="270" y={Math.max(18, 202 - n('limit') * 0.55)}>
              경고 {n('limit')}ms
            </text>
          </>
        )}
        <motion.path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          initial={false}
          animate={{ pathLength: Math.max(0.05, (active + 1) / Math.max(1, r.steps.length)) }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        />
        {pts.map((p) => (
          <circle key={p.x} cx={35 + p.x * 6} cy={210 - p.y * 0.55} r="3" fill="var(--accent)" />
        ))}
        <text x="38" y="238">
          {isMetrics ? '0초 → 60초 · 점은 실제 수집 시점' : '기준 구간 → 현재 구간 · 교육용 신호'}
        </text>
      </svg>
    );
  }
  if (spec.kind === 'release') {
    const v = spec.variant,
      actual =
        v === 'bluegreen' ? (a.phase === 'switch' ? 100 : 0) : v === 'canary' ? n('traffic') : 0,
      failed = v === 'recreate' ? n('gap') : 0;
    return (
      <div>
        <div
          className={styles.requests}
          role="img"
          aria-label={`100건 중 신규 응답 ${actual}건, 실패 ${failed}건`}
        >
          {Array.from({ length: 100 }, (_, i) => (
            <motion.i
              key={i}
              animate={{
                opacity: i < ((active + 1) / Math.max(1, r.steps.length)) * 100 ? 1 : 0.2,
              }}
              style={{
                background:
                  i < failed
                    ? 'var(--danger)'
                    : i < failed + actual
                      ? 'var(--accent)'
                      : 'var(--soft)',
              }}
            />
          ))}
        </div>
        <small>각 점 = 실제 요청 1건 · 보라: 신규 / 회색: 기존 / 빨강: 실패</small>
        {v === 'shadow' && (
          <div className={styles.flowBand}>
            실제 응답: 기존 모델 100건 → 사용자
            <br />
            별도 복제: {n('traffic')}건 → Shadow 비교 로그
          </div>
        )}
      </div>
    );
  }
  if (spec.kind === 'storage' || spec.kind === 'io')
    return (
      <div className={styles.bars}>
        {r.metrics
          .filter((m) => m.amount !== undefined)
          .map((m) => (
            <div key={m.label}>
              <span>{m.label}</span>
              <motion.div
                initial={false}
                animate={{
                  width: `${Math.max(2, ((m.amount ?? 0) / Math.max(1, ...r.metrics.map((v) => v.amount ?? 0))) * 100)}%`,
                }}
                transition={{ duration: reduced ? 0 : 0.4 }}
              />
              <small>{m.value}</small>
            </div>
          ))}
      </div>
    );
  if (['git', 'lfs', 'dvc', 'restore'].includes(spec.kind))
    return (
      <div className={styles.comparison}>
        {box(
          spec.kind === 'git' ? 'Git 이력' : 'Git 코드·메타데이터',
          spec.kind === 'git'
            ? Array.from(
                { length: Math.min(6, n('versions')) },
                (_, i) => `버전 ${i + 1} · ${n('size')} MiB`,
              )
            : [
                spec.kind === 'restore' ? `포인터 ${a.version}` : '작은 포인터·데이터 해시',
                '소스 코드',
              ],
        )}
        {box(
          spec.kind === 'lfs' ? 'LFS 저장소' : spec.kind === 'git' ? '이력 전체' : 'DVC 캐시·원격',
          spec.kind === 'restore'
            ? [`작업 데이터 ${a.checkout === 'checkout' ? a.version : 'v2'}`]
            : ['실제 데이터 파일', '필요한 버전 보관·복원'],
        )}
      </div>
    );
  if (spec.kind === 'features')
    return (
      <div className={styles.comparison}>
        {box('오프라인 · 학습', ['최근 1시간 클릭', '12회'])}
        {box('온라인 · 서빙', [
          a.definition === 'hour' ? '최근 1시간 클릭' : '최근 24시간 클릭',
          a.definition === 'hour' ? '12회 · 정의 일치' : '84회 · 정의 불일치',
        ])}
      </div>
    );
  if (spec.kind === 'container')
    return (
      <div className={styles.comparison}>
        {box('공유 템플릿', ['코드 + 의존성', '이미지 1개'])}
        {box(
          '실행 인스턴스',
          Array.from({ length: n('copies') }, (_, i) => `컨테이너 ${i + 1} · 개별 쓰기 상태`),
        )}
      </div>
    );
  if (spec.kind === 'replicas')
    return (
      <div className={styles.gpus}>
        {Array.from({ length: n('replicas') }, (_, i) => (
          <motion.div key={i} animate={{ opacity: active === 2 && i === 0 ? 0.15 : 1 }}>
            <b>Pod {i + 1}</b>
            <span>
              {active === 2 && i === 0 ? '제거됨' : active > 2 && i === 0 ? '대체 Pod' : 'Running'}
            </span>
          </motion.div>
        ))}
      </div>
    );
  return (
    <ol className={styles.steps}>
      {r.steps.map((s, i) => (
        <motion.li
          key={`${i}-${s}`}
          initial={false}
          animate={{ opacity: i <= active ? 1 : 0.35, x: !reduced && i === active ? 4 : 0 }}
          data-active={i === active}
        >
          <span>{i + 1}</span>
          {s}
        </motion.li>
      ))}
    </ol>
  );
}
