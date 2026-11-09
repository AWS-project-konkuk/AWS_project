import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'lakehouse-time-travel',
  unit: 3,
  order: 2,
  title: '데이터 레이크하우스에서 과거 데이터 찾기',
  summary:
    '객체 저장소의 많은 파일을 하나의 테이블처럼 관리하고 스냅샷을 이용해 과거 시점의 데이터를 찾아보세요.',
  scenario:
    'S3의 CSV를 계속 덮어써서 지난 실험 시점의 행과 스키마를 찾을 수 없습니다. 여러 작업이 동시에 파일을 갱신하면 어느 상태가 유효한지도 불분명합니다.',
  concepts: [
    'Data Warehouse·Lake·Lakehouse',
    'Open Table Format',
    'ACID',
    'Time Travel',
    'Schema Evolution',
  ],
  assessment: {
    question: '과거 데이터 조회를 가능하게 하는 추가 관리 정보는?',
    options: [
      '해당 시점의 유효한 파일·스키마를 가리키는 테이블 메타데이터',
      'S3에 파일이 존재한다는 사실만으로 모든 과거 상태가 보장된다',
    ],
    correct: 0,
    explanation:
      '파일 저장소 위의 Iceberg·Delta Lake 같은 테이블 포맷이 스냅샷이나 로그로 유효한 파일 집합과 스키마를 관리합니다. 과거 스냅샷을 고정하면 같은 시점의 데이터를 읽을 수 있습니다. 보존 정책으로 과거 파일이 삭제되면 타임트래블도 제한되며 스키마 진화가 모든 소비 코드의 호환성을 보장하지 않습니다.',
  },
  advanced: [
    {
      title: '심화 · 원자적 커밋과 낙관적 동시성 제어',
      body: 'Iceberg는 스냅샷과 매니페스트 등으로 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그로 테이블 변경을 기록합니다. 커밋 충돌 처리와 원자적 상태 전환은 카탈로그·엔진·저장소 구성에 의존합니다. 스냅샷 만료와 파일 정리는 재현할 시점의 보존 요구와 함께 설계합니다.',
    },
  ],
  caution:
    'Git 체크아웃은 메타데이터를 바꾸며 DVC 체크아웃은 캐시의 실제 내용을 작업 공간에 반영합니다. 필요한 내용이 캐시에 없으면 원격에서 가져와야 합니다. 환경·난수·외부 입력까지 고정하지 않으면 동일한 학습 결과는 보장되지 않습니다.',
  reflection:
    '객체 저장소의 파일만으로는 과거 시점의 테이블을 정확히 재구성하기 어려운 이유는 무엇일까요?',
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
});
