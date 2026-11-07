import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'storage-compare',
  unit: 2,
  order: 2,
  title: 'Block·File·Object의 접근 방식',
  summary: '저장소의 형태와 요청 크기를 함께 비교합니다.',
  scenario:
    '쿠버네티스 환경에서 AI 모델을 학습하기 위해 저장소를 선택하려고 합니다, 어떤 저장소를 선택해야할지 생각해보세요.',
  concepts: ['Block Storage', 'File Storage', 'Object Storage', '지연과 처리량'],
  assessment: {
    question: '스토리지 성능을 비교할 때 함께 봐야 하는 것은?',
    options: [
      '접근 방식·요청 크기·지연·처리량',
      '서비스 이름 하나만',
      '저장 용량이 크면 읽기 속도도 빠르다고 판단한다',
      '큰 파일 하나를 읽은 결과로 작은 파일 여러 개의 성능도 판단한다',
    ],
    correct: 0,
    explanation:
      '같은 저장소도 작은 요청을 많이 보낼 때와 큰 파일을 연속으로 읽을 때 결과가 다릅니다. 애플리케이션의 접근 방식과 요청 패턴을 함께 측정해야 합니다.',
  },
  advanced: [
    {
      title: '심화 · 하나의 학습 시스템에 세 저장 방식을 함께 쓴다면?',
      body: '여러 GPU Pod가 이미지 모델을 학습한다고 가정해 보세요. 원본 데이터셋은 10TB이고, 전처리 과정에서 매번 만들 수 있는 임시 파일이 생기며, 모든 Pod가 읽어야 하는 공통 설정 파일과 학습이 끝난 모델도 있습니다. 먼저 원본 데이터셋·임시 파일·공통 설정·완성 모델을 Block, File, Object 중 어디에 둘지 정해 보세요. 하나만 선택할 필요는 없습니다. 각 데이터가 언제까지 남아야 하는지, 누가 읽고 쓰는지, 프로그램이 파일 경로와 객체 키 중 무엇을 요구하는지 설명할 수 있어야 합니다.',
    },
  ],
  caution:
    '서비스 유형만으로 실제 성능을 단정할 수 없습니다. 같은 크기와 병렬성으로 측정해 비교하세요.',
  reflection:
    '여러 학습 노드가 같은 파일을 수정해야 하는 경우와 완성된 모델 파일을 배포하는 경우에 같은 저장 방식을 써야 할까요?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://cool-candle-658.notion.site/MLOps-4-02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: 'AWS 공식 · EC2에서 사용할 수 있는 저장 방식',
      url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Storage.html',
    },
    {
      title: 'AWS 공식 · EKS AI/ML 스토리지 선택',
      url: 'https://docs.aws.amazon.com/eks/latest/best-practices/aiml-storage.html',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
  practice: 'explore',
});

// 이 강의의 비교 활동에서 사용하는 상황과 카드입니다.
export const storageActivity = {
  title: '어떤 저장소가 어울릴까요?',
  scenarios: [
    {
      label: '서버에 디스크가 필요해요',
      need: '한 서버에서 운영체제와 프로그램 파일을 읽고 쓰려고 합니다.',
      match: 'block',
      reason:
        '서버에 디스크 장치를 연결해 사용하는 Block을 검토합니다. 그 위에 파일 시스템을 만들어 파일을 저장할 수 있습니다.',
    },
    {
      label: '여러 Pod가 폴더를 공유해요',
      need: '서로 다른 노드의 Pod들이 /data 경로에서 같은 파일들을 읽어야 합니다.',
      match: 'file',
      reason:
        '공통 파일 경로가 필요한 상황이므로 File을 검토합니다. 여러 노드의 접근을 지원하는지 확인해야 합니다.',
    },
    {
      label: '완성된 모델을 보관해요',
      need: '학습 서버를 종료한 뒤에도 배포 작업이 모델 파일을 키로 가져와야 합니다.',
      match: 'object',
      reason:
        '서버와 독립된 보관소에 객체를 저장하는 Object를 검토합니다. 배포 작업은 버킷과 키로 모델을 가져옵니다.',
    },
  ],
  cards: [
    {
      id: 'block',
      title: 'Block',
      meaning: '내 서버에 꽂는 새 SSD',
      access: '디스크 연결 → 파일 시스템 → 파일',
      example: '한 서버의 운영체제 · 데이터베이스',
      service: 'AWS 예: EBS',
      check: '다른 노드에 자동으로 공유되지는 않아요',
    },
    {
      id: 'file',
      title: 'File',
      meaning: '여럿이 여는 공용 폴더',
      access: '/data/train.csv 같은 공통 파일 경로',
      example: '여러 Pod의 공통 데이터 폴더',
      service: 'AWS 예: EFS · FSx',
      check: '같은 파일을 동시에 쓸 때 충돌을 확인해요',
    },
    {
      id: 'object',
      title: 'Object',
      meaning: '이름표로 찾는 보관 창고',
      access: '버킷 + 객체 키 → GET / PUT',
      example: '데이터셋 · 체크포인트 · 완성 모델',
      service: 'AWS 예: S3',
      check: '파일 경로 대신 키와 API로 접근해요',
    },
  ],
};
