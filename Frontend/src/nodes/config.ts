import { isService, settingErrors, type ResourceConfig } from '../console/resources';
export function nodeErrors(node: ResourceConfig, others: ResourceConfig[] = []): string[] {
  if (!isService(node.service)) return ['알 수 없는 노드 종류입니다.'];
  const errors = settingErrors(node);
  if (!node.name.trim() || node.name.length > 63) errors.push('노드 이름은 1~63자로 입력하세요.');
  if (others.some((other) => other.service === node.service && other.name === node.name.trim()))
    errors.push('같은 종류의 노드 이름이 중복됩니다.');
  return errors;
}
export function parseNodeConfig(value: unknown): ResourceConfig {
  if (
    !value ||
    typeof value !== 'object' ||
    !('service' in value) ||
    !isService(value.service) ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('settings' in value) ||
    !value.settings ||
    typeof value.settings !== 'object' ||
    Array.isArray(value.settings)
  )
    throw new Error('노드 설정을 읽을 수 없습니다.');
  const node = {
    service: value.service,
    name: value.name,
    settings: { ...value.settings },
  } as ResourceConfig;
  if (nodeErrors(node).length) throw new Error('노드 설정이 유효하지 않습니다.');
  return node;
}
