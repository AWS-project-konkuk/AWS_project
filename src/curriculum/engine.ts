import type { Edge } from '@xyflow/react';
import type { ExperimentResult, GoalResult, LabState, Lesson } from './types';
import { goalRules, type GoalRule } from './goalRules';
import { activityGoals, simulate } from '../activities/simulation';
import { createWorkflowLab, workflowGoals, runWorkflow } from '../weekly/engine';

export function connectionId(from: string, to: string) {
  return `${from}->${to}`;
}
export function createConnection(from: string, to: string): Edge {
  return {
    id: connectionId(from, to),
    source: from,
    target: to,
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'smoothstep',
  };
}
export function createLab(lesson: Lesson): LabState {
  if (lesson.workflow) return createWorkflowLab(lesson);
  const columns = 2;
  return {
    nodes: lesson.nodes.map((node, index) => ({
      id: node.id,
      type: 'resource',
      position: {
        x: 30 + (lesson.nodes.length === 3 && index === 2 ? 1 : index % columns) * 245,
        y: 45 + Math.floor(index / columns) * 175,
      },
      data: { title: node.title, detail: node.detail, tone: node.tone ?? '#668874' },
    })),
    edges: lesson.initialEdges.map(([from, to]) => createConnection(from, to)),
    answers: Object.fromEntries(lesson.fields.map((field) => [field.id, field.initial])),
    completed: false,
    attempts: 0,
    resources: {},
  };
}

export function evaluateGoals(
  lesson: Lesson,
  lab: LabState,
  rules: GoalRule[] = goalRules,
): GoalResult[] {
  if (lesson.workflow) return workflowGoals(lesson, lab);
  if (lesson.assessment)
    return [
      {
        id: 'understanding',
        label: '상황에 맞는 판단과 이유 확인',
        hint: lesson.assessment.explanation,
        passed: lab.answers._understanding === lesson.assessment.correct,
      },
    ];
  if (lesson.activity) {
    const results = activityGoals(lesson, lab);
    if (lesson.id === 'pipeline-capstone')
      results.push({
        id: 'quality',
        label: '모델 평가 통과',
        hint: '예시 정확도 0.85와 통과 기준을 비교하세요.',
        passed: Number(lab.answers.threshold) <= 0.85,
      });
    if (lesson.practice !== 'required') return results;
    for (const goal of lesson.goals)
      results.push({
        id: goal.id,
        label: goal.label,
        hint: goal.hint,
        passed: rules.find((r) => r.kind === goal.kind)?.evaluate(goal, lab, lesson) ?? false,
      });
    for (const node of lesson.nodes)
      if (lab.activeNodes && !lab.activeNodes.includes(node.id))
        results.push({
          id: `missing-${node.id}`,
          label: `${node.title} 노드 추가`,
          hint: '노드 목록에서 추가하세요.',
          passed: false,
        });
    const expected = new Set((lesson.flow ?? []).map(([a, b]) => connectionId(a, b)));
    if (lab.edges.some((e) => !expected.has(connectionId(e.source, e.target))))
      results.push({
        id: 'unexpected',
        label: '과제와 다른 연결 정리',
        hint: '입출력 방향을 확인하고 불필요한 연결을 삭제하세요.',
        passed: false,
      });
    return results;
  }
  const hasEdge = (from: string, to: string) =>
    lab.edges.some((edge) => edge.source === from && edge.target === to);
  const results: GoalResult[] = lesson.goals.map((goal) => {
    const passed =
      rules.find((rule) => rule.kind === goal.kind)?.evaluate(goal, lab, lesson) ?? false;
    return { id: goal.id, label: goal.label, hint: goal.hint, passed };
  });
  if (lab.activeNodes)
    for (const node of lesson.nodes)
      if (!lab.activeNodes.includes(node.id))
        results.push({
          id: `missing-node-${node.id}`,
          label: `${node.title} 노드 추가`,
          hint: '노드 목록에서 추가 버튼을 누르세요.',
          passed: false,
        });
  for (const [from, to] of lesson.initialEdges) {
    if (!hasEdge(from, to))
      results.push({
        id: `base-${from}-${to}`,
        label: '기본 흐름의 연결 유지',
        hint: `${lesson.nodes.find((node) => node.id === from)!.title} → ${lesson.nodes.find((node) => node.id === to)!.title} 연결을 복원하세요.`,
        passed: false,
      });
  }
  const expected = [
    ...lesson.initialEdges.map(([from, to]) => connectionId(from, to)),
    ...lesson.goals
      .filter((goal) => goal.kind === 'edge')
      .map((goal) => connectionId(goal.from, goal.to)),
  ];
  if (lab.edges.some((edge) => !expected.includes(connectionId(edge.source, edge.target))))
    results.push({
      id: 'unexpected',
      label: '과제에 맞지 않는 연결 정리',
      hint: '노드의 역할과 방향을 다시 읽고 불필요한 연결을 삭제하세요.',
      passed: false,
    });
  return results;
}

export function experimentSignature(lab: LabState): string {
  return JSON.stringify({
    edges: lab.edges.map((edge) => connectionId(edge.source, edge.target)).sort(),
    answers: lab.answers,
    resources: lab.resources ?? {},
    activeNodes: lab.activeNodes ? [...lab.activeNodes].sort() : undefined,
  });
}

export function runExperiment(lesson: Lesson, lab: LabState): ExperimentResult {
  if (lesson.workflow) {
    const r = runWorkflow(lesson.id, lab);
    return {
      success: r.success,
      headline: r.headline,
      observations: r.stages.filter((s) => s.status !== 'success').map((s) => s.reason),
      metrics: r.metrics,
    };
  }
  if (lesson.activity) {
    const result = simulate(lesson.activity, lab.answers);
    return {
      success: evaluateGoals(lesson, lab).every((g) => g.passed),
      headline: result.headline,
      observations: [
        result.detail,
        ...evaluateGoals(lesson, lab)
          .filter((g) => !g.passed)
          .map((g) => g.hint),
      ],
      metrics: result.metrics,
    };
  }
  const missingNodes = lab.activeNodes
    ? lesson.nodes.filter((node) => !lab.activeNodes!.includes(node.id))
    : [];
  if (missingNodes.length)
    return {
      success: false,
      headline: '먼저 필요한 노드를 추가하세요.',
      observations: missingNodes.map((node) => `${node.title} 노드가 필요합니다.`),
      metrics: [],
    };
  const invalid = lesson.fields.filter(
    (field) =>
      !field.options &&
      (typeof lab.answers[field.id] !== 'number' ||
        !Number.isFinite(lab.answers[field.id]) ||
        Number(lab.answers[field.id]) < (field.min ?? -Infinity) ||
        Number(lab.answers[field.id]) > (field.max ?? Infinity)),
  );
  if (invalid.length)
    return {
      success: false,
      headline: '설정값의 범위를 확인하세요.',
      observations: invalid.map(
        (field) =>
          `${field.label}: ${field.min ?? '제한 없음'} ~ ${field.max ?? '제한 없음'} 범위의 숫자를 입력하세요.`,
      ),
      metrics: [],
    };
  const goals = evaluateGoals(lesson, lab);
  const success = goals.every((goal) => goal.passed);
  const observations = goals.filter((goal) => !goal.passed).map((goal) => goal.hint);
  const metrics: ExperimentResult['metrics'] = [];
  let headline = success
    ? '구성한 경로가 과제 조건을 충족합니다.'
    : '아직 해결해야 할 조건이 있습니다.';
  const a = lab.answers;
  switch (lesson.id) {
    case 'aws-ec2-ebs':
      headline = success
        ? 'EC2 종료 후에도 데이터 EBS의 checkpoint.pt가 남아 있습니다.'
        : '체크포인트 기록 경로와 볼륨 보존 설정을 확인하세요.';
      metrics.push(
        { label: 'EC2 상태', value: '종료됨' },
        {
          label: '실습 목표의 파일',
          value: success ? '보존 · 다시 연결해 읽기' : '보존 경로 미완성',
        },
      );
      observations.push(
        'RAM의 실행 상태를 보관한 것이 아니라 코드가 디스크에 쓴 파일을 보관합니다.',
      );
      break;
    case 'aws-s3-versions': {
      const historical = a.versioning === 'on';
      headline = success
        ? '덮어쓰기 이후에도 버전 ID로 모델 v1을 읽었습니다.'
        : !historical
          ? '과거 v1은 보관되지 않았습니다. 버전 관리가 업로드 전부터 필요합니다.'
          : '과거 버전의 조회 경로와 읽을 버전 ID를 확인하세요.';
      metrics.push(
        { label: '보관된 버전', value: historical ? 'v1, v2' : '최신 v2만' },
        {
          label: '선택한 읽기 결과',
          value: a.version === 'latest' ? '최신 v2' : historical ? '모델 v1' : 'v1 조회 불가',
        },
      );
      break;
    }
    case 'aws-vpc-security':
      headline = success
        ? 'ALB 출발지의 TCP 8080 요청을 허용했습니다.'
        : a.source === 'internet' && a.port === '8080'
          ? '요청은 허용해도 출발지 제한 목표를 충족하지 않습니다.'
          : '연결 시간 초과 · 서비스 연결과 허용 규칙을 확인하세요.';
      metrics.push(
        {
          label: '허용 출발지',
          value:
            a.source === 'alb'
              ? 'ALB 보안 그룹'
              : a.source === 'internet'
                ? '모든 인터넷 주소'
                : '없음',
        },
        { label: '허용 포트', value: `TCP ${a.port}` },
      );
      break;
    case 'aws-container-services':
      headline = success
        ? 'ECR 이미지를 ECS가 Fargate에서 실행합니다.'
        : a.orchestrator === 'ecr'
          ? 'ECR은 이미지 보관소입니다. 실행을 관리할 서비스를 선택하세요.'
          : '사용 가능한 다른 선택과 이번 과제의 ECS·Fargate 조건을 구분하세요.';
      metrics.push(
        { label: '이미지 보관', value: 'ECR' },
        { label: '컨테이너 관리', value: String(a.orchestrator).toUpperCase() },
        { label: '컴퓨팅', value: a.compute === 'fargate' ? 'Fargate' : 'EC2' },
      );
      break;
    case 'aws-alb-health':
      headline = success
        ? '준비 상태 검사 통과 · 등록된 추론 서버로 요청을 전달했습니다.'
        : '대상 그룹 연결과 서버가 제공하는 헬스 체크 경로를 확인하세요.';
      metrics.push(
        { label: '검사 경로', value: String(a.healthPath) },
        { label: '예시 경로 응답', value: a.healthPath === '/ready' ? '200' : '404' },
      );
      observations.push('준비 상태 통과는 모델의 예측 품질을 평가한 결과가 아닙니다.');
      break;
    case 'aws-mlops-map':
      headline = success
        ? '데이터 → 연산 → 모델 저장 경로가 완성되었습니다.'
        : '데이터나 결과 모델이 도착할 경로를 확인하세요.';
      if (success)
        observations.push('dataset:v1은 EC2 작업의 입력, model:v1은 외부 S3에 남는 결과입니다.');
      break;
    case 'iam-access':
      headline = success
        ? '읽기 요청 허용 · 대상 데이터를 가져왔습니다.'
        : a.policy === 'admin'
          ? '읽기는 가능해도 최소 권한 목표를 충족하지 않습니다.'
          : 'AccessDenied · 이 과제의 권한 또는 역할 경로를 확인하세요.';
      metrics.push({
        label: '접근 범위',
        value:
          a.policy === 'read'
            ? '대상 데이터 읽기'
            : a.policy === 'admin'
              ? '과도한 관리자 권한'
              : '읽기 권한 없음',
      });
      break;
    case 'private-network':
      headline = success
        ? 'S3 전용 프라이빗 경로로 데이터가 전달되었습니다.'
        : 'S3로 향하는 유효한 프라이빗 경로가 없습니다.';
      if (success)
        observations.push('일반 인터넷 패키지 저장소의 경로는 이 Endpoint가 제공하지 않습니다.');
      break;
    case 'spot-checkpoint':
      headline = success
        ? '중단 후 최근 체크포인트 50%부터 재개했습니다.'
        : '작업이 중단되었고 외부에서 복구할 체크포인트가 준비되지 않았습니다.';
      metrics.push(
        { label: '복구 시작점', value: success ? '50%' : '0%' },
        { label: '다시 수행할 작업', value: success ? '중단 전 마지막 10% 포함' : '처음부터' },
      );
      break;
    case 'container-image':
      headline = success
        ? 'ECR 이미지로 컨테이너 실행 · 호스트 커널 공유'
        : '이미지와 실행 환경의 차이를 다시 확인하세요.';
      if (success) observations.push('저장된 이미지와 실행 중인 컨테이너는 서로 다른 대상입니다.');
      break;
    case 'deployment-service':
      headline = success
        ? 'Service가 app=predictor Pod 3개를 찾았습니다.'
        : '복제본 수·selector·연결 중 조건이 맞지 않습니다.';
      metrics.push(
        { label: '원하는 복제본', value: String(a.replicas) },
        { label: '라벨 일치', value: a.selector === 'predictor' ? '일치' : '불일치' },
      );
      break;
    case 'healing-autoscaling':
      headline = success
        ? 'Pod 복구 3개 → 부하 증가 후 목표 6개'
        : '복구와 부하 기반 확장 조건을 구분해 확인하세요.';
      metrics.push(
        { label: '삭제 직후', value: '2 / 3' },
        { label: '컨트롤러 복구 후', value: '3 / 3' },
        { label: '부하 시 허용 상한', value: String(a.max) },
      );
      break;
    case 'gpu-memory': {
      const usage = 3 + Number(a.batch) * (a.precision === 'amp' ? 0.2 : 0.4);
      headline =
        usage > 8
          ? 'OOM · 예시 메모리 예산을 초과했습니다.'
          : success
            ? '메모리 예산 안에서 목표 설정이 동작합니다.'
            : '메모리에는 들어가지만 이번 비교 실험의 설정과 다릅니다.';
      metrics.push(
        { label: '예시 VRAM 사용량', value: `${usage.toFixed(1)} / 8.0 GiB` },
        { label: '예시 GPU 상태', value: usage > 8 ? 'OOM' : '실행 가능' },
      );
      observations.push(
        '고정 상태 3GiB + 배치당 활성값이라는 단순 계산이며 실제 AMP 벤치마크가 아닙니다.',
      );
      break;
    }
    case 'gpu-scheduling':
      headline = success
        ? 'Running · GPU 자원과 배치 조건을 만족했습니다.'
        : 'Pending · GPU 요청·노드 조건·taint 허용을 확인하세요.';
      metrics.push(
        { label: '사용 가능 GPU', value: '1' },
        { label: '요청 GPU', value: String(a.gpu) },
      );
      break;
    case 'parallelism':
      headline = success
        ? '서로 다른 입력을 처리하고 그래디언트를 동기화합니다.'
        : '이 과제에서 나누는 대상은 데이터입니다.';
      if (success)
        observations.push('각 GPU에는 전체 모델 복제본이 있으며, 통신 비용이 추가됩니다.');
      break;
    case 'storage-types':
      headline = success
        ? '모델 파일은 객체 API, 공유 파일은 파일 시스템으로 접근합니다.'
        : '파일의 용도와 접근 방식을 다시 매칭하세요.';
      break;
    case 'persistent-volumes':
      headline = success
        ? 'Bound · Pod 교체 후 checkpoint.pt가 남아 있습니다.'
        : 'Pending · PVC 조건과 PV 제공 조건이 맞지 않습니다.';
      metrics.push(
        { label: 'PVC 요청', value: '10Gi / RWX' },
        { label: 'PV 제공', value: `${a.capacity}Gi / ${a.mode}` },
      );
      break;
    case 'data-loading':
      headline = success
        ? '데이터 대기 비중이 줄어든 예시를 확인했습니다.'
        : '데이터 공급 경로나 로딩 설정을 확인하세요.';
      metrics.push(
        { label: '예시 데이터 대기', value: success ? '20%' : '70%' },
        { label: '설정 워커 수', value: String(a.workers) },
      );
      observations.push(
        '정해진 학습용 비교 값입니다. 실제 환경에서는 CPU·스토리지·전송 시간을 측정해야 합니다.',
      );
      break;
    case 'dvc-time-travel': {
      const version = a.checkout === 'dvc' ? String(a.pointer) : 'v2';
      headline = success
        ? '포인터와 실제 데이터가 모두 v1으로 복원되었습니다.'
        : '포인터와 작업 공간 데이터의 버전을 비교하세요.';
      metrics.push(
        { label: 'Git의 포인터', value: String(a.pointer) },
        { label: '작업 공간 데이터', value: version },
      );
      observations.push(
        a.checkout === 'dvc'
          ? '캐시에서 포인터가 가리키는 데이터 내용을 가져왔습니다.'
          : 'Git 포인터만 전환해도 실제 데이터는 v2로 남습니다.',
      );
      break;
    }
    case 'lakehouse':
      headline = success
        ? '스냅샷 v1의 과거 행과 스키마를 조회했습니다.'
        : '현재 최신 스냅샷과 재현할 시점을 구분하세요.';
      metrics.push(
        { label: '조회 스냅샷', value: String(a.snapshot) },
        {
          label: '예시 스키마',
          value: a.snapshot === 'v1' ? 'id, feature' : 'id, feature, segment',
        },
      );
      break;
    case 'feature-store':
      headline = success
        ? '학습과 서빙이 같은 v1 피처 정의를 사용합니다.'
        : 'Training-Serving Skew · 조회 경로나 계산 정의를 확인하세요.';
      metrics.push(
        { label: '학습 피처 정의', value: 'v1 · 최근 1시간' },
        {
          label: '서빙 피처 정의',
          value: a.featureVersion === 'v1' ? 'v1 · 최근 1시간' : 'v2 · 전체 이력',
        },
      );
      break;
    case 'vector-embedding':
      headline = success
        ? '384차원 공간에서 예시 검색 결과를 비교할 수 있습니다.'
        : a.embedding === 'v2'
          ? 'Dimension mismatch · 768차원 질문과 384차원 인덱스'
          : '질문 벡터를 검색 인덱스에 전달하세요.';
      metrics.push(
        { label: '인덱스 차원', value: '384' },
        { label: '질문 차원', value: a.embedding === 'v1' ? '384' : '768' },
      );
      break;
    case 'rag-retrieval':
      headline = success
        ? '피처 재사용·온라인 조회 문서가 답변의 근거로 전달되었습니다.'
        : '검색과 생성 사이의 근거 경로·관련성을 확인하세요.';
      if (success)
        observations.push(
          '예시 문서: “피처 스토어는 피처 재사용을 돕고 온라인 조회를 제공합니다.”',
          '실제 임베딩이나 LLM 생성 없이 검색 근거 전달을 관찰하는 실습입니다.',
        );
      break;
    case 'serving-patterns':
      headline = success
        ? '현재 사용자 요청이 추론 경로를 거쳐 응답을 받았습니다.'
        : '일괄 작업은 현재 요청의 즉시 응답 목표에 맞지 않습니다.';
      metrics.push({
        label: '처리 시점',
        value: a.mode === 'realtime' ? '요청 시' : '예약된 배치 시점',
      });
      break;
    case 'safe-release': {
      const fresh =
        a.strategy === 'shadow' ? 0 : a.strategy === 'bluegreen' ? 100 : Number(a.traffic);
      headline = success
        ? 'Canary · 기존 모델 90건, 새 모델 10건 응답'
        : a.strategy === 'shadow'
          ? 'Shadow · 새 모델에도 복제하지만 사용자 응답은 기존 모델'
          : '전략과 초기 실제 응답 비중을 확인하세요.';
      metrics.push(
        { label: '새 모델 사용자 응답', value: `${fresh} / 100` },
        { label: '기존 모델 사용자 응답', value: `${100 - fresh} / 100` },
      );
      break;
    }
    case 'drift-monitoring':
      headline = success
        ? '정상 HTTP 응답과 별개로 모델 품질 저하를 조사합니다.'
        : '가동 여부만 보면 예측 품질 저하를 놓칠 수 있습니다.';
      metrics.push(
        { label: 'HTTP 응답', value: '정상' },
        { label: '정답 표본 정확도', value: '0.85 → 0.62' },
      );
      if (success)
        observations.push(
          '데이터 분포·정답과 입력의 관계·수집 품질을 검토한 뒤 대응을 결정합니다.',
        );
      break;
  }
  if (!observations.length)
    observations.push(
      success ? lesson.reflection : '본문의 설명과 목표별 힌트를 참고해 다시 실험해 보세요.',
    );
  return { success, headline, observations, metrics };
}
