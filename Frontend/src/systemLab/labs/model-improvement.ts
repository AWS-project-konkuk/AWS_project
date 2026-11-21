import { APPROVAL_MINIMUM } from './catalog/operations';
import { datum, josa, need, port, wired } from './kit';
import { defineWorkflowLab } from './workflow';

export const improvementLab = defineWorkflowLab({
  id: 'week7-workflow',
  kinds: [
    'monitoring',
    'ec2',
    'gateway',
    'collectMetrics',
    'diagnose',
    'train',
    'evaluate',
    'publish',
  ],
  tools: {
    monitoring: ['collectMetrics', 'diagnose'],
    ec2: ['train', 'evaluate'],
    gateway: ['publish'],
  },
  defaults: { evaluate: { threshold: APPROVAL_MINIMUM } },
  start: {
    label: '시작',
    ports: [
      port('out', 'metrics', 'service-metrics'),
      port('out', 'labels', 'labels'),
      port('out', 'model', 'deployed-model', false, '현재 모델'),
    ],
    run: ({ emit }) => {
      emit(
        datum('service-metrics', 'HTTP 성공 99.9% · 피처 갱신 지연 120분', {
          httpSuccess: 99.9,
          featureLagMinutes: 120,
        }),
      );
      emit(datum('labels', '정답 표본 100건', { total: 100, matched: 72 }));
      emit(datum('deployed-model', '운영 중인 model-v1', { modelId: 'model-v1' }));
      return '서비스 지표와 정답 표본, 현재 모델을 보냈습니다.';
    },
  },
  end: {
    label: '도착',
    ports: [port('in', 'model', 'deployed-model', false, '승인받고 배포한 모델')],
    run: (ctx) => {
      const model = need(ctx, 'deployed-model', '승인받고 배포한 모델').data;
      const accuracy = Number(model.accuracy);
      if (model.destination !== 'deploy' || !(accuracy >= APPROVAL_MINIMUM))
        throw new Error('정확도 0.85 이상으로 평가 승인을 받은 모델을 서비스에 배포하세요.');
      ctx.report([
        { label: 'HTTP 성공률', value: model.httpSuccess + '%' },
        { label: '이전 모델', value: String(model.previousModelId) },
        { label: '현재 모델 정확도', value: Number(model.priorAccuracy).toFixed(2) },
        { label: '후보 모델 평가 정확도', value: accuracy.toFixed(2) },
        { label: '개선한 피처 갱신 주기', value: model.featureRefreshMinutes + '분' },
        { label: '배포 모델', value: String(model.modelId) },
      ]);
      ctx.observe('deployed');
      return '독립 평가를 통과한 ' + josa(String(model.modelId), '을/를') + ' 배포했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 135 }),
      system('monitoring', 'monitoring', 'root', { x: 272, y: 0 }, 240, 365),
      node('diagnose', 'diagnose', 'monitoring', { x: 24, y: 54 }),
      system('ec2', 'ec2', 'root', { x: 591, y: 0 }, 240, 365),
      node('train', 'train', 'ec2', { x: 24, y: 54 }),
      node('evaluate', 'evaluate', 'ec2', { x: 24, y: 206 }),
      system('gateway', 'gateway', 'root', { x: 907, y: 60 }, 240, 175),
      node('publish', 'publish', 'gateway', { x: 24, y: 54 }, { name: '승인 모델 반영' }),
      node('end', 'end', 'root', { x: 1230, y: 126 }),
    ],
    connections: [
      wired('start', 'model', 'diagnose', 'current'),
      wired('diagnose', 'job', 'train', 'job'),
      wired('train', 'result', 'evaluate', 'checkpoint'),
      wired('diagnose', 'evaluation', 'evaluate', 'dataset'),
      wired('evaluate', 'approval', 'publish', 'approval'),
      wired('publish', 'model', 'end', 'model'),
    ],
  }),
  starterTasks: [],
  required: ['diagnose', 'train', 'evaluate', 'publish'],
  observations: {
    'quality-drop': '현재 정확도 0.72와 피처 갱신 지연 120분',
    'low-quality': '기존 갱신 주기에서 평가 기준 미달',
    deployed: '기준을 통과한 후보의 평가 승인과 배포',
  },
});
