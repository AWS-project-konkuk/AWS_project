import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'lakehouse-time-travel',
  unit: 3,
  order: 6,
  title: 'Data Lakehouse와 타임 트래블',
  summary: '파일을 표처럼 관리하고, 어제의 표를 다시 읽거나 새 열을 추가하는 방법을 알아봅니다.',
  scenario:
    'Warehouse·Lake·Lakehouse의 역할을 비교한 뒤, Iceberg의 스냅샷과 Delta Lake의 로그를 따라 특정 시점의 표를 읽습니다. 주문 표에 새 열을 추가하거나 같은 표를 동시에 수정할 때 어떤 기록이 필요한지 확인해 보세요.',
  concepts: [
    'Data Warehouse·Lake·Lakehouse',
    '오픈 테이블 포맷',
    '원자적 커밋',
    '타임 트래블',
    '스키마 진화',
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
      title: '심화 · 테이블 커밋과 보존',
      body: 'Iceberg는 스냅샷과 매니페스트 계층으로 유효한 파일 집합을 관리하고 Delta Lake는 트랜잭션 로그와 체크포인트로 테이블 상태를 구성합니다. 새 데이터 파일을 먼저 쓰고 마지막에 새 메타데이터 버전을 원자적으로 공개합니다. 타임 트래블은 메타데이터와 과거 데이터 파일이 보존된 범위에서만 가능합니다.',
    },
  ],
  caution:
    '객체 저장소에 파일이 남아 있다는 사실만으로 테이블의 과거 상태가 보장되지는 않습니다. 스냅샷·로그와 참조 파일의 보존 정책을 함께 확인하세요.',
  reflection: '과거 데이터 조회를 가능하게 하는 추가 관리 정보는?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: 'Apache Iceberg 공식 · 소개',
      url: 'https://iceberg.apache.org/docs/latest/',
    },
    {
      title: 'Delta Lake 공식 · 소개',
      url: 'https://docs.delta.io/latest/index.html',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  activityView: {
    type: 'scenario',
    title: '어느 시점의 표를 읽을까요?',
    instruction:
      '어제 주문 100건에 오늘 20건이 추가되었습니다. 두 시점의 기록과 파일이 보존되어 있습니다.',
    note: '과거 조회는 현재 표를 바꾸지 않습니다. 기록이나 파일을 삭제한 시점은 조회할 수 없습니다.',
    cases: [
      {
        label: '오늘 표 조회',
        result: '현재 주문 120건을 읽습니다.',
        cards: [
          { title: '읽는 데이터', value: '120건', detail: '오늘까지의 주문' },
          { title: '현재 표', value: '120건', detail: '현재 상태 유지' },
        ],
        reason: '별도 시점을 지정하지 않으면 현재 테이블을 읽습니다.',
      },
      {
        label: '어제 표 조회',
        result: '어제 주문 100건만 읽습니다.',
        cards: [
          { title: '읽는 데이터', value: '100건', detail: '어제 스냅샷을 선택' },
          { title: '현재 표', value: '120건', detail: '조회해도 바뀌지 않음' },
        ],
        reason: '타임 트래블은 과거 시점의 표를 선택해서 읽는 기능입니다.',
      },
      {
        label: '새 열 추가',
        result: '표의 구조도 버전으로 관리합니다.',
        cards: [
          { title: '표 구조', value: '배송 상태 열 추가', detail: '새 열을 사용할 수 있음' },
          { title: '과거 행', value: '값 확인 필요', detail: '새 열은 값이 없을 수 있음' },
          { title: '학습 코드', value: '호환성 확인', detail: '새 열 처리 방법 점검' },
        ],
        reason: '열을 추가했다고 과거 행의 배송 상태가 자동으로 채워지지는 않습니다.',
      },
    ],
  },
});
