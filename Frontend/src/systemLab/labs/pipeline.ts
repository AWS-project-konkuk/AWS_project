import { datum, need, numbers, port, wired } from './kit';
import { defineWorkflowLab } from './workflow';

const requestIds = Array.from({ length: 10 }, (_, index) => index + 1);

export const pipelineLab = defineWorkflowLab({
  id: 'pipeline-capstone',
  kinds: [
    'storage',
    'ec2',
    'gateway',
    'monitoring',
    'readObjects',
    'partition',
    'train',
    'evaluate',
    'publish',
    'infer',
    'observeResponses',
  ],
  tools: {
    storage: ['readObjects'],
    ec2: ['partition', 'train', 'evaluate'],
    gateway: ['publish', 'infer'],
    monitoring: ['observeResponses'],
  },
  defaults: { publish: { destination: 'register' } },
  omitPorts: { publish: ['in-checkpoint'], observeResponses: ['in-plan'] },
  start: {
    label: '시작',
    ports: [port('out', 'objects', 'objects'), port('out', 'request', 'request')],
    run: ({ emit }) => {
      const sampleIds = Array.from({ length: 100 }, (_, index) => index + 1);
      emit(datum('objects', 'raw/train.csv · 표본 100개', { key: 'raw/train.csv', sampleIds }));
      emit(datum('request', '사용자 요청 10건', { ids: requestIds, registered: true }));
      return '원본 데이터 100개와 사용자 요청 10건을 보냈습니다.';
    },
  },
  end: {
    label: '도착',
    ports: [
      port('in', 'model', 'deployed-model', false, '등록 모델'),
      port('in', 'report', 'serving-report'),
    ],
    run: (ctx) => {
      const model = need(ctx, 'deployed-model', '승인 후 등록된 모델').data;
      const report = need(ctx, 'serving-report', '운영 보고').data;
      const users = numbers(report, 'userIds');
      if (model.destination !== 'register')
        throw new Error('평가 승인을 받은 모델을 먼저 등록하세요.');
      if (
        !Array.isArray(report.models) ||
        report.models.length !== 1 ||
        report.models[0] !== model.modelId
      )
        throw new Error('등록한 모델이 사용자 요청을 처리하고 그 결과를 관측해야 합니다.');
      if (
        users.length !== requestIds.length ||
        new Set(users).size !== requestIds.length ||
        users.some((id) => !requestIds.includes(id))
      )
        throw new Error('사용자 요청 10건의 응답이 한 번씩 운영 보고에 기록되어야 합니다.');
      ctx.report([
        { label: '평가 결과', value: Number(model.accuracy).toFixed(2) + ' · 승인' },
        { label: '등록 모델 ID', value: String(model.modelId) },
        { label: '사용자 응답', value: users.length + '건' },
        { label: '운영 보고', value: '응답 ' + users.length + '건 관측 · 다음 실행의 입력 후보' },
      ]);
      ctx.observe('pipeline-complete');
      return '평가·등록·서빙을 거쳐 운영 보고가 도착했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 105 }),
      system('storage', 'storage', 'root', { x: 265, y: 0 }, 244, 169),
      node('readObjects', 'read', 'storage', { x: 24, y: 54 }),
      system('ec2', 'ec2', 'root', { x: 593, y: 0 }, 514, 392),
      node('partition', 'partition', 'ec2', { x: 24, y: 54 }),
      node('train', 'train', 'ec2', { x: 302, y: 54 }),
      node('evaluate', 'evaluate', 'ec2', { x: 302, y: 245 }),
      system('gateway', 'gateway', 'root', { x: 1200, y: 0 }, 244, 350),
      node('publish', 'publish', 'gateway', { x: 24, y: 54 }, { name: '승인 모델 반영' }),
      node('infer', 'serve', 'gateway', { x: 24, y: 220 }, { name: '등록 모델 서빙' }),
      system('monitoring', 'monitoring', 'root', { x: 1200, y: 435 }, 244, 168),
      node('observeResponses', 'observe', 'monitoring', { x: 24, y: 54 }),
      node('end', 'end', 'root', { x: 1540, y: 230 }),
    ],
    connections: [
      wired('start', 'objects', 'read', 'objects'),
      wired('read', 'dataset', 'partition', 'dataset'),
      wired('partition', 'job', 'train', 'job'),
      wired('train', 'result', 'evaluate', 'checkpoint'),
      wired('partition', 'train', 'evaluate', 'dataset'),
      wired('start', 'request', 'serve', 'request'),
    ],
  }),
  starterTasks: [
    wired('partition', 'eval', 'evaluate', 'dataset'),
    wired('evaluate', 'approval', 'publish', 'approval'),
    wired('publish', 'model', 'serve', 'model'),
    wired('publish', 'model', 'end', 'model'),
    wired('serve', 'prediction', 'observe', 'prediction'),
    wired('observe', 'report', 'end', 'report'),
  ],
  required: ['partition', 'train', 'evaluate', 'publish', 'serve', 'observe'],
  observations: {
    'split-leak': '학습용 표본이 평가에 들어와 차단되는 실행',
    'low-quality': '정확도 0.85가 평가 기준에 미달해 등록이 차단되는 실행',
    'pipeline-complete': '평가 승인부터 운영 보고까지 도착하는 실행',
  },
});
