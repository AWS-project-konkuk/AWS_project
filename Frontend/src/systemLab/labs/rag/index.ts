import { rootId, type Graph, type LabConfig } from '../../lab';
import { fromCatalog } from '../catalog';
import { datum, defineLab, layout, need, port, wired } from '../kit';

/** 6단원 종합 · 문서 준비와 질문 응답. 임베딩은 EC2, 색인·검색은 저장소, API는 Gateway의 공통 노드이다. */
export const ragLessonId = 'rag-workflow';
const DOCUMENTS = [
  { id: 'doc-return', text: '수령 7일 이내 미사용 상품은 반품할 수 있습니다.' },
  { id: 'doc-weather', text: '내일은 전국에 비가 올 예정입니다.' },
];
const QUESTION = '구매한 상품을 반품할 수 있나요?';

const common = fromCatalog({
  kinds: ['root', 'ec2', 'storage', 'gateway', 'embed', 'index', 'search', 'api'],
  tools: { ec2: ['embed'], storage: ['index', 'search'], gateway: ['api'] },
  custom: {
    start: {
      label: '시작',
      ports: [
        port('out', 'document', 'text', false, '문서'),
        port('out', 'question', 'text', false, '질문'),
      ],
      run: ({ emit }) => {
        emit(
          datum('text', '원본 문서 ' + DOCUMENTS.length + '건', {
            kind: 'document',
            documents: DOCUMENTS,
          }),
          'out-document',
        );
        emit(
          datum('text', '질문: ' + QUESTION, { kind: 'question', text: QUESTION }),
          'out-question',
        );
        return '원본 문서 ' + DOCUMENTS.length + '건과 반품 질문을 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [port('in', 'answer', 'answer')],
      run: (ctx) => {
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
    },
  },
});

function initial(lab: LabConfig): Graph {
  const { system, node } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      node('start', 'start', rootId, { x: 0, y: 130 }),
      system('ec2', 'ec2', rootId, { x: 300, y: 0 }, 260, 150),
      node(
        'embed',
        'doc-embed',
        'ec2',
        { x: 24, y: 52 },
        { name: '문서 임베딩', settings: { space: 'A' } },
      ),
      system('storage', 'storage', rootId, { x: 640, y: 0 }, 260, 150),
      node('index', 'index', 'storage', { x: 24, y: 52 }),
      system('gateway', 'gateway', rootId, { x: 980, y: 40 }, 260, 150),
      node('api', 'api', 'gateway', { x: 24, y: 52 }),
      node('end', 'end', rootId, { x: 1320, y: 100 }),
    ],
    connections: [
      wired('start', 'document', 'doc-embed', 'text'),
      wired('doc-embed', 'vector', 'index', 'vector'),
      wired('api', 'answer', 'end', 'answer'),
    ],
  };
}

export const ragLab: LabConfig = defineLab({
  ...common,
  id: ragLessonId,
  storageKey: 'blockml:system-lab:rag-workflow:v2',
  initial: () => initial(ragLab),
  starterTasks: [
    wired('start', 'document', 'doc-embed', 'text'),
    wired('doc-embed', 'vector', 'index', 'vector'),
    wired('api', 'answer', 'end', 'answer'),
  ],
  requiredNodeIds: new Set(['start', 'doc-embed', 'index', 'api', 'end']),
  requiredObservations: ['space-mismatch', 'grounded-answer'],
  observationLabels: {
    'space-mismatch': '다른 임베딩 공간에서 검색이 차단되는 실행',
    'grounded-answer': '근거 ID가 붙은 답변의 도착',
  },
});
