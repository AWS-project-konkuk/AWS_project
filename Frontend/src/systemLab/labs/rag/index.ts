import type { Strategy } from '../../engine';
import { rootId, type Graph, type LabConfig } from '../../lab';
import { datum, defineLab, layout, need, port, setting, wired } from '../kit';

/** 6단원 종합 · 문서 준비와 질문 응답. 문서 경로와 질문 경로가 같은 임베딩 공간에서 만난다. */
export const ragLessonId = 'rag-workflow';
const DOCUMENTS = [
  { id: 'doc-return', text: '수령 7일 이내 미사용 상품은 반품할 수 있습니다.' },
  { id: 'doc-weather', text: '내일은 전국에 비가 올 예정입니다.' },
];
const QUESTION = '구매한 상품을 반품할 수 있나요?';

const strategies: Record<string, Strategy> = {
  start: ({ emit }) => {
    emit(
      datum('document', '원본 문서 ' + DOCUMENTS.length + '건', { documents: DOCUMENTS }),
      'out-document',
    );
    emit(datum('question', '질문: ' + QUESTION, { text: QUESTION }), 'out-question');
    return '원본 문서 ' + DOCUMENTS.length + '건과 반품 질문을 보냈습니다.';
  },
  'doc-embed': (ctx) => {
    const docs = need(ctx, 'document').data.documents as typeof DOCUMENTS;
    const space = String(setting(ctx.node, 'space'));
    const chunk = String(setting(ctx.node, 'chunk'));
    const chunks = docs.length * (chunk === 'sentence' ? 2 : 1);
    ctx.emit(
      datum('docvec', '공간 ' + space + ' · 문서 벡터 ' + chunks + '개', {
        space,
        chunks,
        documents: docs,
      }),
    );
    return (
      '문서를 ' +
      (chunk === 'sentence' ? '문장' : '문단') +
      ' 단위로 나눠 공간 ' +
      space +
      '의 벡터 ' +
      chunks +
      '개로 바꿨습니다.'
    );
  },
  'query-embed': (ctx) => {
    const text = String(need(ctx, 'question').data.text);
    const space = String(setting(ctx.node, 'space'));
    ctx.emit(datum('qvec', '공간 ' + space + ' · 질문 벡터', { space, text }));
    return '질문을 공간 ' + space + '의 벡터로 바꿨습니다.';
  },
  index: (ctx) => {
    const vectors = need(ctx, 'docvec').data;
    ctx.emit(
      datum('index', '공간 ' + vectors.space + ' 색인 · 벡터 ' + vectors.chunks + '개', {
        ...vectors,
      }),
    );
    return '문서 벡터 ' + vectors.chunks + '개를 색인에 저장했습니다.';
  },
  search: (ctx) => {
    const index = need(ctx, 'index', '색인').data;
    const query = need(ctx, 'qvec', '질문 벡터').data;
    if (index.space !== query.space) {
      ctx.observe('space-mismatch');
      throw new Error(
        '질문은 공간 ' +
          query.space +
          '이고 색인은 공간 ' +
          index.space +
          '입니다. 서로 다른 공간의 벡터는 거리를 비교할 수 없어 검색을 차단했습니다.',
      );
    }
    const documents = index.documents as typeof DOCUMENTS;
    const best = documents.find((doc) => doc.id === 'doc-return') ?? documents[0];
    ctx.emit(datum('evidence', '근거 ' + best.id, { ids: [best.id], text: best.text }));
    return '같은 공간에서 가장 가까운 문서 ' + best.id + '를 찾았습니다.';
  },
  answer: (ctx) => {
    const evidence = need(ctx, 'evidence', '근거 문서').data;
    const question = need(ctx, 'question', '질문').data;
    const ids = evidence.ids as string[];
    ctx.emit(
      datum('answer', '근거 ' + ids.join(', ') + '가 붙은 답변', {
        ids,
        text: String(evidence.text) + ' [' + ids.join(', ') + ']',
        question: question.text,
      }),
    );
    return (
      '질문과 근거 ' +
      ids.join(', ') +
      '로 프롬프트를 만들어 답변했습니다. (고정 응답, 실제 LLM 호출 없음)'
    );
  },
  end: (ctx) => {
    const answer = need(ctx, 'answer', '답변').data;
    const ids = answer.ids as string[];
    ctx.report([
      { label: '근거 문서 ID', value: ids.join(', ') },
      { label: '답변', value: String(answer.text) },
    ]);
    if (!ids.includes('doc-return'))
      throw new Error('반품 질문의 근거로 반품 정책 문서가 전달되지 않았습니다.');
    ctx.observe('grounded-answer');
    return '반품 정책 ' + ids.join(', ') + ' 근거가 붙은 답변이 도착했습니다.';
  },
};

const labels = {
  root: '전체 서비스',
  embedding: '임베딩',
  vectordb: 'Vector DB',
  rag: 'RAG API',
  start: '시작',
  end: '도착',
  'doc-embed': '문서 변환',
  'query-embed': '질문 변환',
  index: '색인',
  search: '검색',
  answer: '답변 생성',
};

function initial(lab: LabConfig): Graph {
  const { system, node } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      node('start', 'start', rootId, { x: 0, y: 150 }),
      system('embedding', 'embedding', rootId, { x: 300, y: 0 }, 260, 260),
      node('doc-embed', 'doc-embed', 'embedding', { x: 24, y: 52 }),
      node(
        'query-embed',
        'query-embed',
        'embedding',
        { x: 24, y: 150 },
        { settings: { space: 'B' } },
      ),
      system('vectordb', 'vectordb', rootId, { x: 640, y: 0 }, 260, 260),
      node('index', 'index', 'vectordb', { x: 24, y: 52 }),
      node('search', 'search', 'vectordb', { x: 24, y: 150 }),
      system('rag', 'rag', rootId, { x: 980, y: 80 }, 260, 150),
      node('answer', 'answer', 'rag', { x: 24, y: 52 }),
      node('end', 'end', rootId, { x: 1320, y: 150 }),
    ],
    connections: [
      wired('start', 'document', 'doc-embed', 'document'),
      wired('doc-embed', 'docvec', 'index', 'docvec'),
      wired('answer', 'answer', 'end', 'answer'),
    ],
  };
}

const space = {
  key: 'space',
  label: '임베딩 공간',
  type: 'choice',
  options: [
    { value: 'A', label: '모델 A 공간' },
    { value: 'B', label: '모델 B 공간' },
  ],
  help: '색인과 질문은 같은 공간의 벡터여야 거리를 비교할 수 있습니다.',
} as const;

export const ragLab: LabConfig = defineLab({
  id: ragLessonId,
  storageKey: 'blockml:system-lab:rag-workflow:v1',
  labels,
  materials: {
    document: '원본 문서',
    question: '질문',
    docvec: '문서 벡터',
    qvec: '질문 벡터',
    index: '색인',
    evidence: '근거 문서',
    answer: '답변',
  },
  tools: {
    root: ['embedding', 'vectordb', 'rag'],
    embedding: ['doc-embed', 'query-embed'],
    vectordb: ['index', 'search'],
    rag: ['answer'],
  },
  portTypes: {
    root: { in: [], out: [] },
    embedding: { in: [], out: [] },
    vectordb: { in: [], out: [] },
    rag: { in: [], out: [] },
    start: { in: [], out: ['document', 'question'] },
    end: { in: ['answer'], out: [] },
    'doc-embed': { in: ['document'], out: ['docvec'] },
    'query-embed': { in: ['question'], out: ['qvec'] },
    index: { in: ['docvec'], out: ['index'] },
    search: { in: ['index', 'qvec'], out: ['evidence'] },
    answer: { in: ['evidence', 'question'], out: ['answer'] },
  },
  runStateKinds: [
    'embedding',
    'vectordb',
    'rag',
    'doc-embed',
    'query-embed',
    'index',
    'search',
    'answer',
  ],
  managedPorts: {
    start: ['document', 'question'],
    end: ['answer'],
    'doc-embed': ['document', 'docvec'],
    'query-embed': ['question', 'qvec'],
    index: ['docvec', 'index'],
    search: ['index', 'qvec', 'evidence'],
    answer: ['evidence', 'question', 'answer'],
  },
  resourceDefaults: (kind) => {
    const ports = {
      start: [port('out', 'document', 'document'), port('out', 'question', 'question')],
      end: [port('in', 'answer', 'answer')],
      'doc-embed': [port('in', 'document', 'document'), port('out', 'docvec', 'docvec')],
      'query-embed': [port('in', 'question', 'question'), port('out', 'qvec', 'qvec')],
      index: [port('in', 'docvec', 'docvec'), port('out', 'index', 'index')],
      search: [
        port('in', 'index', 'index'),
        port('in', 'qvec', 'qvec'),
        port('out', 'evidence', 'evidence'),
      ],
      answer: [
        port('in', 'evidence', 'evidence'),
        port('in', 'question', 'question'),
        port('out', 'answer', 'answer'),
      ],
    }[kind as 'start'];
    return ports ? { ports } : {};
  },
  settingSpecs: {
    'doc-embed': [
      { ...space, initial: 'A' },
      {
        key: 'chunk',
        label: '청킹 단위',
        type: 'choice',
        initial: 'paragraph',
        options: [
          { value: 'paragraph', label: '문단' },
          { value: 'sentence', label: '문장' },
        ],
        help: '문서를 나누는 단위입니다. 단위가 작을수록 벡터 수가 늘어납니다.',
      },
    ],
    'query-embed': [{ ...space, initial: 'A' }],
  },
  initial() {
    return initial(ragLab);
  },
  starterTasks: [
    wired('start', 'document', 'doc-embed', 'document'),
    wired('doc-embed', 'docvec', 'index', 'docvec'),
    wired('start', 'question', 'query-embed', 'question'),
    wired('index', 'index', 'search', 'index'),
    wired('query-embed', 'qvec', 'search', 'qvec'),
    wired('search', 'evidence', 'answer', 'evidence'),
    wired('start', 'question', 'answer', 'question'),
    wired('answer', 'answer', 'end', 'answer'),
  ],
  requiredNodeIds: new Set([
    'start',
    'doc-embed',
    'query-embed',
    'index',
    'search',
    'answer',
    'end',
  ]),
  strategies,
  requiredObservations: ['space-mismatch', 'grounded-answer'],
  observationLabels: {
    'space-mismatch': '다른 임베딩 공간에서 검색이 차단되는 실행',
    'grounded-answer': '근거 ID가 붙은 답변의 도착',
  },
});
