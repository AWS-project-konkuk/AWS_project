import { viewFrom } from '../catalog/view';

export const reproduceView = viewFrom({
  title: '과거 실험 재현 실습',
  description:
    '코드와 데이터를 모두 `v1`으로 되돌리세요. 노드를 연결하고 설정을 바꿔 `Git 이동만`, `캐시 복원`, `원격 복원`의 결과를 비교하세요.',
  ariaLabel: '과거 실험 재현 시스템 실습',
  entry:
    '코드 저장소와 파일, 작업 데이터를 복원 노드에 연결하고, Git만 이동한 실행·캐시 복원·원격 복원의 결과를 비교하세요.',
  hints: {
    start: '현재 작업 폴더에 남아 있는 데이터 v2를 내보냅니다.',
    end: '복원된 코드와 작업 데이터의 버전이 모두 v1인지 검사합니다.',
  },
  panels: {
    start: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>제공 데이터</h4>
        <ol>
          <li>
            <strong>작업 데이터 출력</strong> · 지금 작업 폴더에 있는 데이터 <code>v2</code>를
            제공합니다. 복원 노드에 연결하세요.
          </li>
        </ol>
      </section>
    ),
    end: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>복원 결과 입력 · 완료 조건</h4>
        <ol>
          <li>
            재현할 실험은 <code>v1</code>입니다. 코드와 작업 데이터가 모두 v1이어야 합니다.
          </li>
          <li>코드는 커밋으로, 데이터는 파일의 데이터 버전이나 캐시 복원으로 v1에 맞춰야 합니다.</li>
          <li>캐시를 쓴 복원은 원격 읽기 없이 완료되어야 합니다.</li>
        </ol>
        <p>실행 성공 뒤 결과 패널의 이해 확인과 남은 관찰을 완료하세요.</p>
      </section>
    ),
  },
});
