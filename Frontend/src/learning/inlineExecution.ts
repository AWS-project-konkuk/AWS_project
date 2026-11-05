import type { NodeExampleSpec } from '../curriculum/nodeExamples';
import type { Wire } from '../weekly/types';

export function traceInline(spec: NodeExampleSpec, links: string[], extra: Wire[]) {
  const done = new Map<string, 'success' | 'failed' | 'blocked'>();
  const remaining = new Set(spec.nodes.map((node) => node.id));
  const stages: { node: string; status: 'success' | 'failed' | 'blocked'; detail: string }[] = [];
  while (remaining.size) {
    const ready = spec.nodes.filter(
      (node) =>
        remaining.has(node.id) &&
        [...spec.links, ...extra]
          .filter((link) => link.target === node.id)
          .every((link) => !remaining.has(link.source)),
    );
    if (!ready.length) {
      for (const node of remaining)
        stages.push({
          node,
          status: 'failed',
          detail: '순환 연결 때문에 입력을 계산할 수 없습니다. 연결 방향을 확인하세요.',
        });
      break;
    }
    for (const node of ready) {
      remaining.delete(node.id);
      const required = spec.links.filter((link) => link.target === node.id);
      const missing = required.filter((link) => !links.includes(link.id));
      const wrong = extra.some((link) => link.target === node.id);
      const blocked = required.some(
        (link) => links.includes(link.id) && done.get(link.source) !== 'success',
      );
      const status = missing.length || wrong ? 'failed' : blocked ? 'blocked' : 'success';
      const detail = wrong
        ? '입력 자료의 생산자 또는 입출력 포트가 맞지 않습니다. 연결을 수정하세요.'
        : missing.length
          ? `${missing.map((link) => link.label).join(', ')} 입력이 없습니다.`
          : blocked
            ? '앞 단계가 출력을 만들지 못해 실행할 수 없습니다.'
            : spec.links
                .filter((link) => link.source === node.id)
                .map((link) => `${link.label}: ${link.detail}`)
                .join(' ') || `${node.title} 단계가 입력 자료를 확인했습니다.`;
      done.set(node.id, status);
      stages.push({ node: node.id, status, detail });
    }
  }
  return stages;
}
