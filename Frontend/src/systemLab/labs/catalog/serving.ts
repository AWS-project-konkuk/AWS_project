import type { CatalogKind } from '.';
import { choice, datum, need, numbers, port, received, setting } from '../kit';

export const previousModelId = 'model-v1';
export const candidateModelId = 'model-v2';

function trafficGroups(ids: number[], strategy: string, share: number) {
  if (strategy === 'recreate') return { old: ids.slice(0, 40), next: ids.slice(60), shadow: [] };
  // 이 실습의 라우터는 전체 대상을 한꺼번에 교체할 때 5건을 처리하지 못한다.
  if (strategy === 'blue-green') return { old: ids.slice(0, 40), next: ids.slice(45), shadow: [] };
  const count = Math.floor((ids.length * share) / 100);
  if (strategy === 'shadow') return { old: ids, next: [], shadow: ids.slice(0, count) };
  return { old: ids.slice(count), next: ids.slice(0, count), shadow: [] };
}

export const servingKinds = {
  routeTraffic: {
    label: '요청 분배',
    ports: [
      port('in', 'request', 'request'),
      port('out', 'old', 'request', false, '기존 모델 요청'),
      port('out', 'new', 'request', false, '신규 모델 요청'),
      port('out', 'plan', 'traffic-plan'),
    ],
    settings: [
      choice('strategy', '배포 전략', 'recreate', [
        ['recreate', '중단 배포'],
        ['blue-green', 'Blue·Green 전환'],
        ['canary', 'Canary 전환'],
        ['shadow', 'Shadow 비교'],
      ]),
      choice('share', 'Canary 전환·Shadow 복제 비율', '10', [
        ['10', '10%'],
        ['50', '50%'],
      ]),
    ],
    run: (ctx) => {
      const ids = numbers(need(ctx, 'request').data, 'ids');
      const strategy = String(setting(ctx.node, 'strategy'));
      const share = Number(setting(ctx.node, 'share'));
      const groups = trafficGroups(ids, strategy, share);
      const next = strategy === 'shadow' ? groups.shadow : groups.next;
      const gap = ids.length - groups.old.length - groups.next.length;
      ctx.emit(
        datum('request', '기존 모델 요청 ' + groups.old.length + '건', {
          ids: groups.old,
          modelId: previousModelId,
          audience: 'user',
        }),
        'out-old',
      );
      ctx.emit(
        datum(
          'request',
          '신규 모델 ' + (strategy === 'shadow' ? '복제 ' : '사용자 ') + next.length + '건',
          {
            ids: next,
            modelId: candidateModelId,
            audience: strategy === 'shadow' ? 'shadow' : 'user',
          },
        ),
        'out-new',
      );
      ctx.emit(
        datum('traffic-plan', '사용자 요청 ' + ids.length + '건 · 전환 중 실패 ' + gap + '건', {
          ids,
          strategy,
          expectedShadowIds: groups.shadow,
          expectedNewIds: groups.next,
          gap,
        }),
      );
      return (
        '기존 응답 대상 ' +
        groups.old.length +
        '건 · 신규 응답 대상 ' +
        groups.next.length +
        '건 · 복제 ' +
        groups.shadow.length +
        '건 · 전환 중 실패 ' +
        gap +
        '건'
      );
    },
  },
  infer: {
    label: '모델 응답',
    ports: [
      port('in', 'request', 'request'),
      port('in', 'model', 'deployed-model'),
      port('out', 'prediction', 'prediction'),
    ],
    run: (ctx) => {
      const requests = need(ctx, 'request').data;
      const model = need(ctx, 'deployed-model').data;
      if (requests.modelId && requests.modelId !== model.modelId)
        throw new Error('요청 분배가 지정한 모델을 연결하세요.');
      if (requests.registered && model.destination !== 'register')
        throw new Error('승인받고 등록한 모델을 연결하세요.');
      const ids = numbers(requests, 'ids');
      const shadow = requests.audience === 'shadow';
      const summary =
        model.modelId + ' · ' + (shadow ? '비교 결과 ' : '사용자 응답 ') + ids.length + '건';
      ctx.emit(
        datum('prediction', summary, {
          ids,
          modelId: model.modelId,
          audience: shadow ? 'shadow' : 'user',
        }),
      );
      return summary;
    },
  },
  observeResponses: {
    label: '결과 관측',
    ports: [
      port('in', 'prediction', 'prediction', true, '모델 결과'),
      port('in', 'plan', 'traffic-plan'),
      port('out', 'report', 'serving-report'),
    ],
    run: (ctx) => {
      const predictions = received(ctx.inputs, 'prediction').map((artifact) => artifact.data);
      if (!predictions.length) throw new Error('모델 결과를 연결하세요.');
      const users = predictions.filter((batch) => batch.audience === 'user');
      const userIds = users.flatMap((batch) => numbers(batch, 'ids'));
      const newIds = users
        .filter((batch) => batch.modelId === candidateModelId)
        .flatMap((batch) => numbers(batch, 'ids'));
      const shadowIds = predictions
        .filter((batch) => batch.audience === 'shadow')
        .flatMap((batch) => numbers(batch, 'ids'));
      const [plan] = received(ctx.inputs, 'traffic-plan');
      const summary = '사용자 응답 ' + userIds.length + '건 · 비교 로그 ' + shadowIds.length + '건';
      ctx.emit(
        datum('serving-report', summary, {
          ...plan?.data,
          userIds,
          newIds,
          shadowIds,
          models: [...new Set(users.map((batch) => batch.modelId))],
        }),
      );
      return summary + ' · 다음 실행에 쓸 운영 보고를 남겼습니다.';
    },
  },
} satisfies Record<string, CatalogKind>;
