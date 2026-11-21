import type { Artifact, Strategy } from '../../engine';
import { type Graph, type LabConfig, type ResourceEntity, type Version } from '../../lab';
import { josa } from '../../josa';
import { appLabel } from './rules';

type Typed = 'model' | 'image' | 'control';
function required(lab: LabConfig, inputs: Artifact[], type: Typed) {
  const values = inputs.filter((a) => a.type === type) as { version: Version; source: string }[];
  if (!values.length) throw new Error(lab.materials[type] + ' 입력이 없습니다.');
  if (
    values.some(
      (v) =>
        v.version !== values[0].version || (type === 'control' && v.source !== values[0].source),
    )
  )
    throw new Error(lab.materials[type] + ' 입력의 설정이 서로 다릅니다.');
  return values[0];
}
function requests(inputs: Artifact[]) {
  const list = inputs.flatMap((a) => (a.type === 'request' ? a.requests : []));
  if (!list.length) throw new Error('요청이 도착하지 않았습니다.');
  if (new Set(list.map((a) => a.id)).size !== list.length)
    throw new Error('같은 요청이 여러 번 도착했습니다.');
  return list;
}
function deploymentImage(lab: LabConfig, graph: Graph, pod: ResourceEntity) {
  const cluster = graph.entities.find((e) => e.id === pod.parent);
  if (cluster?.type !== 'system' || !cluster.kubernetes)
    throw new Error('Kubernetes 배포 설정이 없습니다.');
  const settings = cluster.kubernetes;
  const pods = graph.entities.filter(
    (e) =>
      e.type === 'resource' &&
      e.kind === 'pod' &&
      e.parent === cluster.id &&
      appLabel(e) === settings.workloadLabel,
  );
  if (pods.length !== settings.replicas)
    throw new Error('배포 대상 Pod ' + pods.length + '개 · 원하는 수 ' + settings.replicas + '개');
  if (appLabel(pod) !== settings.workloadLabel)
    throw new Error('Pod의 라벨이 Deployment의 라벨과 다릅니다.');
  const ports = new Set(
    cluster.ports
      ?.filter((port) => port.material === 'image' && port.direction === 'in')
      .map((port) => port.id),
  );
  const sources = new Set(
    graph.connections
      .filter((edge) => edge.to.node === cluster.id && ports.has(edge.to.port))
      .map((edge) => edge.from.node),
  );
  const images = graph.entities.filter(
    (e): e is ResourceEntity => e.type === 'resource' && e.kind === 'image' && sources.has(e.id),
  );
  if (!images.length) throw new Error('Kubernetes의 이미지 입력에 컨테이너 이미지를 연결하세요.');
  return required(
    lab,
    images.map((image) => ({ type: 'image', version: image.version, source: image.id })),
    'image',
  );
}
const infer: Strategy = ({ lab, node, graph, inputs, emit }) => {
  const model = required(lab, inputs, 'model');
  const image =
    node.kind === 'pod' ? deploymentImage(lab, graph, node) : required(lab, inputs, 'image');
  const batch = requests(inputs);
  emit({
    type: 'prediction',
    responses: batch.map(({ id, viaService }) => ({
      id,
      pod: node.id,
      model: model.version,
      image: image.version,
      deployment: node.kind === 'pod' ? node.parent : '',
      viaService,
      label: id % 2 ? '긍정' : '부정',
    })),
  });
  return batch.length + '건 예측 · 모델 ' + model.version + ' · 이미지 ' + image.version;
};
export const strategies: Record<string, Strategy> = {
  start: ({ lab, node, emit }) => {
    emit({ type: 'request', requests: lab.requestIds.map((id) => ({ id })) });
    emit({ type: 'model', version: node.version, source: node.id });
    return josa('검증된 모델 ' + node.version, '과/와') + ' 리뷰 요청 10건을 보냈습니다.';
  },
  model: ({ node, emit }) => {
    emit({ type: 'model', version: node.version, source: node.id });
    return josa('검증된 모델 ' + node.version, '을/를') + ' 제공했습니다.';
  },
  image: ({ node, emit }) => {
    emit({ type: 'image', version: node.version, source: node.id });
    return josa('서빙 이미지 ' + node.version, '을/를') + ' 제공했습니다.';
  },
  deployment: () => {
    throw new Error('Kubernetes에서 배포 설정을 확인하세요.');
  },
  service: ({ node, graph, inputs, distribute }) => {
    const batch = requests(inputs);
    const count = distribute(batch.map((request) => ({ ...request, viaService: node.id })));
    if (!count) throw new Error('Service 대상 라벨에 맞는 요청 입력이 없습니다.');
    const cluster = graph.entities.find((e) => e.id === node.parent);
    const port = cluster?.type === 'system' ? cluster.kubernetes?.servicePort : undefined;
    return (
      (port ? '포트 ' + port + ' · ' : '') +
      '요청 ' +
      batch.length +
      '건을 ' +
      count +
      '개 경로로 나눴습니다.'
    );
  },
  pod: infer,
  container: infer,
  end: ({ lab, inputs, finish }) => {
    const responses = inputs.flatMap((a) => (a.type === 'prediction' ? a.responses : []));
    finish(responses);
    const ids = new Set(responses.map((r) => r.id));
    if (ids.size !== responses.length) throw new Error('중복 응답이 도착했습니다.');
    if (responses.some((r) => !lab.requestIds.includes(r.id)))
      throw new Error('알 수 없는 요청의 응답이 있습니다.');
    if (ids.size !== lab.requestIds.length)
      throw new Error(
        '응답 ' + ids.size + ' / 10건 · Pod의 입력 연결과 Service 대상 라벨을 확인하세요.',
      );
    if (responses.some((response) => !response.viaService))
      throw new Error('모든 요청은 Kubernetes Service를 거쳐야 합니다.');
    const pods = new Set(responses.map((r) => r.pod));
    if (pods.size < lab.requiredPods || responses.some((r) => !r.deployment))
      throw new Error('Deployment가 관리하는 서로 다른 Pod가 두 개 이상 요청을 처리해야 합니다.');
    const first = responses[0];
    if (
      responses.some(
        (r) =>
          r.model !== first.model || r.image !== first.image || r.deployment !== first.deployment,
      )
    )
      throw new Error('두 Pod에 같은 모델·이미지·Deployment를 연결하세요.');
    return 'Pod ' + pods.size + '개의 응답 10건이 중복 없이 도착했습니다.';
  },
};
