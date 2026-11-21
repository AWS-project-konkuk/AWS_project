import { datum, plainPersistence, port, received, wired } from './kit';
import { defineWorkflowLab } from './workflow';

export const featuresLab = {
  ...defineWorkflowLab({
    id: 'feature-workflow',
    kinds: ['featureStore', 'defineFeature', 'lookupFeature'],
    tools: { featureStore: ['defineFeature', 'lookupFeature'] },
    start: {
      label: '시작',
      ports: [
        port('out', 'events', 'click-events'),
        port('out', 'train', 'feature-query', false, '학습 기준 시각'),
        port('out', 'serve', 'feature-query', false, '현재 조회 요청'),
      ],
      run: ({ emit }) => {
        const clickMinutes = [420, 490, 520, 560, 595, 600, 640, 665];
        const cutoff = 600;
        const now = 675;
        emit(datum('click-events', '고객 A의 클릭 8회', { clickMinutes }));
        emit(
          datum('feature-query', '학습 기준 10:00', { role: 'train', cutoff, now }),
          'out-train',
        );
        emit(
          datum('feature-query', '현재 시각 11:15', { role: 'serve', cutoff, now }),
          'out-serve',
        );
        return '클릭 이력, 학습 기준 10:00, 현재 조회 시각 11:15를 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [
        port('in', 'train', 'feature-value', false, '학습 피처'),
        port('in', 'serve', 'feature-value', false, '추론 피처'),
      ],
      run: (ctx) => {
        const train = received(ctx.byPort['in-train'] ?? [], 'feature-value')[0]?.data;
        const serve = received(ctx.byPort['in-serve'] ?? [], 'feature-value')[0]?.data;
        ctx.report([
          { label: '학습 피처', value: train ? String(train.value) : '미도착' },
          { label: '추론 피처', value: serve ? String(serve.value) : '미도착' },
          { label: '학습 기준 이후 클릭', value: train ? String(train.future) + '회' : '미도착' },
        ]);
        if (train?.role !== 'train')
          throw new Error('학습 기준 시각을 받은 조회를 학습 피처에 연결하세요.');
        if (serve?.role !== 'serve')
          throw new Error(
            '추론 피처가 도착하지 않았습니다. 조회를 추가해 현재 조회 요청을 연결하세요.',
          );
        if (train.definition !== serve.definition)
          throw new Error('학습과 추론이 같은 공통 피처 정의를 받도록 연결하세요.');
        if (train.basis !== 'cutoff' || train.future !== 0)
          throw new Error(
            '학습 피처에 기준 시각 이후 클릭이 섞였습니다. 학습 기준 시각을 사용하세요.',
          );
        if (serve.basis !== 'now')
          throw new Error('추론 피처를 만드는 조회의 기준을 현재 시각으로 설정하세요.');
        return '같은 집계 정의를 사용하고 학습 기준 시각 이후의 클릭을 제외했습니다.';
      },
    },
    initial: ({ system, node }) => ({
      entities: [
        node('start', 'start', 'root', { x: 0, y: 105 }),
        system('featureStore', 'feature-store', 'root', { x: 290, y: 0 }, 540, 390),
        node('defineFeature', 'definition', 'feature-store', { x: 24, y: 54 }),
        node(
          'lookupFeature',
          'history',
          'feature-store',
          { x: 315, y: 54 },
          {
            settings: { asOf: 'cutoff' },
          },
        ),
        node('end', 'end', 'root', { x: 935, y: 140 }),
      ],
      connections: [
        wired('start', 'events', 'definition', 'events'),
        wired('start', 'train', 'history', 'query'),
        wired('definition', 'definition', 'history', 'definition'),
      ],
    }),
    starterTasks: [wired('history', 'feature', 'end', 'train')],
    required: ['definition', 'history'],
    observations: {},
  }),
  toolPosition: (index: number) =>
    index === 2 ? { x: 315, y: 215 } : { x: 24, y: 52 + index * 150 },
  persistence: {
    ...plainPersistence,
    readEntity: (item: Record<string, unknown>) =>
      item.kind === 'historicalFeature' || item.kind === 'latestFeature'
        ? { ...item, kind: 'lookupFeature' }
        : item,
  },
};
