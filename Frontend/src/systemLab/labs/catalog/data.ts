import type { StepContext } from '../../engine';
import type { CatalogKind } from '.';
import { choice, datum, need, numbers, parentOf, port, setting } from '../kit';

export const GPU_BATCH_CAPACITY = 100;
export const SUPPLY_TARGET = 80;

function requireObjectStorage({ graph, node }: StepContext) {
  if (parentOf(graph, node)?.settings?.type !== 'object')
    throw new Error('저장소 유형을 객체 저장소(S3)로 맞추세요.');
}

export const dataKinds = {
  readObjects: {
    label: '원본 읽기',
    ports: [port('in', 'objects', 'objects'), port('out', 'dataset', 'dataset')],
    run: (ctx) => {
      requireObjectStorage(ctx);
      const objects = need(ctx, 'objects').data;
      const sampleIds = numbers(objects, 'sampleIds');
      ctx.emit(
        datum('dataset', String(objects.key) + ' · 표본 ' + sampleIds.length + '개', objects),
      );
      return '저장소에서 목록이 가리키는 원본을 읽었습니다.';
    },
  },
  prepareBatch: {
    label: '배치 준비',
    ports: [port('in', 'dataset', 'dataset'), port('in', 'job', 'job'), port('out', 'job', 'job')],
    settings: [
      choice('cache', '반복 읽기 캐시', 'off', [
        ['off', '사용 안 함'],
        ['on', '사용'],
      ]),
      choice('shard', '작은 파일 읽기', 'off', [
        ['off', '개별 읽기'],
        ['on', '파일 묶음 읽기'],
      ]),
      choice('storage', '캐시 보관 경로', 'temporary', [
        ['temporary', 'Pod 임시 저장'],
        ['persistent', '유지 볼륨'],
      ]),
    ],
    run: (ctx) => {
      const dataset = need(ctx, 'dataset').data;
      const job = need(ctx, 'job').data;
      const cache = setting(ctx.node, 'cache') === 'on';
      const sharded = setting(ctx.node, 'shard') === 'on';
      const retained = cache && setting(ctx.node, 'storage') === 'persistent';
      const cacheState = retained ? '보존' : cache ? '손실' : '미사용';
      const batches = 30 * (retained ? 2 : 1) * (sharded ? 2 : 1);
      ctx.emit(
        datum('job', batches + '배치/초 · 교체 후 캐시 ' + cacheState, {
          ...job,
          key: dataset.key,
          samples: numbers(dataset, 'sampleIds').length,
          batches,
          cacheState,
        }),
      );
      return 'Pod 교체 후 캐시 ' + cacheState + ' · 데이터 공급 ' + batches + '배치/초';
    },
  },
  saveModel: {
    label: '모델 저장',
    ports: [port('in', 'checkpoint', 'checkpoint'), port('out', 'saved-model', 'saved-model')],
    run: (ctx) => {
      requireObjectStorage(ctx);
      const model = need(ctx, 'checkpoint').data;
      const key = 'models/model-v1.bin';
      ctx.emit(datum('saved-model', key, { ...model, sourceKey: model.key, key }));
      return '학습 결과를 저장소의 ' + key + '에 저장했습니다.';
    },
  },
  partition: {
    label: '데이터 분할',
    ports: [
      port('in', 'dataset', 'dataset'),
      port('out', 'job', 'job'),
      port('out', 'eval', 'dataset', false, '평가용 데이터'),
      port('out', 'train', 'dataset', false, '학습용 데이터'),
    ],
    run: (ctx) => {
      const dataset = need(ctx, 'dataset').data;
      const { key } = dataset;
      const sampleIds = numbers(dataset, 'sampleIds');
      const split = Math.floor(sampleIds.length * 0.8);
      const train = sampleIds.slice(0, split);
      const evaluation = sampleIds.slice(split);
      ctx.emit(
        datum('job', '학습 작업 · 표본 ' + train.length + '개', {
          key,
          sampleIds: train,
          samples: train.length,
          gib: 8,
          candidate: 'model-v1',
        }),
      );
      ctx.emit(
        datum('dataset', '학습용 표본 ' + train.length + '개', { key, sampleIds: train }),
        'out-train',
      );
      ctx.emit(
        datum('dataset', '평가용 표본 ' + evaluation.length + '개', {
          key,
          sampleIds: evaluation,
          correct: 17,
          minimum: 0.8,
        }),
        'out-eval',
      );
      return '학습 ' + train.length + '개 · 평가 ' + evaluation.length + '개로 분리했습니다.';
    },
  },
} satisfies Record<string, CatalogKind>;
