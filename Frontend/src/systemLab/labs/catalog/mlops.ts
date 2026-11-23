import type { CatalogKind } from '.';
import { choice, datum, need, numbers, port, setting } from '../kit';

/**
 * 플레이그라운드가 쓰는 입력 소스와, 단원 실습에 없던 MLOps 단계.
 * 입력 소스는 단원 실습의 "시작" 노드가 보내던 자료를 설정으로 고를 수 있게 한 것이다.
 */
const SAMPLE_IDS = Array.from({ length: 100 }, (_, index) => index + 1);
export const DOCUMENTS = [
  { id: 'doc-return', text: '수령 7일 이내 미사용 상품은 반품할 수 있습니다.' },
  { id: 'doc-weather', text: '내일은 전국에 비가 올 예정입니다.' },
];
export const QUESTION = '구매한 상품을 반품할 수 있나요?';
const CLICK_MINUTES = [545, 570, 590, 610, 640, 655, 670, 675];

export const mlopsKinds = {
  sources: { label: '입력 소스', service: true },
  registry: { label: '모델 레지스트리', service: true },
  rawData: {
    label: '원본 데이터',
    ports: [port('out', 'objects', 'objects')],
    run: (ctx) => {
      ctx.emit(
        datum('objects', 'raw/train.csv · 표본 ' + SAMPLE_IDS.length + '개', {
          key: 'raw/train.csv',
          sampleIds: SAMPLE_IDS,
        }),
      );
      return '원본 목록 raw/train.csv(표본 ' + SAMPLE_IDS.length + '개)를 내보냈습니다.';
    },
  },
  trainJob: {
    label: '학습 작업',
    ports: [port('out', 'job', 'job')],
    settings: [
      {
        key: 'gib',
        label: '필요 메모리(GiB)',
        type: 'number',
        initial: 8,
        min: 1,
        max: 64,
        step: 1,
        help: 'GPU 한 장은 16GiB입니다. 이보다 크면 작업을 나눠야 합니다.',
      },
    ],
    run: (ctx) => {
      const gib = Number(setting(ctx.node, 'gib'));
      ctx.emit(
        datum('job', '학습 작업 · 모델 상태 ' + gib + 'GiB', {
          key: 'raw/train.csv',
          sampleIds: SAMPLE_IDS,
          samples: SAMPLE_IDS.length,
          gib,
          candidate: 'model-v1',
        }),
      );
      return '메모리 ' + gib + 'GiB가 필요한 학습 작업을 내보냈습니다.';
    },
  },
  textInput: {
    label: '텍스트 입력',
    ports: [port('out', 'text', 'text')],
    settings: [
      choice('role', '텍스트 종류', 'document', [
        ['document', '원본 문서'],
        ['question', '사용자 질문'],
      ]),
    ],
    run: (ctx) => {
      if (setting(ctx.node, 'role') === 'document') {
        ctx.emit(
          datum('text', '원본 문서 ' + DOCUMENTS.length + '건', {
            kind: 'document',
            documents: DOCUMENTS,
          }),
        );
        return '원본 문서 ' + DOCUMENTS.length + '건을 내보냈습니다.';
      }
      ctx.emit(datum('text', '질문: ' + QUESTION, { kind: 'question', text: QUESTION }));
      return '사용자 질문을 내보냈습니다.';
    },
  },
  requestStream: {
    label: '사용자 요청',
    ports: [port('out', 'request', 'request')],
    settings: [
      choice('count', '요청 수', '100', [
        ['10', '10건'],
        ['100', '100건'],
      ]),
    ],
    run: (ctx) => {
      const count = Number(setting(ctx.node, 'count'));
      const ids = Array.from({ length: count }, (_, index) => index + 1);
      ctx.emit(datum('request', '사용자 요청 ' + count + '건', { ids }));
      return '번호가 붙은 사용자 요청 ' + count + '건을 내보냈습니다.';
    },
  },
  clickLog: {
    label: '클릭 이력',
    ports: [port('out', 'events', 'click-events')],
    run: (ctx) => {
      ctx.emit(
        datum('click-events', '고객 클릭 ' + CLICK_MINUTES.length + '건', {
          clickMinutes: CLICK_MINUTES,
        }),
      );
      return '고객의 클릭 이력 ' + CLICK_MINUTES.length + '건을 내보냈습니다.';
    },
  },
  featureQuery: {
    label: '피처 조회 요청',
    ports: [port('out', 'query', 'feature-query')],
    settings: [
      choice('role', '용도', 'train', [
        ['train', '학습용 (기준 10:00)'],
        ['serve', '추론용 (현재 11:15)'],
      ]),
    ],
    run: (ctx) => {
      const role = String(setting(ctx.node, 'role'));
      ctx.emit(
        datum('feature-query', role === 'train' ? '학습 조회 · 10:00' : '추론 조회 · 11:15', {
          role,
          cutoff: 600,
          now: 675,
        }),
      );
      return (role === 'train' ? '학습' : '추론') + '용 조회 요청을 내보냈습니다.';
    },
  },
  workspace: {
    label: '작업 데이터',
    ports: [port('out', 'workdata', 'workdata')],
    settings: [
      choice('version', '현재 데이터 버전', 'v2', [
        ['v1', '데이터 v1'],
        ['v2', '데이터 v2'],
      ]),
    ],
    run: (ctx) => {
      const version = String(setting(ctx.node, 'version'));
      ctx.emit(datum('workdata', '작업 데이터 ' + version, { version }));
      return '지금 작업 폴더에 있는 데이터 ' + version + '을 내보냈습니다.';
    },
  },
  opsLog: {
    label: '운영 로그',
    ports: [port('out', 'metrics', 'service-metrics'), port('out', 'labels', 'labels')],
    settings: [
      choice('lag', '피처 갱신 지연', '120', [
        ['120', '120분 (갱신이 느림)'],
        ['15', '15분 (목표 이내)'],
      ]),
      choice('quality', '현재 모델 품질', 'low', [
        ['low', '정확도 0.72 (저하)'],
        ['good', '정확도 0.92 (양호)'],
      ]),
    ],
    run: (ctx) => {
      const lag = Number(setting(ctx.node, 'lag'));
      const matched = setting(ctx.node, 'quality') === 'good' ? 92 : 72;
      ctx.emit(
        datum('service-metrics', 'HTTP 성공 99.7% · 피처 갱신 지연 ' + lag + '분', {
          httpSuccess: 99.7,
          featureLagMinutes: lag,
        }),
        'out-metrics',
      );
      ctx.emit(
        datum('labels', '정답 표본 ' + matched + ' / 100', { matched, total: 100 }),
        'out-labels',
      );
      return '서비스 지표와 정답 표본 100건(일치 ' + matched + '건)을 내보냈습니다.';
    },
  },
  validateData: {
    label: '데이터 검증',
    ports: [port('in', 'dataset', 'dataset'), port('out', 'dataset', 'dataset')],
    settings: [
      {
        key: 'minSamples',
        label: '최소 표본 수',
        type: 'number',
        initial: 50,
        min: 1,
        max: 200,
        step: 1,
        help: '표본이 이보다 적으면 학습에 쓰지 못하도록 막습니다.',
      },
    ],
    run: (ctx) => {
      const dataset = need(ctx, 'dataset').data;
      const ids = numbers(dataset, 'sampleIds');
      const minimum = Number(setting(ctx.node, 'minSamples'));
      const duplicates = ids.length - new Set(ids).size;
      if (duplicates > 0) {
        ctx.observe('data-invalid');
        throw new Error('표본 ID가 ' + duplicates + '개 중복되어 학습에 쓸 수 없습니다.');
      }
      if (ids.length < minimum) {
        ctx.observe('data-invalid');
        throw new Error(
          '표본이 ' + ids.length + '개뿐이라 최소 ' + minimum + '개 기준에 못 미칩니다.',
        );
      }
      ctx.emit(
        datum('dataset', String(dataset.key) + ' · 검증 통과 ' + ids.length + '개', {
          ...dataset,
          validated: true,
        }),
      );
      return '표본 ' + ids.length + '개가 중복 없이 기준 ' + minimum + '개를 넘어 통과했습니다.';
    },
  },
  trackExperiment: {
    label: '실험 기록',
    ports: [port('in', 'checkpoint', 'checkpoint'), port('out', 'checkpoint', 'checkpoint')],
    settings: [
      {
        key: 'epochs',
        label: '에폭',
        type: 'number',
        initial: 10,
        min: 1,
        max: 100,
        step: 1,
        help: '기록하는 학습 설정입니다. 같은 값으로 다시 학습하면 같은 결과를 재현할 수 있습니다.',
      },
    ],
    run: (ctx) => {
      const model = need(ctx, 'checkpoint', '학습한 모델').data;
      const epochs = Number(setting(ctx.node, 'epochs'));
      const experiment = 'exp-' + String(model.candidate ?? 'model') + '-e' + epochs;
      ctx.emit(
        datum('checkpoint', experiment + ' 기록', { ...model, experiment, epochs, tracked: true }),
      );
      return (
        '데이터 ' +
        String(model.key ?? '미상') +
        ' · 에폭 ' +
        epochs +
        '로 ' +
        experiment +
        '를 기록했습니다.'
      );
    },
  },
  registerModel: {
    label: '모델 등록',
    ports: [port('in', 'approval', 'approval'), port('out', 'model', 'registered-model')],
    settings: [
      choice(
        'stage',
        '등록 단계',
        'staging',
        [
          ['staging', 'Staging (검증 중)'],
          ['production', 'Production (배포 허용)'],
        ],
        '평가 승인을 받은 모델만 등록할 수 있습니다. Production 단계의 모델만 배포할 수 있습니다.',
      ),
    ],
    run: (ctx) => {
      const approved = need(ctx, 'approval', '평가 승인').data;
      const stage = String(setting(ctx.node, 'stage'));
      ctx.emit(
        datum('registered-model', String(approved.modelId) + ' · ' + stage + ' 등록', {
          ...approved,
          stage,
          destination: 'register',
        }),
      );
      return String(approved.modelId) + ' 모델을 ' + stage + ' 단계로 레지스트리에 등록했습니다.';
    },
  },
  deployModel: {
    label: '모델 배포',
    ports: [port('in', 'model', 'registered-model'), port('out', 'model', 'deployed-model')],
    run: (ctx) => {
      const registered = need(ctx, 'registered-model', '등록된 모델').data;
      if (registered.stage !== 'production') {
        ctx.observe('stage-blocked');
        throw new Error(
          registered.modelId +
            ' 모델은 ' +
            registered.stage +
            ' 단계라 배포할 수 없습니다. Production으로 등록하세요.',
        );
      }
      ctx.emit(
        datum('deployed-model', String(registered.modelId) + ' · 배포', {
          ...registered,
          destination: 'deploy',
        }),
      );
      return String(registered.modelId) + ' 모델을 서비스에 배포했습니다.';
    },
  },
  trigger: {
    label: '재학습 트리거',
    ports: [port('in', 'signal', 'quality-signal'), port('out', 'signal', 'quality-signal')],
    settings: [
      {
        key: 'threshold',
        label: '재학습 시작 기준(정확도)',
        type: 'number',
        initial: 0.85,
        min: 0.5,
        max: 1,
        step: 0.01,
        help: '정확도가 이 값보다 낮을 때만 재학습 경로로 신호를 보냅니다.',
      },
    ],
    run: (ctx) => {
      const signal = need(ctx, 'quality-signal', '품질 조사 자료').data;
      const threshold = Number(setting(ctx.node, 'threshold'));
      const accuracy = Number(signal.accuracy);
      if (accuracy >= threshold)
        throw new Error(
          '정확도 ' +
            accuracy.toFixed(2) +
            '가 기준 ' +
            threshold.toFixed(2) +
            ' 이상이라 재학습을 시작하지 않았습니다. 오류가 아니라 의도된 멈춤입니다.',
        );
      ctx.observe('retrain-triggered');
      ctx.emit(
        datum('quality-signal', '정확도 ' + accuracy.toFixed(2) + ' · 재학습 시작', { ...signal }),
      );
      return (
        '정확도 ' +
        accuracy.toFixed(2) +
        '가 기준 ' +
        threshold.toFixed(2) +
        ' 미만이라 재학습 신호를 보냈습니다.'
      );
    },
  },
} satisfies Record<string, CatalogKind>;
