import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'git-basics',
  unit: 0,
  order: 4,
  title: 'Git으로 코드의 버전 기록하기',
  summary: 'Git 저장소가 코드의 변경 이력을 어떻게 기록하는지 살펴봅니다.',
  scenario:
    '어제 실행한 코드를 다시 찾을 때 파일 이름과 커밋 ID 중 어느 정보를 기록해야 하는지 확인하세요.',
  minutes: 4,
  concepts: ['Git 저장소', '커밋', '코드 버전'],
  assessment: {
    question: '다음 실행에서 같은 버전의 코드를 사용하려면 무엇을 기록해야 할까요?',
    options: ['코드를 실행한 EC2의 이름', '실행한 코드의 Git 커밋 ID'],
    correct: 1,
    explanation: '커밋 ID로 Git 저장소의 특정 시점에 기록된 코드를 찾을 수 있습니다.',
  },
  references: [
    {
      title: 'Pro Git · Git이란 무엇인가?',
      url: 'https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F',
    },
    {
      title: 'Pro Git · 저장소에 변경 기록하기',
      url: 'https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository',
    },
  ],
  mapStages: ['training'],
});
