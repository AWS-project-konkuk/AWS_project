import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'intro-workflow',
  unit: 0,
  order: 5,
  title: '첫 노드 실습 · EC2에서 리뷰 수 세기',
  summary: 'Git의 코드와 저장소의 데이터를 EC2에 전달하는 기본 작업을 실행합니다.',
  scenario: '코드가 있는 곳과 파일이 있는 곳을 찾아 실행 노드에 선 두 개를 연결하세요.',
  minutes: 5,
  concepts: ['Git 코드', '저장소 파일', 'EC2 실행'],
  assessment: {
    question: '저장소에 있는 reviews.csv의 리뷰 수를 코드로 실제로 센 곳은 어디인가요?',
    options: ['Git 저장소', 'EC2', '파일을 보관한 저장소', '도착 노드'],
    correct: 1,
    explanation:
      'Git은 코드를 제공하고, 저장소는 파일을 보관합니다. EC2에서 코드를 실행해 파일을 처리합니다.',
  },
  references: [
    {
      title: 'Amazon EC2 · 인스턴스',
      url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html',
    },
    {
      title: 'Amazon S3 · 객체 저장소',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
    },
  ],
  mapStages: ['data', 'training'],
});
