import { candidateModelId, previousModelId, servingKinds } from './catalog/serving';
import { datum, need, numbers, plainPersistence, port, wired } from './kit';
import { defineWorkflowLab } from './workflow';

const requestIds = Array.from({ length: 100 }, (_, index) => index + 1);

function matchesIds(expected: number[], actual: number[]) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === expected.length &&
    actual.every((id) => expected.includes(id))
  );
}

export const transitionLab = {
  ...defineWorkflowLab({
    id: 'week6-workflow',
    kinds: ['gateway', 'routeTraffic', 'infer', 'observeResponses'],
    tools: { gateway: ['routeTraffic', 'infer', 'observeResponses'] },
    custom: { infer: { ...servingKinds.infer, label: '모델 처리' } },
    start: {
      label: '시작',
      ports: [
        port('out', 'request', 'request'),
        port('out', 'old', 'deployed-model', false, '기존 모델'),
        port('out', 'new', 'deployed-model', false, '신규 모델'),
      ],
      run: ({ emit }) => {
        emit(datum('request', '사용자 요청 100건', { ids: requestIds }));
        emit(datum('deployed-model', previousModelId, { modelId: previousModelId }), 'out-old');
        emit(datum('deployed-model', candidateModelId, { modelId: candidateModelId }), 'out-new');
        return '사용자 요청 100건과 전환에 쓸 두 모델을 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [port('in', 'report', 'serving-report')],
      run: (ctx) => {
        const report = need(ctx, 'serving-report', '요청 결과를 모은 운영 보고').data;
        if (!report.strategy) throw new Error('요청 분배 내역도 결과 관측에 연결하세요.');
        const users = numbers(report, 'userIds');
        const newUsers = numbers(report, 'newIds');
        const shadow = numbers(report, 'shadowIds');
        const missed = requestIds.filter((id) => !users.includes(id)).length;
        const gap = Number(report.gap);
        const duplicates = users.length - new Set(users).size;
        ctx.report([
          { label: '사용자 응답', value: users.length + '건' },
          { label: '신규 모델 사용자 응답', value: newUsers.length + '건' },
          { label: 'Shadow 비교 로그', value: shadow.length + '건' },
          { label: '전환 중 실패', value: gap + '건' },
          { label: '누락 / 중복', value: missed + '건 / ' + duplicates + '건' },
        ]);
        if (gap > 0 && missed === gap && !duplicates) {
          if (report.strategy === 'recreate') {
            ctx.observe('release-gap');
            throw new Error('중단 배포에서 기존 모델을 내린 뒤 ' + gap + '건이 실패했습니다.');
          }
          if (report.strategy === 'blue-green') {
            ctx.observe('switch-gap');
            throw new Error(
              'Blue-Green은 두 환경을 준비해 한 번에 전환할 수 있는 전략입니다. 이 실습에서는 라우터가 대상을 바꾸는 동안 ' +
                gap +
                '건의 응답이 끊겼습니다. 응답 처리 중에는 단 한 번도 멈추면 안 되므로 이번 배포를 반려합니다.',
            );
          }
        }
        if (!matchesIds(requestIds, users))
          throw new Error(
            '사용자 응답 100건을 한 번씩 받아야 합니다. 누락 ' +
              missed +
              '건 · 중복 ' +
              duplicates +
              '건',
          );
        if (
          !matchesIds(numbers(report, 'expectedNewIds'), newUsers) ||
          !matchesIds(numbers(report, 'expectedShadowIds'), shadow)
        )
          throw new Error('신규 모델의 사용자 응답과 비교 로그가 분배 내역과 일치해야 합니다.');
        return '사용자 요청 100건에 누락·중복·실패 없이 응답했습니다.';
      },
    },
    initial: ({ system, node }) => ({
      entities: [
        node('start', 'start', 'root', { x: 0, y: 144 }),
        system('gateway', 'gateway', 'root', { x: 294, y: 0 }, 892, 374),
        node('routeTraffic', 'router', 'gateway', { x: 24, y: 131 }),
        node('infer', 'old', 'gateway', { x: 330, y: 54 }, { name: '기존 모델 처리' }),
        node('observeResponses', 'observe', 'gateway', { x: 659, y: 140 }),
        node('end', 'end', 'root', { x: 1290, y: 138 }),
      ],
      connections: [
        wired('start', 'request', 'router', 'request'),
        wired('start', 'old', 'old', 'model'),
        wired('router', 'old', 'old', 'request'),
        wired('router', 'plan', 'observe', 'plan'),
        wired('old', 'prediction', 'observe', 'prediction'),
        wired('observe', 'report', 'end', 'report'),
      ],
    }),
    starterTasks: [],
    required: ['router', 'old', 'observe'],
    observations: {
      'release-gap': '중단 배포에서 준비 공백으로 실패한 요청',
      'switch-gap': 'Blue-Green 일괄 전환 중 응답 누락',
    },
  }),
  toolPosition: (index: number) =>
    index === 3 ? { x: 330, y: 224 } : { x: 24, y: 52 + index * 150 },
  persistence: {
    ...plainPersistence,
    readEntity(item: Record<string, unknown>) {
      const settings = item.settings;
      if (
        item.kind !== 'routeTraffic' ||
        !settings ||
        typeof settings !== 'object' ||
        Array.isArray(settings)
      )
        return item;
      const updated = { ...settings };
      Reflect.deleteProperty(updated, 'ready');
      return { ...item, settings: updated };
    },
  },
};
