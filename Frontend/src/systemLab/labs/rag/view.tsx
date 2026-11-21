import {
  Bot,
  CircleCheck,
  CirclePlay,
  Database,
  FileText,
  Layers,
  MessageCircleQuestion,
  Search,
  Sparkles,
  Vault,
  Waypoints,
} from 'lucide-react';
import type { LabView } from '../../labContext';
import { kindClass, tone } from '../palette';

export const ragView: LabView = {
  title: '문서 준비와 질문 응답 실습',
  description:
    '문서 경로와 질문 경로를 만들어 근거가 붙은 답변을 받으세요. 먼저 임베딩 공간이 다를 때 검색이 막히는 것을 확인한 뒤 공간을 맞춥니다.',
  ariaLabel: 'RAG 시스템 실습',
  entry:
    '문서 경로와 질문 경로를 연결하고, 임베딩 공간이 다를 때 검색이 막히는 것을 확인한 뒤 근거가 붙은 답변을 받으세요.',
  icons: {
    root: Layers,
    embedding: Waypoints,
    vectordb: Database,
    rag: Bot,
    start: CirclePlay,
    end: CircleCheck,
    'doc-embed': FileText,
    'query-embed': MessageCircleQuestion,
    index: Vault,
    search: Search,
    answer: Sparkles,
  },
  materialIcons: {
    document: FileText,
    question: MessageCircleQuestion,
    docvec: Waypoints,
    qvec: Waypoints,
    index: Vault,
    evidence: Search,
    answer: Sparkles,
  },
  tones: {
    document: tone.orange,
    question: tone.blue,
    docvec: tone.purple,
    qvec: tone.teal,
    index: tone.gold,
    evidence: tone.olive,
    answer: tone.green,
  },
  kindColors: {
    embedding: kindClass.purple,
    vectordb: kindClass.gold,
    rag: kindClass.pink,
    start: kindClass.green,
    end: kindClass.slate,
    'doc-embed': kindClass.purple,
    'query-embed': kindClass.indigo,
    index: kindClass.gold,
    search: kindClass.olive,
    answer: kindClass.pink,
  },
  hints: {
    root: '서비스를 선택하면 아래에서 만들 수 있는 작업 노드를 볼 수 있습니다.',
    embedding: '문서와 질문을 벡터로 바꾸는 서비스입니다.',
    vectordb: '문서 벡터를 색인으로 저장하고 질문 벡터와 가까운 문서를 검색합니다.',
    rag: '검색한 근거를 질문과 함께 모아 답변을 만드는 서비스입니다.',
    start: '원본 문서와 반품 질문을 각각의 출력으로 제공합니다.',
    end: '근거 문서 ID가 붙은 답변이 도착했는지 확인합니다.',
    'doc-embed':
      '문서를 나누고 선택한 임베딩 공간의 벡터로 바꿉니다. 청킹 단위는 이 노드의 설정입니다.',
    'query-embed': '질문을 선택한 임베딩 공간의 벡터로 바꿉니다.',
    index: '문서 벡터를 저장해 검색에 넘길 색인을 만듭니다.',
    search: '색인과 질문 벡터를 받아 가까운 문서를 찾습니다. 두 벡터의 공간이 다르면 차단됩니다.',
    answer:
      '검색 근거와 질문을 하나의 프롬프트로 모아 답변합니다. 실제 LLM은 호출하지 않는 고정 응답입니다.',
  },
  panels: {
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
};
