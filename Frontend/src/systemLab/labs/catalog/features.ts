import type { CatalogKind } from '.';
import { choice, datum, need, numbers, port, setting } from '../kit';

export const featureKinds = {
  featureStore: { label: 'Feature Store', service: true },
  defineFeature: {
    label: '공통 피처 정의',
    ports: [port('in', 'events', 'click-events'), port('out', 'definition', 'feature-definition')],
    settings: [
      choice('window', '집계 창', '24', [
        ['1', '최근 1시간'],
        ['24', '최근 24시간'],
      ]),
    ],
    run: (ctx) => {
      const clickMinutes = numbers(need(ctx, 'click-events').data, 'clickMinutes');
      const hours = Number(setting(ctx.node, 'window'));
      ctx.emit(
        datum('feature-definition', '최근 ' + hours + '시간 클릭 수', {
          id: ctx.node.id + ':' + hours,
          hours,
          clickMinutes,
        }),
      );
      return '두 조회에 쓸 집계 창은 ' + hours + '시간입니다.';
    },
  },
  lookupFeature: {
    label: '조회',
    ports: [
      port('in', 'definition', 'feature-definition'),
      port('in', 'query', 'feature-query'),
      port('out', 'feature', 'feature-value'),
    ],
    settings: [
      choice('asOf', '조회 기준', 'now', [
        ['now', '현재 시각'],
        ['cutoff', '학습 기준 시각'],
      ]),
    ],
    run: (ctx) => {
      const query = need(ctx, 'feature-query').data;
      const definition = need(ctx, 'feature-definition').data;
      const cutoff = Number(query.cutoff);
      const basis = setting(ctx.node, 'asOf');
      const asOf = basis === 'cutoff' ? cutoff : Number(query.now);
      const hours = Number(definition.hours);
      const events = numbers(definition, 'clickMinutes').filter(
        (minute) => minute > asOf - hours * 60 && minute <= asOf,
      );
      const time = Math.floor(asOf / 60) + ':' + String(asOf % 60).padStart(2, '0');
      const value = hours + '시간 · ' + events.length + '회 (' + time + ' 기준)';
      ctx.emit(
        datum('feature-value', value, {
          definition: definition.id,
          role: query.role,
          basis,
          value,
          future: events.filter((minute) => minute > cutoff).length,
        }),
      );
      return value;
    },
  },
} satisfies Record<string, CatalogKind>;
