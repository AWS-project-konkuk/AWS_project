import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 's3-objects',
  unit: 0,
  order: 3,
  title: 'S3는 객체를 보관하는 저장소',
  summary: '버킷·키·객체와 업로드·조회 흐름을 살펴봅니다.',
  scenario:
    '버킷과 객체 키로 데이터를 구분하고, S3에서 읽기 → EC2에서 계산 → S3에 결과 저장 흐름을 따라가 보세요.',
  concepts: ['데이터 파일', 'S3 버킷', '학습 작업'],
  assessment: {
    question: 'S3에서 객체를 식별할 때 사용하는 것은?',
    options: ['실행 중인 프로세스 번호', '버킷과 객체 키'],
    correct: 1,
    explanation: '버킷과 키를 통해 객체에 접근합니다.',
  },
  caution:
    'S3는 Simple Storage Service의 약자입니다. 데이터를 객체 단위로 보관하는 서비스입니다. S3 안에는 버킷이 존재하며, 버킷은 객체를 담는 공간입니다. S3가 필요한 이유는, 학습에 필요한 데이터 + 학습 후의 데이터를 저장할 별도의 공간이 필요하기 때문입니다.',
  reflection: 'S3에서 객체를 식별할 때 사용하는 것은?',
  references: [
    {
      title: '원문 · MLOps 1주차 · 실제 도구 실습',
      url: 'https://www.notion.so/896ebb1cb38a830b8ade81b394fce2f5',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
    },
  ],
  sourceWeek: 1,
  mapStages: ['data', 'training'],
  nodeExample: {
    id: 's3-read-train',
    title: '보관한 데이터는 누가 읽고 계산할까',
    prompt:
      'S3 객체가 스스로 학습하는 것이 아닙니다. 저장된 데이터를 읽는 작업과 결과를 보관하는 경로를 따라가 보세요.',
    nodes: [
      {
        id: 'dataset',
        title: '원본 데이터 S3',
        purpose: '입력 객체 train-v1.csv를 보관합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'training',
        title: 'EC2 학습 작업',
        purpose: '객체를 읽어 모델을 계산합니다.',
        x: 310,
        y: 0,
      },
      {
        id: 'artifact',
        title: '모델 보관 S3',
        purpose: '학습 결과 model-v1을 보관합니다.',
        x: 620,
        y: 0,
      },
    ],
    links: [
      {
        id: 'dataset-training',
        source: 'dataset',
        target: 'training',
        label: 'train-v1.csv',
        detail: 'EC2 작업이 객체 API로 원본 자료를 읽습니다.',
        material: 'data',
      },
      {
        id: 'training-artifact',
        source: 'training',
        target: 'artifact',
        label: 'model-v1',
        detail: '계산을 끝낸 모델 파일을 외부 저장소에 기록합니다.',
        material: 'model',
      },
    ],
    practiceHint:
      '계산 결과를 보관할 마지막 경로를 연결하세요. S3 자체가 계산을 수행하는 연결은 아닙니다.',
    nextLesson: 'week3-workflow',
    kind: '자료 전달',
    afterSection: 1,
  },
  activity: {
    kind: 'objects',
    fields: [
      {
        id: 'operation',
        label: '객체 작업',
        initial: 'put',
        options: [
          {
            value: 'put',
            label: 'PUT · 업로드',
          },
          {
            value: 'get',
            label: 'GET · 조회',
          },
        ],
        help: '선택을 바꾸고 결과를 비교하세요.',
      },
    ],
    question: 'S3에서 객체를 식별할 때 사용하는 것은?',
    options: [
      {
        value: 'b',
        label: '실행 중인 프로세스 번호',
      },
      {
        value: 'a',
        label: '버킷과 객체 키',
      },
    ],
    correct: 'a',
    explanation: '버킷과 키를 통해 객체에 접근합니다.',
    task: '업로드와 조회의 화살표 방향을 비교하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: '데이터 파일',
      detail: 'S3는 객체를 보관하는 저장소 · 1번째 구성 요소',
      tone: '#9b8bec',
    },
    {
      id: 'n1',
      title: 'S3 버킷',
      detail: 'S3는 객체를 보관하는 저장소 · 2번째 구성 요소',
      tone: '#9b8bec',
    },
    {
      id: 'n2',
      title: '학습 작업',
      detail: 'S3는 객체를 보관하는 저장소 · 3번째 구성 요소',
      tone: '#9b8bec',
    },
  ],
  fields: [
    {
      id: 'operation',
      label: '객체 작업',
      initial: 'put',
      options: [
        {
          value: 'put',
          label: 'PUT · 업로드',
        },
        {
          value: 'get',
          label: 'GET · 조회',
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
      label: '데이터 파일 → S3 버킷',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
    {
      id: 'n1-n2',
      kind: 'edge',
      from: 'n1',
      to: 'n2',
      label: 'S3 버킷 → 학습 작업',
      hint: '설명의 입력·출력과 화살표 방향을 확인하세요.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
