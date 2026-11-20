import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'storage-compare',
  unit: 2,
  order: 2,
  title: 'Block·File·Object의 접근 방식',
  summary: '저장소의 형태와 요청 크기를 함께 비교합니다.',
  scenario:
    '서버 부팅용 디스크, 여러 Pod의 공유 폴더, 배포에 넘길 모델 파일에 알맞은 저장 방식을 골라 보세요. 세 방식에서 각각 블록 장치, 파일 경로, 객체 키로 데이터를 찾는 이유를 비교합니다.',
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
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
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
  activityView: {
    type: 'storage',
    title: '어떤 저장소가 어울릴까요?',
    instruction: '상황을 고르고 세 저장소의 접근 방법과 선택 이유를 비교하세요.',
  },
  practice: 'explore',
});
