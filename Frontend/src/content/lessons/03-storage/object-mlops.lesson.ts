import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'object-mlops',
  unit: 2,
  order: 3,
  title: 'MLOps에서 Object Storage를 쓰는 이유',
  summary: '큰 데이터셋과 모델 파일의 공통 보관소를 구성합니다.',
  scenario:
    '학습 서버를 교체해도 같은 데이터셋을 읽고, 완성된 모델을 다음 배포 작업에서 찾을 수 있도록 연산 자원과 공통 보관소를 분리하세요.',
  concepts: ['Object Storage', '데이터 로더', 'GPU 학습', '모델 아티팩트'],
  assessment: {
    question: '객체 저장소의 역할에 맞는 것은?',
    options: [
      'GPU 계산을 대신 수행하는 장치',
      '연산과 분리된 공통 데이터·모델 보관소',
      'Pod가 삭제되면 함께 사라지는 임시 작업 공간',
      '데이터를 저장하기만 하면 GPU에 배치를 자동으로 공급하는 장치',
    ],
    correct: 1,
    explanation:
      '객체 저장소는 버킷과 키로 데이터셋·체크포인트·모델을 보관합니다. 실제 전처리와 GPU 계산은 학습 작업이 수행합니다.',
  },
  advanced: [
    {
      title: '심화 · 객체 키와 버전 추적',
      body: '데이터 버전과 실행 ID를 객체 키 또는 메타데이터에 기록하면 입력과 결과 모델의 관계를 추적하기 쉽습니다. S3 Versioning은 같은 키의 과거 버전을 구분하지만, 어떤 데이터로 학습했는지는 실험 메타데이터와 함께 기록해야 합니다.',
    },
  ],
  caution:
    '공통 보관소가 생겨도 작은 객체 요청, 네트워크와 전처리 병목이 자동으로 사라지지는 않습니다.',
  reflection: '데이터셋과 모델 키에 어떤 정보를 넣어야 같은 실험을 다시 찾을 수 있을까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://cool-candle-658.notion.site/MLOps-4-02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'AWS 공식 · Amazon S3 개요',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
    },
    {
      title: 'AWS 공식 · S3 Versioning 사용',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  activity: {
    kind: 'objects',
    variant: 'mlops',
    fields: [
      {
        id: 'operation',
        label: '객체 작업',
        initial: 'get',
        options: [
          {
            value: 'put',
            label: 'PUT · 모델 보관',
          },
          {
            value: 'get',
            label: 'GET · 데이터 조회',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: '객체 저장소의 역할에 맞는 것은?',
    options: [
      {
        value: 'b',
        label: 'GPU 계산을 대신 수행하는 장치',
      },
      {
        value: 'a',
        label: '연산과 분리된 공통 데이터·모델 보관소',
      },
      {
        value: 'c',
        label: 'Pod가 삭제되면 함께 사라지는 임시 작업 공간',
      },
      {
        value: 'd',
        label: '데이터를 저장하기만 하면 GPU에 배치를 자동으로 공급하는 장치',
      },
    ],
    correct: 'a',
    explanation:
      '객체 저장소는 버킷과 키로 데이터셋·체크포인트·모델을 보관합니다. 실제 전처리와 GPU 계산은 학습 작업이 수행합니다.',
    task: '데이터 조회와 모델 보관의 경로를 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Object Storage',
      detail: 'MLOps에서 Object Storage를 쓰는 이유 · 1번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n1',
      title: '데이터 로더',
      detail: 'MLOps에서 Object Storage를 쓰는 이유 · 2번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n2',
      title: 'GPU 학습',
      detail: 'MLOps에서 Object Storage를 쓰는 이유 · 3번째 구성 요소',
      tone: '#6eac9b',
    },
    {
      id: 'n3',
      title: '모델 아티팩트',
      detail: 'MLOps에서 Object Storage를 쓰는 이유 · 4번째 구성 요소',
      tone: '#6eac9b',
    },
  ],
  fields: [
    {
      id: 'operation',
      label: '객체 작업',
      initial: 'get',
      options: [
        {
          value: 'put',
          label: 'PUT · 모델 보관',
        },
        {
          value: 'get',
          label: 'GET · 데이터 조회',
        },
      ],
      help: '선택을 바꾸고 결과를 비교하세요.',
    },
  ],
  goals: [
    {
      id: 'n0-n1',
      kind: 'edge',
      from: 'n0',
      to: 'n1',
      label: 'Object Storage → 데이터 로더',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: '데이터 로더 → GPU 학습',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n2-n3',
      kind: 'edge',
      from: 'n2',
      to: 'n3',
      label: 'GPU 학습 → 모델 아티팩트',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
    ['n2', 'n3'],
  ],
});
