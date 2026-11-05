import type { Edge } from '@xyflow/react';
import type { Answer, LabState, Lesson, GoalResult } from '../curriculum/types';
import { validInputs } from '../activities/simulation';
import { resolveScenario, wire } from './scenarios';
import type { Port, Run, Scenario, Stage, TraceStage, Wire } from './types';
export function workflowEdge(e: Wire): Edge {
  return {
    ...e,
    id: `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`,
    type: 'smoothstep',
  };
}
export function createWorkflowLab(lesson: Lesson): LabState {
  const spec = resolveScenario(
    lesson.id,
    Object.fromEntries(lesson.fields.map((f) => [f.id, f.initial])),
  );
  return {
    nodes: spec.nodes.map((n) => ({
      id: n.id,
      type: 'resource',
      position:
        spec.week === 8
          ? {
              x: [0, 300, 600, 900, 900, 600, 300][spec.nodes.indexOf(n)],
              y: spec.nodes.indexOf(n) < 4 ? 0 : 260,
            }
          : { x: n.x, y: n.y },
      data: { title: n.title, detail: n.purpose, tone: '#8b78e8' },
    })),
    edges: spec.starter.map(workflowEdge),
    activeNodes: spec.nodes.map((n) => n.id),
    answers: Object.fromEntries(lesson.fields.map((f) => [f.id, f.initial])),
    completed: false,
    attempts: 0,
  };
}
export function workflowSignature(lab: LabState): string {
  return JSON.stringify({
    nodes: [...(lab.activeNodes ?? [])].sort(),
    edges: lab.edges
      .map((e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`)
      .sort(),
    answers: Object.fromEntries(
      Object.entries(lab.answers)
        .filter(([k]) => !k.startsWith('_'))
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  });
}
export interface Issue {
  node: string;
  message: string;
  edge?: string;
}
export function workflowIssues(spec: Scenario, lab: LabState): Issue[] {
  const issues: Issue[] = [];
  const active = new Set(lab.activeNodes);
  const seen = new Set<string>();
  for (const n of spec.nodes) {
    if (!active.has(n.id)) {
      issues.push({ node: n.id, message: `${n.title} 노드가 빠져 있습니다.` });
      continue;
    }
    for (const port of n.inputs.filter((p) => p.required)) {
      const edges = lab.edges.filter(
        (e) => e.target === n.id && e.targetHandle === port.id && active.has(e.source),
      );
      if (edges.length === 0)
        issues.push({ node: n.id, message: `${n.title}에 '${port.label}' 입력이 없습니다.` });
      if (edges.length > 1)
        issues.push({
          node: n.id,
          message: `'${port.label}' 입력에는 하나의 생산자만 연결하세요.`,
        });
    }
  }
  for (const e of lab.edges) {
    const source = spec.nodes.find((n) => n.id === e.source),
      target = spec.nodes.find((n) => n.id === e.target);
    const from = source?.outputs.find((p) => p.id === e.sourceHandle),
      to = target?.inputs.find((p) => p.id === e.targetHandle);
    const key = `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`;
    if (seen.has(key))
      issues.push({ node: e.target, edge: e.id, message: '같은 포트 연결이 중복되어 있습니다.' });
    seen.add(key);
    if (!from || !to || !active.has(e.source) || !active.has(e.target)) {
      issues.push({
        node: e.target,
        edge: e.id,
        message: '존재하는 노드의 출력 포트와 입력 포트를 연결하세요.',
      });
      continue;
    }
    if (from.material !== to.material)
      issues.push({
        node: e.target,
        edge: e.id,
        message: `${source!.title}의 ${from.label}(${from.material})는 ${target!.title}의 ${to.label}(${to.material}) 입력과 자료 종류가 다릅니다.`,
      });
    else if (
      !spec.wires.some(
        (w) =>
          w.source === e.source &&
          w.sourceHandle === e.sourceHandle &&
          w.target === e.target &&
          w.targetHandle === e.targetHandle,
      )
    )
      issues.push({
        node: e.target,
        edge: e.id,
        message: `자료 종류는 같지만 이 과제의 '${to.label}' 생산자가 다릅니다. 학습용·평가용이나 기존·신규 경로를 구분하세요.`,
      });
  }
  return issues;
}
const value = (a: Record<string, Answer>, key: string) => Number(a[key]);
function metrics(spec: Scenario, a: Record<string, Answer>): Run['metrics'] {
  if (spec.week === 1) {
    const mem = a.strategy === 'data' ? value(a, 'model') : value(a, 'model') / 2,
      communication = value(a, 'communication') * (a.strategy === 'tensor' ? 2 : 1);
    return [
      { label: 'GPU 한 장의 모델 상태', value: `${mem} / ${a.vram} GiB` },
      {
        label: '연산 / 통신 상대 시간',
        value: `${a.strategy === 'model' ? 64 : 32} / ${communication}`,
      },
      {
        label: '분할 방식',
        value:
          a.strategy === 'data'
            ? '데이터 분할 · 모델 복제'
            : a.strategy === 'model'
              ? '레이어 분할 · 중간 활성값'
              : '행렬 분할 · 부분 결과 결합',
      },
    ];
  }
  if (spec.week === 2)
    return [
      { label: '빌드 / 배포 이미지', value: `${a.image} / ${a.deployment}` },
      {
        label: '장애 후 준비 복제본',
        value: a.image !== a.deployment ? '0 / 2' : a.healing === 'on' ? '2 / 2' : '1 / 2',
      },
    ];
  if (spec.week === 3) {
    const supply = 30 * (a.cache === 'on' ? 2 : 1) * (a.shard === 'on' ? 2 : 1);
    return [
      { label: '공급 / GPU 소비', value: `${supply} / 100 배치/초` },
      { label: 'GPU 데이터 대기', value: `${Math.max(0, 100 - supply)}%` },
      { label: 'Pod 교체 후 캐시', value: a.persistent === 'volume' ? '보존' : '손실' },
    ];
  }
  if (spec.week === 4)
    return [
      { label: 'Git 코드·포인터', value: String(a.version) },
      {
        label: '작업 데이터',
        value:
          a.operation === 'git'
            ? 'v2'
            : a.operation === 'checkout' && a.local === 'missing' && a.version === 'v1'
              ? '복원 불가'
              : String(a.version),
      },
      { label: 'Git / DVC 저장', value: '메타데이터 / 실제 파일' },
    ];
  if (spec.id === 'feature-workflow')
    return [
      { label: '학습 / 온라인 집계', value: `1시간 / ${a.window === 'hour' ? '1시간' : '24시간'}` },
    ];
  if (spec.id === 'rag-workflow')
    return [
      { label: '임베딩 공간', value: a.embedding === 'same' ? '일치' : '불일치' },
      { label: '검색 근거', value: a.retrieval === 'relevant' ? '반품 정책' : '날씨 문서' },
    ];
  if (spec.week === 5)
    return [
      { label: '학습 / 온라인 집계', value: `1시간 / ${a.window === 'hour' ? '1시간' : '24시간'}` },
      { label: '임베딩 공간', value: a.embedding === 'same' ? '일치' : '불일치' },
      { label: '질문', value: '상품 반품 가능 여부' },
    ];
  if (spec.week === 6) {
    const t = value(a, 'traffic'),
      actual =
        a.strategy === 'canary'
          ? t
          : a.strategy === 'bluegreen' && a.phase === 'switch'
            ? 100
            : a.strategy === 'recreate'
              ? 80
              : 0,
      failed =
        a.strategy === 'recreate'
          ? 20 + (a.ready === 'no' ? 80 : 0)
          : a.ready === 'no'
            ? actual
            : 0;
    return [
      { label: '신규 사용자 응답', value: `${a.ready === 'yes' ? actual : 0} / 100` },
      { label: '사용자 실패', value: `${failed} / 100` },
      { label: 'Shadow 복제', value: `${a.strategy === 'shadow' ? t : 0}건 · 사용자 응답과 별도` },
    ];
  }
  if (spec.week === 7)
    return [
      { label: '시스템 오류율', value: '0% · HTTP 정상' },
      {
        label: '품질 판단',
        value:
          a.labels === 'available'
            ? '정답 표본으로 정확도 0.72 확인'
            : '정답 미확인 · 품질 확정 불가',
      },
      { label: '후보 / 평가 기준', value: `${a.quality} / 0.85` },
    ];
  return [
    { label: '데이터 분할', value: '학습 80개 / 평가 20개' },
    { label: '정확도 / 통과 기준', value: `0.85 / ${a.threshold}` },
  ];
}
interface NodeResult {
  error?: string;
  fix?: string;
  content: Record<string, string>;
  reason?: string;
}
function execute(spec: Scenario, n: Stage, a: Record<string, Answer>): NodeResult {
  const content: Record<string, string> = {};
  const result: NodeResult = { content };
  for (const p of n.outputs) content[p.id] = `${n.title}에서 만든 ${p.label}`;
  const fail = (error: string, fix: string) => ({ ...result, error, fix });
  if (spec.week === 1) {
    const strategy = a.strategy,
      mem = strategy === 'data' ? value(a, 'model') : value(a, 'model') / 2;
    if (n.id === 'data') content.batch = 'train-v1: 표본 0~63, 총 64개';
    if (n.id === 'model') content.weights = `모델 학습 상태 ${a.model}GiB (설명용 예시)`;
    if (n.id === 'split') {
      content.a =
        strategy === 'data'
          ? `표본 0~31 + 전체 모델 ${mem}GiB`
          : strategy === 'model'
            ? `앞 레이어 그룹 + 학습 상태 ${mem}GiB`
            : `행렬의 왼쪽 조각 + 학습 상태 ${mem}GiB`;
      content.b =
        strategy === 'data'
          ? `표본 32~63 + 전체 모델 ${mem}GiB`
          : `행렬의 오른쪽 조각 + 학습 상태 ${mem}GiB`;
    }
    if (n.id.startsWith('gpu')) {
      if (mem > value(a, 'vram'))
        return fail(
          `OOM: 한 장에 ${mem}GiB가 필요하지만 ${a.vram}GiB뿐입니다. 데이터 분할로 모델 복제본은 작아지지 않았습니다.`,
          '모델 크기를 GPU 용량 안으로 맞추거나 모델·텐서 병렬을 선택하고 연결을 바꾸세요.',
        );
      content.result =
        strategy === 'data'
          ? n.id === 'gpu1'
            ? '기울기 [0.12, 0.08]'
            : '기울기 [0.10, 0.14]'
          : strategy === 'model'
            ? n.id === 'gpu1'
              ? '앞 레이어의 중간 활성값 [4×8]'
              : '전체 레이어의 계산 결과 [4×2]'
            : n.id === 'gpu1'
              ? '행렬 부분 결과 0.4'
              : '행렬 부분 결과 0.6';
    }
    if (n.id === 'merge') {
      content.trained =
        strategy === 'data'
          ? '평균 기울기 [0.11, 0.11]로 같은 모델 갱신'
          : strategy === 'model'
            ? '레이어 간 결과 전달을 마친 학습 상태'
            : '부분 결과 0.4 + 0.6 = 1.0 결합';
      result.reason = `통신 비용 ${a.communication} 단위를 추가합니다. GPU 증가가 통신 비용을 없애지는 않습니다.`;
    }
    if (n.id === 'save') content.saved = 'checkpoint-v1: 완료한 모델·학습 상태';
  }
  if (spec.week === 2) {
    if (n.id === 'image') content.image = `blockml:${a.image} · 코드·의존성 포함, 게스트 커널 아님`;
    if (n.id === 'controller')
      content.desired = `이미지 ${a.deployment}, 원하는 복제본 2개, 복구 ${a.healing === 'on' ? '사용' : '미사용'}`;
    if (n.id === 'service') {
      content.a = '실제 요청 #1~#5';
      content.b = '실제 요청 #6~#10';
    }
    if (n.id === 'pod1' || n.id === 'pod2') {
      if (a.image !== a.deployment)
        return fail(
          `빌드 이미지 ${a.image}와 Deployment 지정 ${a.deployment}가 달라 준비할 수 없습니다.`,
          '빌드와 배포 태그를 맞추세요.',
        );
      if (n.id === 'pod1' && a.healing !== 'on')
        return fail(
          'Pod 1 장애 후 대체 복제본이 생성되지 않아 요청 5건을 처리하지 못했습니다.',
          'Deployment의 원하는 상태 복구를 사용하세요.',
        );
      content.response =
        n.id === 'pod1' ? '대체 Pod가 같은 이미지로 요청 #1~#5 처리' : 'Pod 2가 요청 #6~#10 처리';
    }
    if (n.id === 'response') content.result = '10 / 10건 응답 · 환경 일치·복제본 복구 확인';
  }
  if (spec.week === 3) {
    if (n.id === 'objects') content.objects = 'train-v1: 작은 이미지 객체 1,000개';
    if (n.id === 'pv') content.volume = 'Pod 외부 볼륨 · cache.bin 저장 가능';
    if (n.id === 'pvc') content.mount = '조건에 맞게 결합된 PVC → PV';
    if (n.id === 'loader') {
      content.batch = `배치 0: 128개 표본 · 공급 ${30 * (a.cache === 'on' ? 2 : 1) * (a.shard === 'on' ? 2 : 1)}배치/초`;
      if (a.persistent !== 'volume')
        return fail(
          'Pod 교체로 임시 cache.bin이 손실되어 다시 읽어야 합니다.',
          'PVC로 연결한 볼륨을 캐시 경로로 사용하세요.',
        );
    }
    if (n.id === 'gpu') {
      const supply = 30 * (a.cache === 'on' ? 2 : 1) * (a.shard === 'on' ? 2 : 1);
      if (supply < 80)
        return fail(
          `학습은 가능하지만 공급 ${supply}/소비 100으로 데이터 대기 ${100 - supply}%입니다. 이 미션의 활용 목표 80%에 미달합니다.`,
          '반복 읽기 캐시·작은 파일 묶음 읽기로 공급 경로를 개선하세요.',
        );
      content.model = 'model-v1: 공급 목표 충족 후 학습 완료';
    }
    if (n.id === 'artifact') content.saved = 'models/model-v1.bin · 객체 키로 보관';
  }
  if (spec.week === 4) {
    if (n.id === 'git')
      content.meta = `commit-${a.version}: code.py + dataset.dvc(${a.version} 해시)`;
    if (n.id === 'remote') content.blob = '데이터 v1(10GB), v2(12GB) · 실물 파일 보관';
    if (n.id === 'cache') {
      if (a.operation === 'checkout' && a.local === 'missing' && a.version === 'v1')
        return fail(
          'v1 데이터가 로컬 캐시에 없어 checkout만으로 복원할 수 없습니다.',
          'dvc pull로 필요한 데이터를 원격에서 가져오세요.',
        );
      content.data =
        a.operation === 'pull'
          ? `원격에서 ${a.version} 파일을 캐시로 가져옴`
          : a.local === 'present'
            ? '로컬 캐시 v1·v2 사용 가능'
            : '로컬 캐시에는 v2만 있음';
    }
    if (n.id === 'workspace')
      content.snapshot = `코드 ${a.version} + 실제 데이터 ${a.operation === 'git' ? 'v2' : a.version}`;
    if (n.id === 'reproduce') {
      if (a.operation === 'git' && a.version === 'v1')
        return fail(
          'Git 코드는 v1인데 실제 데이터는 v2입니다. 파일 내용이 과거로 돌아오지 않았습니다.',
          '포인터에 맞는 실제 데이터까지 복원하세요.',
        );
      content.model = `${a.version} 코드·데이터로 재현한 모델 (환경·난수는 고정 가정)`;
    }
  }
  if (spec.week === 5) {
    if (n.id === 'source') {
      content.events = '사용자 u1: 최근 1시간 12회 / 24시간 84회 클릭';
      content.docs = '반품 정책: 수령 7일 이내 미사용 상품 반품 가능';
    }
    if (n.id === 'definition') content.definition = 'feature clicks_1h · 최근 1시간 · 정의 v1';
    if (n.id === 'offline') content.feature = '학습 정의 v1: 최근 1시간 클릭, 값 12';
    if (n.id === 'online')
      content.feature = `온라인 조회: ${a.window === 'hour' ? '1시간·12회' : '24시간·84회'}`;
    if (n.id === 'query') content.query = '질문: 구매한 상품을 반품할 수 있나요? → 질문 벡터';
    if (n.id === 'index') content.vectors = '상품 문서 → 고정 임베딩 모델 A 공간 (설명용)';
    if (n.id === 'search') {
      if (a.embedding !== 'same')
        return fail(
          '질문이 모델 B 공간이고 저장 문서는 모델 A 공간입니다. 유사도를 의미 있게 비교할 수 없습니다.',
          '저장 문서와 질문에 같은 임베딩 공간을 사용하세요.',
        );
      content.evidence =
        a.retrieval === 'relevant'
          ? 'doc-return: 수령 7일 이내 미사용 상품 반품 가능'
          : 'doc-weather: 내일 비가 올 예정';
    }
    if (n.id === 'context') {
      if (spec.id !== 'rag-workflow' && a.window !== 'hour')
        return fail(
          '학습 피처 1시간과 온라인 피처 24시간의 정의가 달라 상담 문맥이 일관되지 않습니다.',
          '온라인 집계 정의를 학습과 맞추세요.',
        );
      if (spec.id !== 'feature-workflow' && a.retrieval !== 'relevant')
        return fail(
          '반품 질문에 날씨 문서가 검색되어 답변의 근거가 되지 못합니다.',
          '관련 있는 반품 정책 문서를 전달하세요.',
        );
      content.context =
        spec.id === 'feature-workflow'
          ? '학습·온라인 피처 정의 v1 일치: 최근 1시간 클릭'
          : '관련 근거 doc-return: 반품 7일 이내';
    }
    if (n.id === 'answer')
      content.answer =
        spec.id === 'feature-workflow'
          ? '학습·추론 피처 의미 일치 확인 · 실제 모델 실행 없음'
          : '고정 응답 예시: 미사용 상품은 수령 후 7일 이내 반품 가능 [doc-return]. 실제 LLM 호출 없음.';
  }
  if (spec.week === 6) {
    const strategy = a.strategy,
      t = value(a, 'traffic'),
      actual =
        strategy === 'canary'
          ? t
          : strategy === 'bluegreen' && a.phase === 'switch'
            ? 100
            : strategy === 'recreate'
              ? 80
              : 0;
    const old = strategy === 'recreate' ? 0 : 100 - actual,
      shadow = strategy === 'shadow' ? t : 0;
    if (n.id === 'requests') content.request = '요청 #1~#100 · 실제 사용자 요청';
    if (n.id === 'router') {
      content.old = `사용자 응답이 필요한 기존 요청 ${old}건`;
      content.new = `신규 실제 요청 ${actual}건 / 비교 전용 복제 ${shadow}건`;
    }
    if (n.id === 'old') {
      content.actual = `기존 모델 응답 ${old}건 → 사용자`;
      content.log = `기존 응답 ${old}건, 기준 지연 100ms`;
    }
    if (n.id === 'new') {
      if (a.ready !== 'yes' && actual > 0)
        return fail(
          `준비되지 않은 신규 모델로 실제 요청 ${actual}건이 향했습니다.`,
          '준비 확인 후 전환하거나 기존 경로로 롤백하세요.',
        );
      content.actual = `신규 사용자 응답 ${a.ready === 'yes' ? actual : 0}건 · Shadow 응답은 포함하지 않음`;
      content.log =
        strategy === 'shadow'
          ? `${shadow}건 복제 비교 · 사용자에게 반환하지 않음${a.ready !== 'yes' ? ' · 신규 실행 준비 실패' : ''}`
          : `신규 실제 응답 ${actual}건의 지연·품질 관측`;
    }
    if (n.id === 'response') {
      if (strategy === 'recreate')
        return fail(
          '중단 배포의 준비 공백에서 요청 20건이 실패했습니다.',
          '기존 경로를 유지하며 준비·전환하는 전략과 비교하세요.',
        );
      content.response = `사용자 총 100건: 기존 ${old}건 + 신규 ${actual}건, 실패 0건`;
    }
    if (n.id === 'observe') {
      if (a.ready !== 'yes')
        return fail(
          '사용자 응답은 기존 경로로 유지될 수 있지만 신규 모델의 비교·전환 준비가 끝나지 않았습니다.',
          '신규 모델 준비 상태를 확인하세요.',
        );
      content.decision =
        strategy === 'shadow'
          ? `신규 사용자 응답 0건 · 복제 ${shadow}건 결과를 비교한 뒤 승격 별도 결정`
          : strategy === 'canary'
            ? `실제 사용자 ${actual}%의 영향 관측 후 확대·롤백 판단`
            : a.phase === 'rollback'
              ? '기존 버전으로 롤백 완료'
              : '준비 상태·응답 지표를 확인하고 전환';
    }
  }
  if (spec.week === 7) {
    if (n.id === 'service') content.metrics = 'HTTP 200, 오류율 0%, 예측 로그 100건';
    if (n.id === 'truth') {
      if (a.labels !== 'available')
        return fail(
          '검증한 정답 표본이 없어 정확도 저하를 확정할 수 없습니다.',
          '정답·피드백 표본을 확보한 뒤 품질을 계측하세요.',
        );
      content.labels = '검증 정답 100개 · 현재 모델 정답 72개';
    }
    if (n.id === 'prom') content.alert = '오류율 0% / 계측 정확도 0.72 · 품질 경고';
    if (n.id === 'review') {
      if (a.decision !== 'investigate')
        return fail(
          '원인 조사 없이 갱신하려 하여 개선 근거가 없습니다.',
          '입력·정답·모델 변화를 조사하고 개선 계획을 세우세요.',
        );
      content.plan = '입력·정답 관계 변화 확인 → 데이터 갱신·후보 모델 평가 계획';
    }
    if (n.id === 'candidate') content.model = `candidate-v2 · 검증 정확도 ${a.quality}`;
    if (n.id === 'evaluate') {
      if (value(a, 'quality') < 0.85)
        return fail(
          `후보 정확도 ${a.quality}가 기준 0.85에 미달합니다.`,
          '후보를 개선하고 재평가하세요. 기준 미달 모델을 배포하지 않습니다.',
        );
      content.approved = `candidate-v2 평가 승인 · ${a.quality} ≥ 0.85`;
    }
    if (n.id === 'release') content.feedback = '평가 승인 모델을 안전하게 반영 → 계속 관측';
  }
  if (spec.week === 8) {
    if (n.id === 'data') content.raw = 'dataset-v1: 표본 0~99';
    if (n.id === 'prep') {
      content.train = '표본 0~79 · 학습용 80개';
      content.test = '표본 80~99 · 평가용 20개 (학습에 사용하지 않음)';
    }
    if (n.id === 'train') content.model = 'model-v1: 학습용 80개로 만든 가중치';
    if (n.id === 'eval') {
      if (value(a, 'threshold') > 0.85)
        return fail(
          `평가용 20개에서 예시 정확도 0.85 < 기준 ${a.threshold}. 승인 모델을 내보내지 않습니다.`,
          '원인을 확인하고 학습을 개선하거나 예시 비교를 위해 기준 0.80으로 변경하세요.',
        );
      content.approved = `model-v1 평가 승인 · 정확도 0.85 ≥ ${a.threshold}`;
    }
    if (n.id === 'registry') content.model = 'registry/model-v1 · 평가 승인·데이터 버전 연결';
    if (n.id === 'serve') content.metrics = '예측 응답·지연·오류·품질 관측 지표';
    if (n.id === 'monitor')
      content.feedback = '관측 → 다음 데이터·모델 개선 판단 (현재 실행을 되돌리지 않음)';
  }
  return result;
}
export function runWorkflow(id: string, lab: LabState): Run {
  const spec = resolveScenario(id, lab.answers),
    signature = workflowSignature(lab),
    summary = metrics(spec, lab.answers);
  if (!validInputs({ fields: spec.fields }, lab.answers))
    return {
      signature,
      success: false,
      stages: [
        {
          node: spec.nodes[0].id,
          title: '설정 검사',
          status: 'failed',
          inputs: [],
          outputs: [],
          reason: '설정값의 허용 범위와 간격을 확인하세요.',
          fix: '각 필드의 범위 안에서 입력하세요.',
        },
      ],
      metrics: [],
      headline: '설정 범위 오류',
    };
  const issues = workflowIssues(spec, lab);
  const active = new Set(lab.activeNodes);
  const stages: TraceStage[] = [];
  const done = new Map<string, TraceStage>();
  const remaining = new Set(spec.nodes.map((n) => n.id));
  while (remaining.size) {
    const ready = spec.nodes.filter(
      (n) =>
        remaining.has(n.id) &&
        lab.edges.filter((e) => e.target === n.id).every((e) => !remaining.has(e.source)),
    );
    if (!ready.length) {
      for (const n of spec.nodes.filter((n) => remaining.has(n.id)))
        stages.push({
          node: n.id,
          title: n.title,
          status: 'blocked',
          inputs: [],
          outputs: [],
          reason: '순환 연결 때문에 입력을 먼저 계산할 수 없습니다.',
          fix: '방향을 확인해 실행 순환을 끊으세요.',
        });
      break;
    }
    for (const n of ready) {
      remaining.delete(n.id);
      const incoming = lab.edges
        .filter((e) => e.target === n.id)
        .sort((a, b) =>
          `${a.targetHandle}:${a.source}`.localeCompare(`${b.targetHandle}:${b.source}`),
        );
      const inputs = incoming.flatMap((e) => {
        const from = done.get(e.source),
          artifact = from?.outputs.find((o) => o.port === e.sourceHandle);
        return artifact
          ? [{ from: from!.title, name: artifact.name, content: artifact.content }]
          : [];
      });
      const ownIssues = issues.filter((i) => i.node === n.id);
      const failedParents = incoming
        .map((e) => done.get(e.source))
        .filter((p) => p && p.status !== 'success');
      let stage: TraceStage;
      if (!active.has(n.id) || ownIssues.length)
        stage = {
          node: n.id,
          title: n.title,
          status: 'failed',
          inputs,
          outputs: [],
          reason: ownIssues.map((i) => i.message).join(' '),
          fix: '연결의 자료 종류·방향·빠진 입력을 확인하세요.',
        };
      else if (failedParents.length)
        stage = {
          node: n.id,
          title: n.title,
          status: 'blocked',
          inputs,
          outputs: [],
          reason: `${failedParents.map((p) => p!.title).join(', ')} 단계가 자료를 만들지 못해 대기합니다.`,
          fix: '가장 먼저 실패한 단계부터 수정하세요.',
        };
      else {
        const executed = execute(spec, n, lab.answers);
        stage = {
          node: n.id,
          title: n.title,
          status: executed.error ? 'failed' : 'success',
          inputs,
          outputs: executed.error
            ? []
            : n.outputs.map((port) => ({
                port: port.id,
                material: port.material,
                name: port.label,
                content: executed.content[port.id],
              })),
          reason:
            executed.error ??
            executed.reason ??
            `${n.purpose} 입력을 확인하고 출력을 만들었습니다.`,
          fix: executed.fix,
        };
      }
      stages.push(stage);
      done.set(n.id, stage);
    }
  }
  const success =
    stages.length === spec.nodes.length && stages.every((s) => s.status === 'success');
  return {
    signature,
    success,
    stages,
    metrics: summary,
    headline: success
      ? '전체 흐름 완료 · 입력과 결과를 확인하세요.'
      : '실행이 막혔습니다 · 최초 실패와 후속 차단을 구분하세요.',
  };
}
export interface Evidence {
  signature: string;
  success: boolean;
  diagnostic: boolean;
  metrics: Run['metrics'];
}
export function workflowHistory(answers: Record<string, Answer>): Evidence[] {
  try {
    const data: unknown = JSON.parse(String(answers._workflowHistory ?? '[]'));
    return Array.isArray(data)
      ? data
          .filter(
            (v): v is Evidence =>
              !!v &&
              typeof v === 'object' &&
              typeof v.signature === 'string' &&
              typeof v.success === 'boolean' &&
              typeof v.diagnostic === 'boolean' &&
              Array.isArray(v.metrics),
          )
          .slice(-8)
      : [];
  } catch {
    return [];
  }
}
export function workflowGoals(lesson: Lesson, lab: LabState): GoalResult[] {
  const history = workflowHistory(lab.answers),
    spec = resolveScenario(lesson.id, lab.answers),
    sig = workflowSignature(lab),
    current = history.find((h) => h.signature === sig && h.success);
  return [
    {
      id: 'ports',
      label: '필요한 자료를 올바른 입력 포트에 연결',
      passed: workflowIssues(spec, lab).length === 0,
      hint: '각 포트의 자료 종류와 생산자를 확인하세요.',
    },
    {
      id: 'trace',
      label: '현재 구성의 실행을 끝까지 관찰',
      passed: !!current,
      hint: '전체 실행 또는 다음 단계로 마지막 단계까지 확인하세요.',
    },
    {
      id: 'compare',
      label: '조건 실패와 개선 성공의 결과 비교',
      passed:
        history.some((h) => h.diagnostic && !h.success) &&
        history.some((h) => h.success) &&
        new Set(history.map((h) => h.signature)).size >= 2,
      hint: '연결 오류 외에 OOM·버전 불일치·평가 미달 등 조건 실패를 한 번 관찰하고 개선하세요.',
    },
    {
      id: 'explain',
      label: '왜 달라졌는지 확인 문제에 답하기',
      passed: lab.answers._workflowQuiz === 'correct',
      hint: spec.explanation,
    },
  ];
}
export function connectionFor(spec: Scenario, target: string, input: string): Wire | undefined {
  return spec.wires.find((e) => e.target === target && e.targetHandle === input);
}
export function portName(
  spec: Scenario,
  node: string,
  port: string,
  direction: 'in' | 'out',
): Port | undefined {
  return (
    direction === 'in'
      ? spec.nodes.find((n) => n.id === node)?.inputs
      : spec.nodes.find((n) => n.id === node)?.outputs
  )?.find((p) => p.id === port);
}
export const emptyWire = () => wire('', '', '', '');
