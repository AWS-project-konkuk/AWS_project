import { catalog } from './catalog';
import { datum, josa, need, numbers, port, wired } from './kit';
import { defineWorkflowLab } from './workflow';

const filename = 'count_rows.py';
const commit = 'a1b2c3d';
const key = 'reviews.csv';
const sampleIds = [1, 2, 3];

export const introWorkflowLab = defineWorkflowLab({
  id: 'intro-workflow',
  kinds: ['storage', 'ec2'],
  tools: { git: ['repo'], storage: ['readObjects'], ec2: ['executeCode'] },
  custom: {
    git: { label: 'Git', service: true },
    readObjects: {
      ...catalog.readObjects,
      label: '파일 읽기',
      ports: [
        port('in', 'objects', 'objects', false, '읽을 파일'),
        port('out', 'dataset', 'dataset', false, '입력 파일'),
      ],
    },
    repo: {
      label: '코드 저장소',
      ports: [port('out', 'code', 'code', false, '실행 코드')],
      run: ({ emit }) => {
        emit(datum('code', filename + ' · ' + commit, { filename, commit }));
        return 'Git 커밋 ' + commit + '에서 ' + josa(filename, '을/를') + ' 가져왔습니다.';
      },
    },
    executeCode: {
      label: '코드 실행',
      ports: [
        port('in', 'code', 'code', false, '실행 코드'),
        port('in', 'dataset', 'dataset', false, '입력 파일'),
        port('out', 'result', 'task-result'),
      ],
      run: (ctx) => {
        const code = need(ctx, 'code', 'Git에서 가져올 코드').data;
        const file = need(ctx, 'dataset', '저장소에서 읽을 파일').data;
        const count = numbers(file, 'sampleIds').length;
        ctx.emit(
          datum('task-result', '리뷰 ' + count + '건', {
            count,
            key: file.key,
            commit: code.commit,
          }),
        );
        return josa(String(code.filename), '으로/로') + ' ' + file.key + '의 리뷰 수를 셌습니다.';
      },
    },
  },
  start: {
    label: '시작',
    ports: [port('out', 'objects', 'objects', false, '읽을 파일')],
    run: ({ emit }) => {
      emit(datum('objects', key, { key, sampleIds }));
      return josa('저장소에서 읽을 파일 ' + key, '을/를') + ' 지정했습니다.';
    },
  },
  end: {
    label: '도착',
    ports: [port('in', 'result', 'task-result')],
    run: (ctx) => {
      const result = need(ctx, 'task-result', 'EC2 작업 결과').data;
      ctx.report([
        { label: '실행한 코드의 커밋', value: String(result.commit) },
        { label: '읽은 파일', value: String(result.key) },
        { label: '리뷰 수', value: result.count + '건' },
      ]);
      return 'EC2가 센 리뷰 ' + result.count + '건이 도착했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 235 }),
      system('git', 'git', 'root', { x: 260, y: 0 }, 244, 151),
      node('repo', 'repo', 'git', { x: 24, y: 54 }),
      { ...system('storage', 'storage', 'root', { x: 260, y: 183 }, 244, 151), name: '저장소' },
      node('readObjects', 'read', 'storage', { x: 24, y: 54 }),
      system('ec2', 'ec2', 'root', { x: 580, y: 87 }, 244, 170),
      node('executeCode', 'execute', 'ec2', { x: 24, y: 54 }),
      node('end', 'end', 'root', { x: 900, y: 144 }),
    ],
    connections: [
      wired('start', 'objects', 'read', 'objects'),
      wired('execute', 'result', 'end', 'result'),
    ],
  }),
  starterTasks: [
    wired('repo', 'code', 'execute', 'code'),
    wired('read', 'dataset', 'execute', 'dataset'),
  ],
  required: ['repo', 'read', 'execute'],
  observations: {},
});
