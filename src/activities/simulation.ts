import type { GoalStrategy } from '../curriculum/goalStrategy';
import type { Answer, Lesson, LabState, GoalResult } from '../curriculum/types';
import type { ActivityResult, ActivitySpec } from './types';
export const activitySignature = (a: Record<string, Answer>) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(a)
        .filter(([key]) => !key.startsWith('_'))
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
export function validInputs(
  spec: Pick<ActivitySpec, 'fields'>,
  a: Record<string, Answer>,
): boolean {
  return spec.fields.every((f) =>
    f.options
      ? f.options.some((o) => o.value === a[f.id])
      : typeof a[f.id] === 'number' &&
        Number.isFinite(a[f.id]) &&
        Number(a[f.id]) >= (f.min ?? -Infinity) &&
        Number(a[f.id]) <= (f.max ?? Infinity) &&
        Math.abs(
          (Number(a[f.id]) - (f.min ?? 0)) / (f.step ?? 1) -
            Math.round((Number(a[f.id]) - (f.min ?? 0)) / (f.step ?? 1)),
        ) < 1e-6,
  );
}
export function observationHistory(a: Record<string, Answer>): string[] {
  try {
    const h: unknown = JSON.parse(String(a._history ?? '[]'));
    return Array.isArray(h) ? h.filter((v): v is string => typeof v === 'string').slice(-12) : [];
  } catch {
    return [];
  }
}
export const activityRules: GoalStrategy<'observe' | 'quiz'>[] = [
  {
    kind: 'observe',
    evaluate: (_, lab, lesson) =>
      validInputs(lesson.activity!, lab.answers) &&
      lab.answers._observed === activitySignature(lab.answers) &&
      (lesson.fields.length === 0 || new Set(observationHistory(lab.answers)).size >= 2),
  },
  { kind: 'quiz', evaluate: (_, lab, lesson) => lab.answers._quiz === lesson.activity!.correct },
];
export function activityGoals(lesson: Lesson, lab: LabState): GoalResult[] {
  const definitions = [
    {
      kind: 'observe' as const,
      id: 'activity-observe',
      label: lesson.fields.length ? '두 가지 설정을 실행하고 비교' : '활동을 실행하고 결과 관찰',
      hint: '본문 활동에서 설정을 바꿔 재생하거나 결과 계산을 누르세요.',
    },
    {
      kind: 'quiz' as const,
      id: 'activity-quiz',
      label: '확인 문제에 답하기',
      hint: lesson.activity!.explanation,
    },
  ];
  return definitions.map((g) => ({
    id: g.id,
    label: g.label,
    hint: g.hint,
    passed: activityRules.find((r) => r.kind === g.kind)?.evaluate(g.kind, lab, lesson) ?? false,
  }));
}
const metric = (label: string, value: string, amount?: number) => ({ label, value, amount });
const round = (v: number) => Math.round(v * 100) / 100;
export function simulate(spec: ActivitySpec, a: Record<string, Answer>): ActivityResult {
  if (!validInputs(spec, a))
    return {
      headline: '설정 범위를 확인하세요.',
      detail: '허용된 범위와 간격의 값으로 다시 실행하세요.',
      metrics: [],
      steps: [],
      warning: '잘못된 설정',
    };
  const n = (key: string, fallback = 0) => Number(a[key] ?? fallback);
  let headline = '',
    detail = spec.explanation,
    metrics: ActivityResult['metrics'] = [],
    steps: string[] = [],
    warning: string | undefined;
  switch (spec.kind) {
    case 'compute': {
      const cpu = n('jobs'),
        gpu = n('setup') + Math.ceil(cpu / n('width'));
      headline =
        cpu > gpu
          ? '많은 연산을 병렬로 나눠 GPU 처리량이 유리합니다.'
          : '준비 비용 때문에 작은 작업에서는 GPU 이득이 작습니다.';
      metrics = [
        metric('CPU 상대 시간', String(cpu), cpu),
        metric('GPU 상대 시간', String(gpu), gpu),
      ];
      steps = [
        '입력 준비',
        'GPU 준비·전송 비용',
        ...Array.from(
          { length: Math.min(8, Math.ceil(cpu / n('width'))) },
          (_, i) => `GPU 병렬 묶음 ${i + 1}`,
        ),
        '완료',
      ];
      break;
    }
    case 'memory': {
      const fixed = 3,
        activation = n('batch') * (a.precision === 'amp' ? 0.1 : 0.2),
        total = fixed + activation;
      headline =
        total > n('vram')
          ? 'OOM · 요청한 메모리가 예산을 초과합니다.'
          : '현재 예시 배치가 VRAM 안에 들어갑니다.';
      metrics = [
        metric('고정 학습 상태', `${fixed} GiB`, fixed),
        metric('활성값', `${round(activation)} GiB`, activation),
        metric('VRAM 사용 / 용량', `${round(total)} / ${n('vram')} GiB`, total),
        metric('유효 배치', String(n('batch') * n('accumulation'))),
      ];
      steps = [
        '가중치·학습 상태 적재',
        '활성값 메모리 할당',
        total > n('vram') ? '할당 실패 · OOM' : '순전파·역전파',
        '기울기 누적 후 갱신',
      ];
      if (total > n('vram')) warning = '배치를 줄이거나 정밀도·메모리 예산을 검토하세요.';
      break;
    }
    case 'parallel': {
      const g = n('gpus'),
        comm = n('communication'),
        model = n('model'),
        data = spec.variant === 'data',
        tensor = spec.variant === 'tensor',
        memory = data ? model : model / g,
        compute = data || tensor ? n('work') / g : n('work'),
        transfer = data ? comm * Math.log2(g) : tensor ? comm * 2 * (g - 1) : comm * (g - 1),
        time = compute + transfer;
      headline =
        memory > n('vram')
          ? 'GPU당 모델 메모리가 부족합니다.'
          : `${data ? '데이터' : tensor ? '텐서' : '레이어'} 분할과 통신을 함께 관찰하세요.`;
      metrics = [
        metric('GPU당 모델 메모리', `${round(memory)} GiB`, memory),
        metric('연산 상대 시간', String(round(compute)), compute),
        metric('통신 상대 시간', String(round(transfer)), transfer),
        metric('총 상대 시간', String(round(time)), time),
      ];
      steps = data
        ? ['모델 복제', '데이터 분할', 'GPU별 순전파·역전파', '기울기 동기화', '같은 상태로 갱신']
        : tensor
          ? [
              '행렬을 장치별로 분할',
              '같은 레이어의 부분 연산',
              '부분 결과 통신·결합',
              '다음 레이어',
            ]
          : ['앞 레이어 실행', '중간 활성값 전송', '뒤 레이어 실행', '역전파 결과 전달'];
      if (memory > n('vram'))
        warning = '일반 데이터 병렬은 각 장치의 모델 복제본 메모리를 줄이지 않습니다.';
      detail += ' 메모리는 모델 학습 상태만 분할한 단순 예시로 활성값 등 추가 공간은 별도입니다.';
      break;
    }
    case 'machine':
      headline =
        a.power === 'start'
          ? 'EC2에서 프로그램이 실행됩니다.'
          : '중지 상태 · 연산이 실행되지 않습니다.';
      steps = [
        'AMI로 환경 준비',
        '인스턴스 시작',
        '코드 실행',
        a.power === 'stop' ? '인스턴스 중지 · 실행 메모리 소실' : '결과 파일 기록',
      ];
      metrics = [
        metric('인스턴스', a.power === 'start' ? '실행 중' : '중지됨'),
        metric('저장소 역할', '결과 파일 보관은 별도'),
      ];
      break;
    case 'objects':
      headline = a.operation === 'put' ? '객체 키로 업로드합니다.' : '객체 키로 내용을 조회합니다.';
      steps =
        a.operation === 'put'
          ? ['작업 결과 파일', 'PUT 요청', '버킷 / 객체 키', '객체 보관']
          : ['버킷 / 객체 키', 'GET 요청', '데이터 로더', '연산에 사용'];
      metrics = [
        metric('예시 키', a.operation === 'put' ? 'models/model-v1.bin' : 'datasets/train.csv'),
        metric('접근 방식', '객체 단위'),
      ];
      break;
    case 'layers':
      steps = [
        'ML 프레임워크',
        'cuBLAS · cuDNN · NCCL',
        'CUDA Runtime',
        'CUDA Driver',
        'NVIDIA GPU',
      ];
      headline =
        steps[['framework', 'library', 'runtime', 'driver', 'hardware'].indexOf(String(a.layer))];
      metrics = [metric('선택한 계층', headline), metric('역할', '연산 요청과 하드웨어 실행 연결')];
      break;
    case 'container':
      steps = ['코드·의존성', '이미지 빌드', '공유 이미지', `${n('copies')}개 실행 컨테이너`];
      headline = '이미지 하나를 여러 실행 인스턴스가 재사용합니다.';
      metrics = [metric('이미지', '1개'), metric('컨테이너', `${n('copies')}개`)];
      break;
    case 'commands': {
      const cmd = String(a._command ?? 'build'),
        image = a._image === true,
        status = String(a._container ?? '없음');
      headline = String(a._commandMessage ?? '명령을 선택해 상태를 바꾸세요.');
      steps = [
        'Dockerfile',
        image ? '이미지 있음' : '아직 이미지 없음',
        `컨테이너 ${status}`,
        `최근 명령: docker ${cmd}`,
      ];
      metrics = [
        metric('이미지 목록', image ? 'blockml:demo' : '비어 있음'),
        metric('컨테이너 상태', status),
        metric('명령', `docker ${cmd}`),
      ];
      break;
    }
    case 'virtual':
      headline = 'VM은 게스트 OS를, 컨테이너는 호스트 커널을 공유합니다.';
      steps = [
        '하드웨어',
        'VM: 하이퍼바이저',
        `VM: 게스트 OS ${n('copies')}개`,
        `컨테이너: 공유 커널 1개`,
        `앱 ${n('copies')}개`,
      ];
      metrics = [
        metric('VM 게스트 OS', `${n('copies')}개`),
        metric('컨테이너 호스트 커널', '1개 공유'),
      ];
      break;
    case 'replicas':
      headline = '원하는 수와 실제 수를 비교해 복구합니다.';
      steps = [
        `선언: ${n('replicas')}개`,
        `실행: ${n('replicas')}개`,
        `한 Pod 소실: ${n('replicas') - 1}개`,
        '컨트롤러가 차이 감지',
        `대체 Pod 생성: ${n('replicas')}개`,
      ];
      metrics = [
        metric('원하는 복제본', String(n('replicas'))),
        metric('장애 직후', String(n('replicas') - 1)),
        metric('복구 후', String(n('replicas'))),
      ];
      break;
    case 'storage': {
      metrics = [
        ['Block', 1, 500],
        ['File', 3, 300],
        ['Object', 20, 800],
      ].map(([label, latency, throughput]) => {
        const t = n('requests') * (Number(latency) / 1000 + n('size') / Number(throughput));
        return metric(`${label} 예시 시간`, `${round(t)}초`, t);
      });
      headline = '요청당 지연과 전송 처리량이 함께 영향을 줍니다.';
      steps = [
        'Block: 블록 주소로 읽기',
        'File: 경로·파일로 읽기',
        'Object: 키로 GET',
        '클라이언트가 데이터 수신',
      ];
      detail +=
        ' 가정: Block 1ms·500MiB/s, File 3ms·300MiB/s, Object 20ms·800MiB/s. 요청은 순차 처리합니다.';
      break;
    }
    case 'io': {
      const supply = n('supply') * (a.cache === 'on' ? 2 : 1),
        used = (Math.min(supply, n('demand')) / n('demand')) * 100;
      headline =
        used < 100
          ? 'GPU가 다음 배치를 기다립니다.'
          : '예시 조건에서 데이터 공급이 소비를 따라갑니다.';
      metrics = [
        metric('유효 공급', `${supply} 배치/초`, supply),
        metric('GPU 활용 비율', `${round(used)}%`, used),
        metric('데이터 대기', `${round(100 - used)}%`, 100 - used),
      ];
      steps = [
        '스토리지 읽기',
        'CPU 전처리·캐시',
        '배치 준비',
        used < 100 ? 'GPU 데이터 대기' : 'GPU 연산',
      ];
      break;
    }
    case 'volume':
      headline =
        a.persistent === 'pv'
          ? '새 Pod도 같은 볼륨에서 파일을 읽습니다.'
          : 'Pod를 교체하면 임시 파일이 사라집니다.';
      steps = [
        '파일 기록',
        '기존 Pod 제거',
        '새 Pod 생성',
        a.persistent === 'pv' ? 'PVC로 같은 PV 연결 · 파일 보존' : '새 임시 공간 · 파일 없음',
      ];
      metrics = [metric('교체 후 checkpoint.pt', a.persistent === 'pv' ? '있음' : '없음')];
      break;
    case 'git':
    case 'lfs': {
      const bytes = n('size') * n('versions');
      headline =
        spec.kind === 'git'
          ? '큰 파일의 변경 이력이 함께 커집니다.'
          : 'Git에는 포인터, 실물은 LFS 저장소에 있습니다.';
      metrics = [
        metric(
          'Git 이력 예시',
          spec.kind === 'git' ? `${bytes} MiB` : `${n('versions')} KiB 포인터`,
          spec.kind === 'git' ? bytes : n('versions') / 1024,
        ),
        metric('실제 데이터 총량', `${bytes} MiB`, bytes),
      ];
      steps =
        spec.kind === 'git'
          ? ['큰 파일 변경', '커밋 객체에 기록', '여러 버전 이력 유지', '복제·전송 부담']
          : ['큰 파일 추적', '작은 포인터 Git 커밋', '실제 파일 LFS 저장', '필요한 버전 가져오기'];
      break;
    }
    case 'dvc':
      headline =
        a.direction === 'push'
          ? '실제 데이터를 원격에 공유합니다.'
          : '필요한 데이터를 원격에서 가져옵니다.';
      steps =
        a.direction === 'push'
          ? ['Git: 코드·.dvc 포인터', 'DVC 로컬 캐시', 'dvc push', '데이터 원격 저장소']
          : ['Git: 원하는 포인터', '데이터 원격 저장소', 'dvc pull', '로컬 캐시·작업 공간'];
      metrics = [
        metric('Git이 추적하는 것', '코드·메타데이터'),
        metric('실제 파일', '캐시·데이터 원격 저장소'),
      ];
      break;
    case 'restore':
      headline =
        a.checkout === 'checkout'
          ? '작업 공간을 선택한 버전으로 복원했습니다.'
          : 'Git 포인터만 변경 · 작업 데이터는 v2입니다.';
      steps = [
        `Git: ${a.version} 선택`,
        'DVC 포인터 확인',
        a.checkout === 'checkout' ? '캐시에서 데이터 복원' : '복원 작업 미실행',
        `작업 공간: ${a.checkout === 'checkout' ? a.version : 'v2'}`,
      ];
      metrics = [
        metric('Git 포인터', String(a.version)),
        metric('실제 데이터', String(a.checkout === 'checkout' ? a.version : 'v2')),
      ];
      break;
    case 'features':
      headline =
        a.definition === 'hour'
          ? '학습·서빙의 집계 정의가 일치합니다.'
          : '집계 시간 창이 다릅니다 · Skew 위험';
      steps = [
        '공통 피처 정의',
        '오프라인: 최근 1시간',
        `온라인: ${a.definition === 'hour' ? '최근 1시간' : '최근 24시간'}`,
        '학습·서빙 비교',
      ];
      metrics = [
        metric('학습 집계', '1시간 · 12회'),
        metric('서빙 집계', a.definition === 'hour' ? '1시간 · 12회' : '24시간 · 84회'),
      ];
      break;
    case 'embedding':
    case 'search': {
      const fruit = a.query === 'fruit',
        exact = a.mode === 'exact';
      headline = exact
        ? '정확한 문구를 포함한 문서가 없습니다.'
        : `가장 가까운 예시: ${fruit ? '사과·바나나' : 'PyTorch·Docker'}`;
      steps = [
        '질문 선택',
        exact ? '문구 포함 검사' : '같은 공간의 예시 벡터',
        '검색 후보 비교',
        '관련성 판단',
      ];
      metrics = [
        metric('검색 결과', exact ? '0건' : fruit ? '사과, 바나나' : 'PyTorch, Docker'),
        metric('좌표', '교육용 고정 2차원'),
      ];
      break;
    }
    case 'rag':
      headline =
        a.evidence === 'relevant'
          ? '관련 자료를 근거로 응답 예시를 만듭니다.'
          : a.evidence === 'wrong'
            ? '근거가 질문과 무관합니다.'
            : '근거 없는 응답 예시입니다.';
      steps = [
        '질문: DVC 데이터는 어디에?',
        '문서 검색',
        a.evidence === 'relevant'
          ? '근거: 실제 파일은 캐시·원격에'
          : a.evidence === 'wrong'
            ? '근거: 사과는 과일이다'
            : '근거 전달 없음',
        '고정된 응답 예시',
      ];
      metrics = [
        metric(
          '응답 예시',
          a.evidence === 'relevant'
            ? 'Git은 포인터를, 캐시·원격은 데이터를 보관합니다.'
            : a.evidence === 'wrong'
              ? '관련 자료가 없어 답변 근거가 부족합니다.'
              : '모든 데이터가 Git 커밋 안에 저장됩니다. (틀린 예시)',
        ),
      ];
      break;
    case 'serving':
      headline =
        a.mode === 'batch'
          ? '모아서 처리하므로 첫 요청이 기다립니다.'
          : '각 요청을 도착 후 처리합니다.';
      steps =
        a.mode === 'batch'
          ? ['요청 도착', '요청 모으기', '일괄 예측', '결과 저장']
          : ['개별 요청', '모델 실행', '즉시 응답'];
      metrics = [
        metric('첫 요청 응답 시점', a.mode === 'batch' ? '일괄 실행 후 10초' : '1초'),
        metric('용도', a.mode === 'batch' ? '다음 날 추천 목록' : '즉시 결제 판단'),
      ];
      break;
    case 'release': {
      const v = spec.variant;
      const actual =
          v === 'bluegreen' ? (a.phase === 'switch' ? 100 : 0) : v === 'canary' ? n('traffic') : 0,
        failed = v === 'recreate' ? n('gap') : 0,
        shadow = v === 'shadow' ? n('traffic') : 0;
      headline =
        v === 'shadow'
          ? '복제 요청의 결과는 사용자에게 보내지 않습니다.'
          : v === 'recreate'
            ? '준비 공백의 요청은 실패합니다.'
            : v === 'canary'
              ? '일부 사용자가 신규 응답을 받습니다.'
              : '준비·전환·롤백에 따라 응답 모델이 바뀝니다.';
      metrics = [
        metric('신규 사용자 응답', `${actual} / 100`, actual),
        metric('기존 사용자 응답', `${100 - actual - failed} / 100`, 100 - actual - failed),
        metric('실패 요청', `${failed} / 100`, failed),
        metric('Shadow 복제', `${shadow} / 100`, shadow),
      ];
      steps =
        v === 'shadow'
          ? [
              '기존 모델이 사용자 응답',
              '요청을 신규 모델에 복제',
              '신규 결과 로그·비교',
              '승격은 별도 결정',
            ]
          : v === 'bluegreen'
            ? [
                'Blue 운영',
                'Green 준비 확인',
                a.phase === 'switch' ? 'Green으로 전환' : 'Blue 경로 유지',
                a.phase === 'rollback' ? 'Blue로 롤백' : '상태·품질 관측',
              ]
            : v === 'canary'
              ? ['기존 모델 운영', `${actual}% 새 모델 응답`, '지표 비교', '확대 또는 롤백']
              : ['기존 모델 중지', '새 모델 준비 · 공백', '새 모델 실행'];
      break;
    }
    case 'drift':
      headline =
        a.change === 'data'
          ? '입력 분포 변화가 관측되었습니다.'
          : '입력과 정답 관계가 바뀌었습니다.';
      metrics = [
        metric('입력 분포 차이', a.change === 'data' ? `${n('shift')}%` : '0%'),
        metric('예시 정확도', a.change === 'concept' ? `${90 - n('shift')}%` : '90% 유지'),
        metric('시스템 오류율', '0%'),
      ];
      steps = [
        '기준 구간',
        '현재 데이터 관측',
        a.change === 'data' ? '입력 분포 비교' : '정답 관계 비교',
        '품질·원인 조사',
      ];
      break;
    case 'metrics': {
      const sampled = metricSamples(n('interval'));
      const alerts = sampled.filter((p) => p.y > n('limit')).length;
      headline = alerts
        ? '수집한 지표가 경고 기준을 넘었습니다.'
        : '수집 시점의 지표는 경고 기준 이내입니다.';
      metrics = [
        metric('수집한 표본', `${sampled.length}개`),
        metric('기준 초과 표본', `${alerts}개`),
        metric('수집 간격', `${n('interval')}초`),
      ];
      steps = ['서비스가 지표 노출', '주기적 수집', '시계열 저장·질의', '기준 초과 판단'];
      break;
    }
    case 'improve':
      headline =
        a.decision === 'investigate'
          ? '조사와 평가를 거쳐 배포합니다.'
          : '평가 없는 배포는 품질 개선을 확인할 수 없습니다.';
      steps =
        a.decision === 'investigate'
          ? ['알림', '원인 조사', '데이터·모델 개선', '재평가', '안전한 배포', '계속 관측']
          : ['알림', '즉시 배포', '품질 검증 누락'];
      metrics = [
        metric('개선 판단', a.decision === 'investigate' ? '평가 결과 확인 후' : '근거 부족'),
      ];
      break;
    case 'pipeline': {
      const pass = 0.85 >= n('threshold');
      headline = pass
        ? '평가 통과 · 모델 등록과 서빙으로 진행합니다.'
        : '평가 미달 · 등록·서빙을 차단합니다.';
      metrics = [
        metric('예시 정확도', '0.85'),
        metric('통과 기준', String(n('threshold'))),
        metric('등록·서빙', pass ? '진행 가능' : '차단'),
      ];
      steps = [
        '데이터',
        '전처리',
        '학습',
        '평가',
        pass ? '등록' : '평가 실패',
        pass ? '서빙' : '등록 차단',
        pass ? '모니터링 → 개선' : '서빙 차단',
      ];
      if (!pass) warning = '원인을 확인하고 데이터·모델 개선 후 재평가하세요.';
      break;
    }
  }
  return { headline, detail, metrics, steps, warning };
}
export function metricSamples(interval: number) {
  return Array.from({ length: Math.floor(60 / interval) + 1 }, (_, i) => {
    const x = i * interval;
    return { x, y: x >= 22 && x <= 28 ? 280 : 100 + Math.round(Math.sin(x / 6) * 20) };
  });
}
export function dockerCommand(a: Record<string, Answer>, cmd: string): Record<string, Answer> {
  const next: Record<string, Answer> = { ...a, _command: cmd };
  const image = a._image === true;
  const status = String(a._container ?? '없음');
  let message = '';
  if (cmd === 'build') {
    next._image = true;
    message = 'blockml:demo 이미지 빌드 완료';
  }
  if (cmd === 'images')
    message = image ? '이미지 목록: blockml:demo' : '이미지 목록이 비어 있습니다.';
  if (cmd === 'run') {
    if (!image) message = '먼저 build로 이미지를 만드세요.';
    else if (status === '실행 중') message = '이미 실행 중인 컨테이너가 있습니다.';
    else {
      next._container = '실행 중';
      message = '컨테이너 시작';
    }
  }
  if (cmd === 'ps')
    message = status === '실행 중' ? '실행 중 컨테이너 1개' : '실행 중 컨테이너 없음';
  if (cmd === 'logs')
    message = status === '없음' ? '조회할 컨테이너가 없습니다.' : '로그: BlockML demo ready';
  if (cmd === 'stop') {
    if (status === '실행 중') {
      next._container = '중지됨';
      message = '컨테이너 중지 · 이미지는 유지';
    } else message = '실행 중인 컨테이너가 없습니다.';
  }
  if (cmd === 'rm') {
    if (status === '실행 중') message = '먼저 stop으로 중지하세요.';
    else {
      next._container = '없음';
      message = '컨테이너 제거 · 이미지는 유지';
    }
  }
  return { ...next, _commandMessage: message };
}
