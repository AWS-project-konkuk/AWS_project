import { viewFrom } from '../catalog/view';

export const ragView = viewFrom({
  title: '문서 준비와 질문 응답 실습',
  description:
    '문서 경로와 질문 경로를 연결하세요. 두 `임베딩 공간`이 다를 때 검색이 막히는 것을 확인하고, 같은 공간에서 `근거 문서 ID`가 붙은 답변을 받으세요.',
  ariaLabel: 'RAG 시스템 실습',
  entry:
    '질문 임베딩과 검색을 만들어 질문 경로를 완성하고, 임베딩 공간이 다를 때 검색이 막히는 것을 확인한 뒤 근거가 붙은 답변을 받으세요.',
  hints: {
    start: '원본 문서와 반품 질문을 각각의 출력으로 내보냅니다. 둘 다 텍스트입니다.',
    end: '근거 문서 ID가 붙은 답변이 도착했는지 확인합니다.',
  },
  panels: {
    start: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>제공 데이터</h4>
        <ol>
          <li>
            <strong>문서 출력</strong> · 원본 문서 2건(반품 정책, 날씨)을 보냅니다.
          </li>
          <li>
            <strong>질문 출력</strong> · 반품 질문을 보냅니다. 질문은 검색과 답변 두 곳에서
            필요합니다.
          </li>
        </ol>
      </section>
    ),
    end: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>답변 입력 · 완료 조건</h4>
        <ol>
          <li>임베딩 공간이 다를 때 검색이 차단되는 실행을 먼저 관찰합니다.</li>
          <li>색인과 질문을 같은 공간으로 맞춥니다.</li>
          <li>반품 정책 문서 ID가 근거로 붙은 답변이 도착해야 합니다.</li>
        </ol>
        <p>실행 성공 뒤 결과 패널의 이해 확인과 남은 관찰을 완료하세요.</p>
      </section>
    ),
  },
});
