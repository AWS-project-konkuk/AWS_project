import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'object-mlops',
  unit: 2,
  order: 3,
  title: 'MLOps에서 Object Storage를 쓰는 이유',
  summary: '큰 데이터셋과 모델 파일의 공통 보관소를 구성합니다.',
  scenario:
    '설명에서 문제와 원리를 이해하고, 전체 흐름에서 이 개념의 역할을 설명해 보세요. 비교 활동은 필요한 경우에만 펼쳐 확인합니다.',
  concepts: ['Object Storage', '데이터 로더', 'GPU 학습', '모델 아티팩트'],
  assessment: {
    question: '객체 저장소의 역할에 맞는 것은?',
    options: ['GPU 계산을 대신 수행하는 장치', '연산과 분리된 공통 데이터·모델 보관소'],
    correct: 1,
    explanation: '데이터 보관과 데이터 공급·연산의 책임을 나눕니다.',
  },
  advanced: [
    {
      title: '심화 · CSI와 JuiceFS',
      body: 'CSI는 저장소 플러그인이 볼륨 생성·연결·마운트 등을 구현하는 표준 인터페이스입니다. JuiceFS는 파일 메타데이터 엔진, 객체 저장소의 데이터, 클라이언트 캐시를 결합합니다. 캐시 적중과 최초 읽기를 구분하며 용량·일관성·장애 복구 비용도 함께 판단합니다.',
    },
  ],
  caution: '데이터 보관과 데이터 공급·연산의 책임을 나눕니다.',
  reflection: '객체 저장소의 역할에 맞는 것은?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
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
    ],
    correct: 'a',
    explanation: '데이터 보관과 데이터 공급·연산의 책임을 나눕니다.',
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
