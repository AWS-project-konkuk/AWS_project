# MDX 강의 작성

**본문은 `.mdx`, 제목·순서·실습 설정은 같은 이름의 `.lesson.ts`에 작성합니다.** 화면에서는 MDX에 적은 순서대로 글·그림·코드·활동을 표시합니다. 학습자가 문서 구조를 편집하는 기능은 제공하지 않습니다.

| 파일                    | 역할                                         |
| ----------------------- | -------------------------------------------- |
| `ec2-compute.mdx`       | 본문과 활동 배치                             |
| `ec2-compute.lesson.ts` | ID·단원·순서·이해 확인 문제·출처·실습 데이터 |
| `lessons/index.ts`      | 두 파일 연결과 자동 등록                     |
| `mdxIndexPlugin.ts`     | 검색용 본문 색인과 활동 표시 추출            |

## 먼저 열어볼 문서

- [강의 목록](lesson-index.md)
- [EC2 본문: 연습 문제와 해설](lessons/00-overview/ec2-compute.mdx)
- [이미지 예시](lessons/02-runtime/container-isolation.mdx)
- [코드와 노드 예제](lessons/04-reproducibility/dvc-restore.mdx)
- [본문 템플릿](templates/new-lesson.mdx) · [설정 템플릿](templates/new-lesson.ts)
- [문법과 실습 컴포넌트 안내](../../docs/content-authoring.md)

## 새 강의 만들기

1. 두 템플릿을 `lessons/`의 원하는 단원 폴더에 복사합니다.
2. 파일명을 `my-topic.mdx`, `my-topic.lesson.ts`로 맞추고 설정의 `id`도 `my-topic`으로 지정합니다.
3. 설정의 import 경로를 `../../defineLesson`으로 바꿉니다. 팩토리 이름은 `defineMdxLesson`입니다.
4. `unit`, `order`, `title`, `summary`, `assessment`를 작성합니다. 1단원 2번과 3번 사이에는 `unit: 1, order: 2.5`를 사용합니다.
5. MDX에 본문을 쓰고 `<Quiz />`를 배치합니다. 필요한 경우 `<NodeExample />`, `<Activity />` 등을 추가합니다.
6. 개발 서버에서 `/#/learn/my-topic`을 확인하고 `npm run build`, `npm test`를 실행합니다.

폴더는 문서 정리용이며 실제 단원·순서는 설정의 `unit`, `order`로 결정됩니다. 템플릿 폴더는 강의 목록에 등록되지 않습니다. 배포 사이트는 새 빌드·배포 후 갱신됩니다.

## 기존 데이터와의 관계

기존 53개 강의의 주소·ID와 저장 키는 유지합니다. `reading` 배열은 MDX에서 검색용으로 추출하므로 직접 작성하지 않습니다. 화면 순서는 MDX가 결정하며 `nodeExample.afterSection`은 MDX에서 사용하지 않습니다. 기존 설정에 남은 값은 이전 데이터 호환용입니다.

`advanced`는 `<AdvancedReadings />`로 표시합니다. `<LessonSummary>...</LessonSummary>`에는 MDX로 핵심 정리 본문을 작성합니다. 기존 빈 태그에서는 `caution`을 표시합니다. `reflection`은 `<Reflection />`, `references`는 `<References />`가 표시합니다. 본문에 이 태그를 넣지 않으면 해당 영역도 나오지 않습니다. 원한다면 심화 내용도 MDX에 직접 작성하고 `<Reveal>`로 감쌀 수 있습니다.

기존 활동의 `fields`, `nodes`, `flow`와 종합 실습의 `workflow`는 실행 모형의 설정입니다. 본문 수정 시 그대로 두세요. 실습 엔진의 실행 규칙은 기존 `src/activities/`, `src/weekly/`에서 관리합니다.

MDX는 프로젝트 작성자가 관리하는 코드입니다. 외부 방문자가 올린 MDX를 실행하는 기능은 제공하지 않습니다.

각 레슨에는 첫 문제 제기 직후의 도입 이미지와, 필요성·동작·활용을 연결한 핵심 정리를 작성합니다. [전체 편집표](../../docs/lesson-editorial.md)와 [작성 기준](../../docs/content-authoring.md)을 참고하세요.
