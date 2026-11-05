import { defineMdxLesson } from '../defineLesson';

// 이 설정 파일과 new-lesson.mdx를 함께 복사하세요. 템플릿은 목록에 노출되지 않습니다.
// lessons/의 원하는 단원 폴더로 복사한 뒤 파일명과 id를 함께 바꾸세요.
// 그 위치에서는 위 import 경로를 ../../defineLesson으로 수정하세요.
export default defineMdxLesson({
  id: 'my-first-lesson',
  unit: 1,
  order: 99,
  title: '내가 작성한 첫 강의',
  summary: '이 강의에서 무엇을 이해할 수 있는지 한 문장으로 씁니다.',
  assessment: {
    question: '위 코드의 실행 결과는 무엇인가요?',
    options: ['나의 첫 강의', 'message'],
    correct: 0,
    explanation: 'print는 message라는 변수 이름이 아니라 변수에 담긴 문자열을 출력합니다.',
  },
});
