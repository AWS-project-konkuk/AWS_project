import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week4-workflow',
  unit: 3,
  order: 7,
  title: '과거 실험을 재현하는 전체 흐름',
  summary:
    '종합 실습 · 지난주 코드와 데이터를 맞추고, 같은 실험에 필요한 설정과 환경도 확인합니다.',
  minutes: 18,
  scenario:
    'Git 메타데이터와 실제 데이터 경로를 나눠 연결하세요. Git 이동만으로 생긴 불일치를 관찰한 뒤 캐시·원격에서 v1을 복원하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  advanced: [
    {
      title: '심화 · 재현 가능한 실험의 범위',
      body: '과거 실험을 되살리려면 Git 커밋, DVC 데이터 해시, 파이프라인 파라미터, 실행 환경을 함께 식별해야 합니다. Lakehouse 스냅샷을 입력으로 쓴다면 스냅샷 ID나 시점도 기록합니다. 파일을 찾는 단계와 모델 수치까지 재현하는 단계는 구분해서 검증하세요.',
    },
  ],
  caution:
    '캐시에 있으면 checkout, 없으면 원격에서 가져온 뒤 복원합니다. 실행 환경·난수 등도 실제 재현에 영향을 줍니다.',
  reflection: 'Git 포인터 v1과 실제 데이터 v2가 함께 있다면?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
    },
    {
      title: 'DVC · 데이터 추적과 Git 제외',
      url: 'https://doc.dvc.org/user-guide/how-to/stop-tracking-data',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://git-scm.com/book/en/v2/Git-Internals-Git-Objects',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  workflow: 'week4-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'git',
      title: 'Git 커밋',
      detail: '코드와 .dvc 포인터를 선택합니다.',
    },
    {
      id: 'remote',
      title: 'DVC 원격',
      detail: '실제 v1·v2 데이터가 보관되어 있습니다.',
    },
    {
      id: 'cache',
      title: '로컬 캐시',
      detail: '내용 식별자에 맞는 파일을 찾거나 가져옵니다.',
    },
    {
      id: 'workspace',
      title: '작업 공간 복원',
      detail: '포인터가 가리키는 데이터로 맞춥니다.',
    },
    {
      id: 'reproduce',
      title: '실험 재현 확인',
      detail: '코드와 데이터 버전이 일치하는지 검사합니다.',
    },
  ],
  fields: [
    {
      id: 'version',
      label: '재현할 실험 버전',
      initial: 'v1',
      options: [
        {
          value: 'v1',
          label: 'v1',
        },
        {
          value: 'v2',
          label: 'v2',
        },
      ],
      help: '코드와 데이터가 같은 버전이어야 합니다.',
    },
    {
      id: 'local',
      label: '로컬 캐시의 v1',
      initial: 'missing',
      options: [
        {
          value: 'missing',
          label: '캐시에 없음',
        },
        {
          value: 'present',
          label: '캐시에 있음',
        },
      ],
      help: '없을 때는 원격에서 가져와야 합니다.',
    },
    {
      id: 'operation',
      label: '복원 작업',
      initial: 'git',
      options: [
        {
          value: 'git',
          label: 'Git 이동만',
        },
        {
          value: 'checkout',
          label: 'dvc checkout',
        },
        {
          value: 'pull',
          label: 'dvc pull 후 복원',
        },
      ],
      help: '현재 작업 데이터는 v2라고 가정합니다.',
    },
  ],
});
