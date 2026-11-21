import type { Strategy } from '../../engine';
import { rootId, type Graph, type LabConfig } from '../../lab';
import { datum, defineLab, layout, need, port, received, setting, wired } from '../kit';

/** 3단원 종합 · 과거 실험 재현. GitHub·S3·EC2 세 서비스에서 코드와 데이터를 같은 버전으로 되돌린다. */
export const reproduceLessonId = 'week4-workflow';
const TARGET = 'v1';

const strategies: Record<string, Strategy> = {
  start: ({ emit }) => {
    emit(datum('version', '실험 ' + TARGET + ' 지정', { version: TARGET }), 'out-version');
    emit(datum('workdata', '작업 데이터 v2', { version: 'v2' }), 'out-workdata');
    return '재현할 실험 ' + TARGET + '과 현재 작업 데이터 v2를 보냈습니다.';
  },
  'git-read': (ctx) => {
    const version = need(ctx, 'version').data.version as string;
    ctx.emit(
      datum('code', '코드·포인터 ' + version, { version, pointer: 'dataset.dvc@' + version }),
    );
    return '커밋 ' + version + '의 코드와 데이터 포인터를 읽었습니다.';
  },
  's3-files': (ctx) => {
    const version = need(ctx, 'version').data.version as string;
    ctx.emit(datum('file', '버전 파일 ' + version, { version, size: version === 'v1' ? 10 : 12 }));
    return '원격 저장소의 데이터 ' + version + ' 파일을 제공했습니다.';
  },
  restore: (ctx) => {
    const code = need(ctx, 'code');
    const work = need(ctx, 'workdata');
    const operation = String(setting(ctx.node, 'operation'));
    const cached = setting(ctx.node, 'cache') === 'present';
    const target = code.data.version as string;
    let dataVersion = work.data.version as string;
    let source = 'workspace';
    let remote = false;
    if (operation !== 'git') {
      if (cached) {
        source = 'cache';
        dataVersion = target;
      } else if (operation === 'checkout') {
        ctx.observe('cache-miss');
        throw new Error(
          '로컬 캐시에 ' +
            target +
            ' 데이터가 없어 checkout만으로 복원할 수 없습니다. dvc pull로 원격 파일을 가져오세요.',
        );
      } else {
        const file = received(ctx.inputs, 'file')[0];
        if (!file)
          throw new Error('dvc pull에는 S3의 버전 파일 입력이 필요합니다. 버전 파일을 연결하세요.');
        if (file.data.version !== target)
          throw new Error(
            '가져온 파일은 ' + file.data.version + '인데 포인터는 ' + target + '을 가리킵니다.',
          );
        source = 'remote';
        remote = true;
        dataVersion = target;
      }
    }
    ctx.emit(
      datum('restored', '코드 ' + target + ' · 데이터 ' + dataVersion, {
        codeVersion: target,
        dataVersion,
        source,
        remote,
      }),
    );
    return source === 'workspace'
      ? 'Git만 이동했습니다. 작업 데이터는 ' + dataVersion + ' 그대로입니다.'
      : source === 'cache'
        ? '로컬 캐시에서 데이터 ' + dataVersion + '을 복원했습니다. 원격 읽기는 없습니다.'
        : '원격에서 데이터 ' + dataVersion + '을 가져와 복원했습니다.';
  },
  end: (ctx) => {
    const result = need(ctx, 'restored', '복원 결과').data;
    const code = String(result.codeVersion);
    const data = String(result.dataVersion);
    const source = String(result.source);
    ctx.report([
      { label: '코드 버전', value: code },
      { label: '작업 데이터 버전', value: data },
      {
        label: '데이터 출처',
        value:
          source === 'cache'
            ? '로컬 캐시'
            : source === 'remote'
              ? '원격 다운로드'
              : '기존 작업 폴더',
      },
    ]);
    if (code !== data) {
      ctx.observe('git-mismatch');
      throw new Error(
        '코드는 ' +
          code +
          '인데 작업 데이터는 ' +
          data +
          '입니다. 버전이 달라 지난 실험을 재현할 수 없습니다.',
      );
    }
    if (code !== TARGET)
      throw new Error('지정한 실험 ' + TARGET + '이 아닌 ' + code + '로 복원됐습니다.');
    ctx.observe(source === 'remote' ? 'remote-restore' : 'cache-restore');
    return source === 'remote'
      ? '코드와 데이터가 모두 ' + TARGET + '입니다. 원격에서 가져와 복원했습니다.'
      : '코드와 데이터가 모두 ' + TARGET + '입니다. 원격 읽기 없이 캐시로 복원했습니다.';
  },
};

const labels = {
  root: '전체 서비스',
  github: 'GitHub',
  s3: 'S3',
  ec2: 'EC2',
  start: '시작',
  end: '도착',
  'git-read': '코드·포인터 읽기',
  's3-files': '버전 파일 제공',
  restore: '복원·검증',
};

function initial(lab: LabConfig): Graph {
  const { system, node } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      node('start', 'start', rootId, { x: 0, y: 130 }),
      system('github', 'github', rootId, { x: 300, y: 0 }, 260, 150),
      node('git-read', 'git-read', 'github', { x: 24, y: 52 }),
      system('s3', 's3', rootId, { x: 300, y: 190 }, 260, 150),
      node('s3-files', 's3-files', 's3', { x: 24, y: 52 }),
      system('ec2', 'ec2', rootId, { x: 660, y: 70 }, 260, 210),
      node('restore', 'restore', 'ec2', { x: 24, y: 52 }),
      node('end', 'end', rootId, { x: 1000, y: 160 }),
    ],
    connections: [
      wired('start', 'version', 'git-read', 'version'),
      wired('start', 'workdata', 'restore', 'workdata'),
      wired('git-read', 'code', 'restore', 'code'),
      wired('restore', 'restored', 'end', 'restored'),
    ],
  };
}

export const reproduceLab: LabConfig = defineLab({
  id: reproduceLessonId,
  storageKey: 'blockml:system-lab:week4-workflow:v1',
  labels,
  materials: {
    version: '실험 버전',
    workdata: '작업 데이터',
    code: '코드·포인터',
    file: '버전 파일',
    restored: '복원 결과',
  },
  tools: {
    root: ['github', 's3', 'ec2'],
    github: ['git-read'],
    s3: ['s3-files'],
    ec2: ['restore'],
  },
  portTypes: {
    root: { in: [], out: [] },
    github: { in: [], out: [] },
    s3: { in: [], out: [] },
    ec2: { in: [], out: [] },
    start: { in: [], out: ['version', 'workdata'] },
    end: { in: ['restored'], out: [] },
    'git-read': { in: ['version'], out: ['code'] },
    's3-files': { in: ['version'], out: ['file'] },
    restore: { in: ['code', 'workdata', 'file'], out: ['restored'] },
  },
  runStateKinds: ['github', 's3', 'ec2', 'git-read', 's3-files', 'restore'],
  managedPorts: {
    start: ['version', 'workdata'],
    end: ['restored'],
    'git-read': ['version', 'code'],
    's3-files': ['version', 'file'],
    restore: ['code', 'workdata', 'file', 'restored'],
  },
  resourceDefaults: (kind) => {
    const ports = {
      start: [port('out', 'version', 'version'), port('out', 'workdata', 'workdata')],
      end: [port('in', 'restored', 'restored')],
      'git-read': [port('in', 'version', 'version'), port('out', 'code', 'code')],
      's3-files': [port('in', 'version', 'version'), port('out', 'file', 'file')],
      restore: [
        port('in', 'code', 'code'),
        port('in', 'workdata', 'workdata'),
        port('in', 'file', 'file'),
        port('out', 'restored', 'restored'),
      ],
    }[kind as 'start'];
    return ports ? { ports } : {};
  },
  settingSpecs: {
    restore: [
      {
        key: 'operation',
        label: '복원 작업',
        type: 'choice',
        initial: 'git',
        options: [
          { value: 'git', label: 'Git 이동만' },
          { value: 'checkout', label: 'dvc checkout' },
          { value: 'pull', label: 'dvc pull 후 복원' },
        ],
        help: 'Git은 코드와 포인터만 바꿉니다. 데이터는 checkout이나 pull이 복원합니다.',
      },
      {
        key: 'cache',
        label: '로컬 캐시의 v1',
        type: 'choice',
        initial: 'missing',
        options: [
          { value: 'present', label: '캐시에 있음' },
          { value: 'missing', label: '캐시에 없음' },
        ],
        help: '캐시에 있으면 원격에서 다시 받지 않습니다.',
      },
    ],
  },
  initial() {
    return initial(reproduceLab);
  },
  starterTasks: [
    wired('start', 'version', 'git-read', 'version'),
    wired('start', 'workdata', 'restore', 'workdata'),
    wired('git-read', 'code', 'restore', 'code'),
    wired('start', 'version', 's3-files', 'version'),
    wired('s3-files', 'file', 'restore', 'file'),
    wired('restore', 'restored', 'end', 'restored'),
  ],
  requiredNodeIds: new Set(['start', 'git-read', 's3-files', 'restore', 'end']),
  strategies,
  requiredObservations: ['git-mismatch', 'remote-restore', 'cache-restore'],
  observationLabels: {
    'git-mismatch': 'Git만 이동한 실행의 버전 불일치',
    'remote-restore': '캐시가 없어 원격에서 가져온 복원',
    'cache-restore': '캐시 적중으로 원격 읽기 없이 복원',
  },
});
