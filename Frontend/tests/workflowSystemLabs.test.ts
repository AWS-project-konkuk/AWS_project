import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import {
  type Connection,
  type Graph,
  type LabConfig,
  type SettingValue,
  signature,
} from '../src/systemLab/lab';
import { labConfigs, labFor } from '../src/systemLab/labs';
import { dataSupplyLab } from '../src/systemLab/labs/data-supply';
import { featuresLab } from '../src/systemLab/labs/features';
import { introWorkflowLab } from '../src/systemLab/labs/intro-workflow';
import { wired } from '../src/systemLab/labs/kit';
import { improvementLab } from '../src/systemLab/labs/model-improvement';
import { pipelineLab } from '../src/systemLab/labs/pipeline';
import { transitionLab } from '../src/systemLab/labs/transition';
import { parseSaved } from '../src/systemLab/store';

const labs = [
  introWorkflowLab,
  dataSupplyLab,
  featuresLab,
  transitionLab,
  improvementLab,
  pipelineLab,
];
const connect = (lab: LabConfig, graph: Graph, edges: Connection[] = lab.starterTasks) =>
  edges.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, lab), graph);
const run = (lab: LabConfig, graph: Graph) => runLab(graph, 'test', lab);
const set = (lab: LabConfig, graph: Graph, id: string, key: string, value: SettingValue) =>
  applyCommand(graph, { type: 'setting', id, key, value }, lab);
const metrics = (result: ReturnType<typeof run>) =>
  Object.fromEntries(result.metrics.map(({ label, value }) => [label, value]));

describe('단원 말미 시스템 실습', () => {
  it('0~9단원의 마지막 강의만 시스템 실습을 연다', () => {
    expect(Object.keys(labConfigs).sort()).toEqual([
      'feature-workflow',
      'intro-workflow',
      'pipeline-capstone',
      'rag-workflow',
      'week1-workflow',
      'week2-workflow',
      'week3-workflow',
      'week4-workflow',
      'week6-workflow',
      'week7-workflow',
    ]);
    expect(labFor('week5-workflow')).toBeUndefined();
    expect(labFor('pv-pvc')).toBeUndefined();
  });

  it('0단원에서 Git 코드와 S3 파일이 모두 들어오면 EC2가 리뷰 수를 계산한다', () => {
    const lab = introWorkflowLab;
    expect(run(lab, connect(lab, lab.initial(), lab.starterTasks.slice(0, 1))).success).toBe(false);
    expect(run(lab, connect(lab, lab.initial(), lab.starterTasks.slice(1))).success).toBe(false);
    const result = run(lab, connect(lab, lab.initial()));
    expect(result.success).toBe(true);
    expect(metrics(result)).toEqual({
      '실행한 코드의 커밋': 'a1b2c3d',
      '읽은 파일': 'reviews.csv',
      '리뷰 수': '3건',
    });
  });

  it.each(labs)('$id의 초기 그래프와 저장한 관찰을 복원한다', (lab) => {
    const graph = lab.initial();
    expect(run(lab, graph).success).toBe(false);
    const restored = parseSaved(
      JSON.stringify({
        version: 1,
        graph,
        quiz: false,
        proof: null,
        observed: lab.requiredObservations.slice(0, 1),
      }),
      lab,
    );
    expect(restored.graph).toEqual(graph);
    expect(restored.observed).toEqual(lab.requiredObservations.slice(0, 1));
  });

  it('기본 대기, 임시 캐시 손실, 유지 캐시와 묶음 읽기를 비교한다', () => {
    const lab = dataSupplyLab;
    let graph = connect(lab, lab.initial());
    let result = run(lab, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['slow-supply']);
    expect(metrics(result)['GPU 데이터 대기율']).toBe('70%');
    graph = set(lab, graph, 'batch', 'cache', 'on');
    expect(run(lab, graph).observations).toEqual(['cache-lost']);
    graph = set(lab, graph, 'batch', 'storage', 'persistent');
    expect(metrics(run(lab, graph))['GPU 공급량']).toBe('60배치/초');
    graph = set(lab, graph, 'batch', 'shard', 'on');
    result = run(lab, graph);
    expect(result.success).toBe(true);
    expect(metrics(result)).toMatchObject({
      'GPU 공급량': '120배치/초',
      'Pod 교체 후 캐시': '보존',
      '원본 / 저장된 모델': 'train-v1 / models/model-v1.bin',
    });
  });

  it('학습 시각의 누수를 막고 같은 정의의 두 집계 창을 비교한다', () => {
    const lab = featuresLab;
    let graph = connect(lab, lab.initial());
    expect(run(lab, graph).message).toContain('추론 피처가 도착하지 않았습니다');
    expect(metrics(run(lab, graph))['학습 피처']).toBe('24시간 · 6회 (10:00 기준)');
    graph = applyCommand(
      graph,
      { type: 'add', parent: 'feature-store', kind: 'lookupFeature', id: 'latest' },
      lab,
    );
    graph = connect(lab, graph, [
      wired('definition', 'definition', 'latest', 'definition'),
      wired('start', 'serve', 'latest', 'query'),
      wired('latest', 'feature', 'end', 'serve'),
    ]);
    const leaked = run(lab, set(lab, graph, 'history', 'asOf', 'now'));
    expect(leaked.success).toBe(false);
    expect(metrics(leaked)['학습 기준 이후 클릭']).toBe('2회');
    expect(run(lab, set(lab, graph, 'latest', 'asOf', 'cutoff')).message).toContain('현재 시각');
    const daily = run(lab, graph);
    expect(daily.success).toBe(true);
    expect(metrics(daily)).toMatchObject({
      '학습 피처': '24시간 · 6회 (10:00 기준)',
      '추론 피처': '24시간 · 8회 (11:15 기준)',
    });
    const oldGraph = {
      ...graph,
      entities: graph.entities.map((entity) =>
        entity.id === 'history'
          ? { ...entity, kind: 'historicalFeature' }
          : entity.id === 'latest'
            ? { ...entity, kind: 'latestFeature', settings: undefined }
            : entity,
      ),
    };
    const saved = parseSaved(
      JSON.stringify({ version: 1, graph: oldGraph, proof: signature(oldGraph), quiz: true }),
      lab,
    );
    expect(saved.graph).toEqual(graph);
    expect(saved.proof).toBe(signature(graph));
    graph = set(lab, graph, 'definition', 'window', '1');
    expect(metrics(run(lab, graph))).toMatchObject({
      '학습 피처': '1시간 · 3회 (10:00 기준)',
      '추론 피처': '1시간 · 2회 (11:15 기준)',
    });
    graph = applyCommand(
      graph,
      {
        type: 'add',
        parent: 'feature-store',
        kind: 'defineFeature',
        id: 'other-definition',
      },
      lab,
    );
    const alternative = graph.entities.find((item) => item.id === 'other-definition');
    expect(alternative).toBeDefined();
    expect(
      applyCommand(graph, { type: 'remove', id: 'other-definition' }, lab).entities,
    ).not.toContainEqual(alternative);
    expect(() => applyCommand(graph, { type: 'remove', id: 'definition' }, lab)).toThrow();
    expect(run(lab, applyCommand(graph, { type: 'remove', id: 'latest' }, lab)).success).toBe(
      false,
    );
  });

  it('전환 공백을 감지하고 Canary와 Shadow의 결과를 다르게 집계한다', () => {
    const lab = transitionLab;
    let graph = lab.initial();
    expect(graph.entities.filter((e) => e.kind === 'infer')).toHaveLength(1);
    graph = applyCommand(graph, { type: 'add', parent: 'gateway', kind: 'infer', id: 'new' }, lab);
    graph = connect(lab, graph, [
      wired('router', 'new', 'new', 'request'),
      wired('start', 'new', 'new', 'model'),
      wired('new', 'prediction', 'observe', 'prediction'),
    ]);
    const interrupted = run(lab, graph);
    expect(interrupted.success).toBe(false);
    expect(interrupted.observations).toEqual(['release-gap']);
    expect(metrics(interrupted)['전환 중 실패']).toBe('20건');
    const blueGreen = run(lab, set(lab, graph, 'router', 'strategy', 'blue-green'));
    expect(blueGreen.success).toBe(false);
    expect(blueGreen.message).toContain('이번 배포를 반려합니다');
    expect(blueGreen.observations).toEqual(['switch-gap']);
    expect(metrics(blueGreen)['전환 중 실패']).toBe('5건');
    graph = set(lab, graph, 'router', 'strategy', 'canary');
    expect(run(lab, graph).success).toBe(true);
    expect(metrics(run(lab, graph))['신규 모델 사용자 응답']).toBe('10건');
    graph = set(lab, graph, 'router', 'strategy', 'shadow');
    graph = set(lab, graph, 'router', 'share', '50');
    const shadow = run(lab, graph);
    expect(shadow.success).toBe(true);
    expect(metrics(shadow)).toMatchObject({
      '사용자 응답': '100건',
      '신규 모델 사용자 응답': '0건',
      'Shadow 비교 로그': '50건',
    });
    graph = applyCommand(graph, { type: 'remove', id: 'new' }, lab);
    expect(run(lab, graph).success).toBe(false);
  });

  it('지표 수집을 추가해 지연을 읽고 갱신 주기를 줄여 배포 승인을 받는다', () => {
    const lab = improvementLab;
    let graph = lab.initial();
    expect(graph.entities.some((e) => e.kind === 'collectMetrics')).toBe(false);
    graph = applyCommand(
      graph,
      { type: 'add', parent: 'monitoring', kind: 'collectMetrics', id: 'collect' },
      lab,
    );
    graph = connect(lab, graph, [
      wired('start', 'metrics', 'collect', 'metrics'),
      wired('start', 'labels', 'collect', 'labels'),
      wired('collect', 'signal', 'diagnose', 'signal'),
    ]);
    let result = run(lab, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['quality-drop', 'low-quality']);
    expect(result.steps.find(({ node }) => node === 'collect')?.message).toContain(
      '갱신 지연 120분',
    );
    expect(result.steps.find(({ node }) => node === 'evaluate')?.message).toContain('정확도 0.72');
    graph = set(lab, graph, 'diagnose', 'correction', 'fresh');
    result = run(lab, graph);
    expect(result.success).toBe(true);
    expect(metrics(result)).toMatchObject({
      'HTTP 성공률': '99.9%',
      '현재 모델 정확도': '0.72',
      '후보 모델 평가 정확도': '0.90',
      '개선한 피처 갱신 주기': '15분',
      '배포 모델': 'feature-fix-v2',
    });
  });

  it('학습 표본과 평가 미달을 차단한 뒤 등록 모델로 운영 보고를 만든다', () => {
    const lab = pipelineLab;
    let graph = connect(lab, lab.initial(), lab.starterTasks.slice(1));
    let result = run(lab, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['split-leak']);
    graph = applyCommand(
      graph,
      {
        type: 'disconnect',
        ids: [wired('partition', 'train', 'evaluate', 'dataset').id],
      },
      lab,
    );
    graph = connect(lab, graph, lab.starterTasks.slice(0, 1));
    result = run(lab, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['low-quality']);
    graph = set(lab, graph, 'evaluate', 'threshold', 0.8);
    result = run(lab, graph);
    expect(result.success).toBe(true);
    expect(metrics(result)).toMatchObject({
      '평가 결과': '0.85 · 승인',
      '등록 모델 ID': 'model-v1',
      '사용자 응답': '10건',
      '운영 보고': '응답 10건 관측 · 다음 실행의 입력 후보',
    });
  });
});
