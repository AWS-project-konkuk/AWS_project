import { rootId, type Graph, type LabConfig } from '../../lab';
import { fromCatalog } from '../catalog';
import { datum, defineLab, layout, need, port, wired } from '../kit';

/** 3단원 종합 · 과거 실험 재현. 공통 GitHub·저장소·EC2 노드로 코드와 데이터를 같은 버전으로 되돌린다. */
export const reproduceLessonId = 'week4-workflow';
const TARGET = 'v1';

const common = fromCatalog({
  kinds: ['root', 'github', 'storage', 'ec2', 'repo', 'file', 'restore', 'train'],
  tools: { github: ['repo'], storage: ['file'], ec2: ['train', 'restore'] },
  custom: {
    start: {
      label: '시작',
      ports: [port('out', 'workdata', 'workdata')],
      run: ({ emit }) => {
        emit(datum('workdata', '작업 데이터 v2', { version: 'v2' }));
        return '현재 작업 폴더의 데이터 v2를 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [port('in', 'restored', 'restored')],
      run: (ctx) => {
        const result = need(ctx, 'restored', '복원 결과').data;
        const code = String(result.codeVersion);
        const data = String(result.dataVersion);
        const source = String(result.source);
        ctx.report([
          { label: '코드 버전', value: code },
          { label: '작업 데이터 버전', value: data },
          {
            label: '데이터 출처',
            value:
              source === 'cache'
                ? '로컬 캐시'
                : source === 'remote'
                  ? '원격 다운로드'
                  : '기존 작업 폴더',
          },
        ]);
        if (code !== data) {
          ctx.observe('git-mismatch');
          throw new Error(
            '코드는 ' +
              code +
              '인데 작업 데이터는 ' +
              data +
              '입니다. 버전이 달라 지난 실험을 재현할 수 없습니다.',
          );
        }
        if (code !== TARGET)
          throw new Error('재현할 실험은 ' + TARGET + '인데 ' + code + '로 복원됐습니다.');
        ctx.observe(source === 'remote' ? 'remote-restore' : 'cache-restore');
        return source === 'remote'
          ? '코드와 데이터가 모두 ' + TARGET + '입니다. 원격에서 가져와 복원했습니다.'
          : '코드와 데이터가 모두 ' + TARGET + '입니다. 원격 읽기 없이 캐시로 복원했습니다.';
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
      system('github', 'github', rootId, { x: 300, y: 0 }, 260, 150),
      node('repo', 'repo', 'github', { x: 24, y: 52 }),
      system('storage', 'storage', rootId, { x: 300, y: 190 }, 260, 150),
      node('file', 'file', 'storage', { x: 24, y: 52 }),
      system('ec2', 'ec2', rootId, { x: 660, y: 70 }, 260, 210),
      node('restore', 'restore', 'ec2', { x: 24, y: 52 }),
      node('end', 'end', rootId, { x: 1000, y: 160 }),
    ],
    connections: [],
  };
}

export const reproduceLab: LabConfig = defineLab({
  ...common,
  id: reproduceLessonId,
  storageKey: 'blockml:system-lab:week4-workflow:v2',
  initial: () => initial(reproduceLab),
  starterTasks: [
    wired('repo', 'code', 'restore', 'code'),
    wired('start', 'workdata', 'restore', 'workdata'),
    wired('file', 'file', 'restore', 'file'),
    wired('restore', 'restored', 'end', 'restored'),
  ],
  requiredNodeIds: new Set(['start', 'repo', 'file', 'restore', 'end']),
  requiredObservations: ['git-mismatch', 'remote-restore', 'cache-restore'],
  observationLabels: {
    'git-mismatch': 'Git만 이동한 실행의 버전 불일치',
    'remote-restore': '캐시가 없어 원격에서 가져온 복원',
    'cache-restore': '캐시 적중으로 원격 읽기 없이 복원',
  },
});
