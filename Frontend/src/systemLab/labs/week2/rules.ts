import {
  connection,
  findPort,
  type Connection,
  type Graph,
  type KubernetesSettings,
  type PortSpec,
  type ResourceEntity,
  type SystemEntity,
} from '../../lab';

export const defaultKubernetes: KubernetesSettings = {
  imageId: '',
  replicas: 2,
  workloadLabel: 'review',
  serviceSelector: 'review',
  servicePort: 80,
};
export const defaultClusterPorts = (): PortSpec[] => [
  { id: 'in-image', material: 'image', direction: 'in', multiple: false },
];
export const endpointId = (id: string) => (id === 'kubernetes' ? 'service' : id + '-endpoint');
export const appLabel = (pod: ResourceEntity) => pod.appLabel ?? 'review';
export function clusterImages(graph: Graph, cluster: SystemEntity): ResourceEntity[] {
  const stores = new Set(
    graph.entities
      .filter((e) => e.kind === 'docker' && e.parent === cluster.parent)
      .map((e) => e.id),
  );
  return graph.entities.filter(
    (e): e is ResourceEntity => e.type === 'resource' && e.kind === 'image' && stores.has(e.parent),
  );
}
export function serviceRoutes(graph: Graph): Connection[] {
  return graph.entities.flatMap((service) => {
    if (service.kind !== 'service') return [];
    const cluster = graph.entities.find((entity) => entity.id === service.parent);
    if (cluster?.type !== 'system' || !cluster.kubernetes || !cluster.kubernetes.serviceSelector)
      return [];
    return graph.entities.flatMap((pod) => {
      if (
        pod.type !== 'resource' ||
        pod.kind !== 'pod' ||
        pod.parent !== cluster.id ||
        appLabel(pod) !== cluster.kubernetes?.serviceSelector
      )
        return [];
      const input = pod.ports.find(
        (port) => port.direction === 'in' && port.material === 'request',
      );
      return input ? [connection(service.id, 'service-route', pod.id, input.id)] : [];
    });
  });
}
export function manualIssue(graph: Graph, edge: Connection): string | undefined {
  const from = graph.entities.find((e) => e.id === edge.from.node);
  const to = graph.entities.find((e) => e.id === edge.to.node);
  if (from?.kind === 'kubernetes' || from?.kind === 'service' || from?.kind === 'deployment')
    return '이 경로는 Kubernetes 설정에서 지정하세요.';
  if (to?.kind === 'kubernetes' && from?.kind !== 'image')
    return 'Kubernetes에는 컨테이너 이미지만 연결하세요.';
  if (to?.kind === 'pod' && findPort(graph, edge.to)?.material !== 'model')
    return 'Pod의 요청과 이미지는 Kubernetes 설정을 따릅니다.';
}
