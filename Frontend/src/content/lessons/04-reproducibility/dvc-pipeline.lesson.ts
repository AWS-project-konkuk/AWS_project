import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-pipeline',
  unit: 3,
  order: 4,
  title: 'DVC 파이프라인과 실험 재현성',
  summary: '학습 설정이나 데이터가 바뀌었을 때 어느 작업을 다시 해야 하는지 비교합니다.',
  scenario:
    '전처리·학습·평가가 읽는 파일과 만드는 결과를 표시합니다. 학습 설정을 바꾼 경우와 원본 데이터를 바꾼 경우에 어느 단계부터 다시 실행해야 하는지 비교해 보세요.',
  concepts: ['작업 순서표', '설정 메모', '실행 기록', '입력과 결과', '결과 재사용'],
  assessment: {
    question: '학습 코드만 바뀌었을 때 우선 영향을 받는 것은?',
    options: [
      '학습 단계와 그 출력에 의존하는 평가',
      '선언된 의존성과 관계없이 모든 단계가 항상 재실행된다',
    ],
    correct: 0,
    explanation:
      '원본 데이터 → 전처리 결과 → 학습 모델 → 평가 결과의 의존성을 추적합니다. 학습 코드만 바뀌면 전처리를 재사용할 수 있고 학습과 그 결과에 의존하는 평가가 영향을 받습니다. 이미 존재하는 실행 캐시·출력 캐시를 재사용할 수 있는 조건과 새로 계산해야 하는 조건을 구분합니다.',
  },
  advanced: [
    {
      title: '심화 · 선언한 입력만 추적됩니다',
      body: 'DVC는 dvc.yaml에 선언한 deps, params, outs와 dvc.lock의 실행 상태를 바탕으로 재실행 범위를 판단합니다. 코드가 읽는 환경 변수나 외부 API처럼 선언하지 않은 입력은 자동으로 추적되지 않습니다. 재현성을 높이려면 데이터와 코드뿐 아니라 파라미터, 실행 환경, 난수 조건도 명시적으로 기록해야 합니다.',
    },
  ],
  caution:
    '의존성을 빠뜨리면 DVC는 그 변경을 알 수 없습니다. 캐시 적중은 이전 출력을 재사용할 수 있다는 뜻이지 모든 실행 환경이 동일하다는 보장은 아닙니다.',
  reflection: '학습 코드만 바뀌었을 때 우선 영향을 받는 것은?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: 'DVC 공식 · dvc.yaml 파일',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
    },
    {
      title: 'DVC 공식 · params.yaml 파일',
      url: 'https://doc.dvc.org/user-guide/project-structure/params-file',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  nodeExample: {
    id: 'dvc-dependencies',
    title: '학습 코드가 바뀌면 평가도 영향을 받을까',
    prompt:
      '각 연결은 의존하는 입력입니다. 준비한 자료와 학습 결과가 평가까지 어떻게 이어지는지 확인하세요.',
    nodes: [
      {
        id: 'prep',
        title: '전처리 결과',
        purpose: '학습 자료와 독립된 평가 자료를 준비합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'training',
        title: '학습 단계',
        purpose: '코드·파라미터와 학습 자료로 모델을 만듭니다.',
        x: 330,
        y: 0,
      },
      {
        id: 'evaluation',
        title: '평가 단계',
        purpose: '모델과 별도 평가 자료로 결과를 계산합니다.',
        x: 660,
        y: 0,
      },
    ],
    links: [
      {
        id: 'prep-training',
        source: 'prep',
        target: 'training',
        label: '학습 자료',
        detail: '전처리 결과 중 학습용 분할을 사용합니다.',
        material: 'data',
      },
      {
        id: 'training-evaluation',
        source: 'training',
        target: 'evaluation',
        label: '학습 모델',
        detail: '학습 결과가 바뀌면 이를 사용하는 평가도 영향을 받습니다.',
        material: 'model',
      },
      {
        id: 'prep-evaluation',
        source: 'prep',
        target: 'evaluation',
        label: '별도 평가 자료',
        detail: '학습 자료와 분리한 평가용 분할이 추가 입력입니다.',
        material: 'data',
      },
    ],
    practiceHint:
      '평가에는 모델 외에도 별도 평가 자료가 필요합니다. 어떤 입력이 바뀌었는지에 따라 재실행 범위를 판단하세요.',
    nextLesson: 'week4-workflow',
    kind: '자료 전달',
    afterSection: 2,
  },
});
