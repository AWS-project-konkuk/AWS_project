import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'dvc-pipeline',
  unit: 3,
  order: 1,
  title: '입력이 바뀌면 어느 단계부터 다시 실행할까',
  summary:
    '학습 코드 한 줄을 바꿨는데 데이터 다운로드와 전처리까지 매번 다시 실행됩니다. 반대로 필요한 재학습을 건너뛰면 오래된 모델을 평가할 수 있습니다.',
  scenario:
    '학습 코드 한 줄을 바꿨는데 데이터 다운로드와 전처리까지 매번 다시 실행됩니다. 반대로 필요한 재학습을 건너뛰면 오래된 모델을 평가할 수 있습니다.',
  concepts: ['같은 실험으로 돌아가기', '입력이 바뀌면 어느 단계부터 다시 실행할까'],
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
      title: '심화 · 테이블 커밋과 보존',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution:
    'Git 체크아웃은 메타데이터를 바꾸며 DVC 체크아웃은 캐시의 실제 내용을 작업 공간에 반영합니다. 필요한 내용이 캐시에 없으면 원격에서 가져와야 합니다. 환경·난수·외부 입력까지 고정하지 않으면 동일한 학습 결과는 보장되지 않습니다.',
  reflection: '학습 코드만 바뀌었을 때 우선 영향을 받는 것은?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
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
