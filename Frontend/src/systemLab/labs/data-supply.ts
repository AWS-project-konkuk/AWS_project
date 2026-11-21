import { GPU_BATCH_CAPACITY, SUPPLY_TARGET } from './catalog/data';
import { datum, need, port, wired } from './kit';
import { defineWorkflowLab } from './workflow';

export const dataSupplyLab = defineWorkflowLab({
  id: 'week3-workflow',
  kinds: ['storage', 'ec2', 'readObjects', 'prepareBatch', 'train', 'saveModel'],
  tools: { storage: ['readObjects', 'saveModel'], ec2: ['prepareBatch', 'train'] },
  start: {
    label: '시작',
    ports: [port('out', 'objects', 'objects'), port('out', 'job', 'job')],
    run: ({ emit }) => {
      const sampleIds = Array.from({ length: 1000 }, (_, index) => index + 1);
      emit(datum('objects', 'train-v1 · 이미지 객체 1,000개', { key: 'train-v1', sampleIds }));
      emit(datum('job', 'GPU 학습 요청', { gib: 8 }));
      return '원본 객체 목록과 GPU 학습 요청을 보냈습니다.';
    },
  },
  end: {
    label: '도착',
    ports: [port('in', 'saved-model', 'saved-model')],
    run: (ctx) => {
      const model = need(ctx, 'saved-model', '저장소에 저장한 모델').data;
      const batches = Number(model.batches);
      if (!Number.isFinite(batches) || model.sourceKey === undefined)
        throw new Error('원본 읽기와 배치 준비를 거친 학습 결과를 저장소에 저장하세요.');
      const waiting = Math.max(0, GPU_BATCH_CAPACITY - batches);
      ctx.report([
        { label: 'GPU 공급량', value: batches + '배치/초' },
        { label: 'GPU 데이터 대기율', value: waiting + '%' },
        { label: 'Pod 교체 후 캐시', value: String(model.cacheState) },
        { label: '원본 / 저장된 모델', value: model.sourceKey + ' / ' + model.key },
      ]);
      if (batches === 30 && model.cacheState === '미사용') ctx.observe('slow-supply');
      if (model.cacheState === '손실') ctx.observe('cache-lost');
      if (batches < SUPPLY_TARGET)
        throw new Error(
          'GPU 공급이 ' + batches + '배치/초로 목표 ' + SUPPLY_TARGET + '배치/초에 미달합니다.',
        );
      if (model.cacheState !== '보존') throw new Error('Pod 교체 뒤에도 캐시가 유지되어야 합니다.');
      ctx.observe('supply-ready');
      return 'GPU 공급 목표를 충족했고, 캐시와 저장소 모델을 확인했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 130 }),
      system('storage', 'storage', 'root', { x: 300, y: 0 }, 244, 345),
      node('readObjects', 'read', 'storage', { x: 24, y: 54 }),
      node('saveModel', 'save', 'storage', { x: 24, y: 218 }),
      system('ec2', 'ec2', 'root', { x: 640, y: 0 }, 244, 345),
      node('prepareBatch', 'batch', 'ec2', { x: 24, y: 54 }),
      node('train', 'train', 'ec2', { x: 24, y: 218 }),
      node('end', 'end', 'root', { x: 982, y: 200 }),
    ],
    connections: [
      wired('start', 'objects', 'read', 'objects'),
      wired('start', 'job', 'batch', 'job'),
    ],
  }),
  starterTasks: [
    wired('read', 'dataset', 'batch', 'dataset'),
    wired('batch', 'job', 'train', 'job'),
    wired('train', 'result', 'save', 'checkpoint'),
    wired('save', 'saved-model', 'end', 'saved-model'),
  ],
  required: ['read', 'batch', 'train', 'save'],
  observations: {
    'slow-supply': '기본 공급 30배치/초에서 GPU 대기 확인',
    'cache-lost': '임시 저장의 캐시가 Pod 교체 뒤 손실되는 실행',
    'supply-ready': '유지 볼륨과 파일 묶음 읽기로 공급 개선',
  },
});
