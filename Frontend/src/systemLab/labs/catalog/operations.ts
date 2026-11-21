import type { CatalogKind } from '.';
import { choice, datum, josa, need, numbers, port, received, setting } from '../kit';

export const APPROVAL_MINIMUM = 0.85;

export const operationKinds = {
  monitoring: { label: '모니터링', service: true },
  collectMetrics: {
    label: '지표 수집',
    ports: [
      port('in', 'metrics', 'service-metrics'),
      port('in', 'labels', 'labels'),
      port('out', 'signal', 'quality-signal'),
    ],
    run: (ctx) => {
      const metrics = need(ctx, 'service-metrics').data;
      const { matched, total } = need(ctx, 'labels', '정답 표본').data;
      const accuracy = Number(matched) / Number(total);
      const lag = Number(metrics.featureLagMinutes);
      const summary =
        'HTTP 성공 ' +
        metrics.httpSuccess +
        '% · 정확도 ' +
        accuracy.toFixed(2) +
        ' · 피처 갱신 지연 ' +
        lag +
        '분 (목표 15분 이내)';
      ctx.emit(
        datum('quality-signal', summary, { accuracy, httpSuccess: metrics.httpSuccess, lag }),
      );
      ctx.report([
        { label: 'HTTP 성공률', value: metrics.httpSuccess + '%' },
        { label: '현재 모델 정확도', value: accuracy.toFixed(2) },
        { label: '피처 갱신 지연', value: lag + '분' },
        { label: '갱신 지연 목표', value: '15분 이내' },
      ]);
      ctx.observe('quality-drop');
      return summary;
    },
  },
  diagnose: {
    label: '원인 판단',
    ports: [
      port('in', 'signal', 'quality-signal'),
      port('in', 'current', 'deployed-model'),
      port('out', 'job', 'job'),
      port('out', 'evaluation', 'dataset'),
    ],
    settings: [
      choice('correction', '피처 갱신 주기', 'stale', [
        ['stale', '120분마다 갱신'],
        ['fresh', '15분마다 갱신'],
      ]),
    ],
    run: (ctx) => {
      const signal = need(ctx, 'quality-signal').data;
      const current = need(ctx, 'deployed-model').data;
      const corrected = setting(ctx.node, 'correction') === 'fresh';
      const featureRefreshMinutes = corrected ? 15 : 120;
      const candidate = corrected ? 'feature-fix-v2' : 'candidate-v2';
      const sampleIds = Array.from({ length: 100 }, (_, index) => index + 1);
      ctx.emit(
        datum('job', '후보 학습 작업 · ' + candidate, {
          candidate,
          key: 'monitoring/feedback',
          sampleIds,
          samples: sampleIds.length,
          gib: 8,
          priorAccuracy: signal.accuracy,
          httpSuccess: signal.httpSuccess,
          previousModelId: current.modelId,
          featureRefreshMinutes,
        }),
      );
      ctx.emit(
        datum('dataset', '별도 재평가 표본 100개', {
          key: 'monitoring/feedback',
          sampleIds: sampleIds.map((id) => id + 100),
          minimum: APPROVAL_MINIMUM,
          candidate,
          correct: corrected ? 90 : 72,
        }),
      );
      return (
        '관측된 피처 갱신 지연 ' +
        signal.lag +
        '분 · 재학습에 적용할 갱신 주기 ' +
        featureRefreshMinutes +
        '분'
      );
    },
  },
  evaluate: {
    label: '모델 평가',
    ports: [
      port('in', 'checkpoint', 'checkpoint'),
      port('in', 'dataset', 'dataset', false, '평가용 데이터'),
      port('out', 'approval', 'approval'),
    ],
    settings: [
      {
        key: 'threshold',
        label: '평가 통과 기준',
        type: 'number',
        initial: 0.9,
        min: 0,
        max: 1,
        step: 0.01,
        help: '평가 자료에 최소 승인 기준이 있으면 그 기준도 적용합니다.',
      },
    ],
    run: (ctx) => {
      const model = need(ctx, 'checkpoint', '학습한 모델').data;
      const evaluation = need(ctx, 'dataset', '평가용 데이터').data;
      const trainIds = new Set(numbers(model, 'sampleIds'));
      const evaluationIds = numbers(evaluation, 'sampleIds');
      if (model.key === evaluation.key && evaluationIds.some((id) => trainIds.has(id))) {
        ctx.observe('split-leak');
        throw new Error(
          '학습에 사용한 표본이 평가 입력에 들어왔습니다. 평가용 데이터를 연결하세요.',
        );
      }
      if (
        !evaluationIds.length ||
        evaluation.key !== model.key ||
        (evaluation.candidate !== undefined && evaluation.candidate !== model.candidate)
      )
        throw new Error('이 모델을 평가할 독립 표본을 연결하세요.');
      const accuracy = Number(evaluation.correct) / evaluationIds.length;
      if (!Number.isFinite(accuracy)) throw new Error('평가에 필요한 채점 결과가 없습니다.');
      const threshold = Math.max(
        Number(setting(ctx.node, 'threshold')),
        Number(evaluation.minimum ?? 0),
      );
      if (accuracy < threshold) {
        ctx.observe('low-quality');
        throw new Error(
          '정확도 ' +
            accuracy.toFixed(2) +
            '가 기준 ' +
            threshold.toFixed(2) +
            '에 미달해 승인하지 않았습니다.',
        );
      }
      ctx.emit(
        datum('approval', String(model.candidate) + ' · 평가 승인', {
          modelId: model.candidate,
          accuracy,
          threshold,
          priorAccuracy: model.priorAccuracy,
          httpSuccess: model.httpSuccess,
          previousModelId: model.previousModelId,
          featureRefreshMinutes: model.featureRefreshMinutes,
        }),
      );
      return '정확도 ' + accuracy.toFixed(2) + ' · 기준 ' + threshold.toFixed(2) + ' · 평가 승인';
    },
  },
  publish: {
    label: '승인 모델 반영',
    ports: [
      port('in', 'approval', 'approval'),
      port('in', 'checkpoint', 'checkpoint', false, '후보 모델 (승인 없이 반영 시도)'),
      port('out', 'model', 'deployed-model'),
    ],
    settings: [
      choice('destination', '반영 방식', 'deploy', [
        ['deploy', '서비스 배포'],
        ['register', '모델 등록'],
      ]),
    ],
    run: (ctx) => {
      const [candidate] = received(ctx.inputs, 'checkpoint');
      const [approval] = received(ctx.inputs, 'approval');
      if (candidate && !approval) {
        if (
          !ctx.graph.connections.some(
            ({ to }) => to.node === ctx.node.id && to.port === 'in-approval',
          )
        )
          ctx.observe('approval-missing');
        throw new Error('후보 모델에 평가 승인이 없어 반영을 차단했습니다.');
      }
      const approved = need(ctx, 'approval', '평가 승인').data;
      if (candidate && candidate.data.candidate !== approved.modelId)
        throw new Error('후보 모델과 평가 승인의 모델 ID가 다릅니다.');
      const destination = setting(ctx.node, 'destination');
      const action = destination === 'register' ? '등록' : '배포';
      ctx.emit(
        datum('deployed-model', String(approved.modelId) + ' · ' + action, {
          ...approved,
          destination,
        }),
      );
      return josa(String(approved.modelId), '을/를') + ' ' + action + '했습니다.';
    },
  },
} satisfies Record<string, CatalogKind>;
