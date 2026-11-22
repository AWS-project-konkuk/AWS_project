import type { CatalogKind } from '.';
import { catalog } from '.';
import { findPort, type Graph, type SettingValue } from '../../lab';
import { choice } from '../kit';

/**
 * 입출력 포트를 학습자가 조절할 수 있으면 포트 구성만 다른 노드를 하나로 합칠 수 있다.
 * 합친 노드는 "변형" 하나를 설정으로 고르고, 실행은 원래 노드의 로직에 그대로 맡긴다.
 */
export interface Variant {
  id: string;
  label: string;
  /** 실행과 기본 포트를 가져올 원래 노드. */
  from: string;
  /** 원래 노드가 읽는 설정을 이 변형의 값으로 고정한다. */
  settings?: Record<string, SettingValue>;
}
export interface MergedSpec {
  label: string;
  key: string;
  settingLabel: string;
  help: string;
  variants: Variant[];
}

const source = (variant: Variant) => {
  const kind = catalog[variant.from];
  if (!kind?.run) throw new Error(variant.from + ' 노드를 찾을 수 없습니다.');
  return kind;
};
const portsOf = (variant: Variant) => source(variant).ports ?? [];

export function mergedKind(spec: MergedSpec): CatalogKind {
  const [first] = spec.variants;
  const ins = new Set<string>();
  const outs = new Set<string>();
  for (const variant of spec.variants)
    for (const p of portsOf(variant)) (p.direction === 'in' ? ins : outs).add(p.material);
  return {
    label: spec.label,
    ports: portsOf(first),
    extra: { in: [...ins], out: [...outs] },
    settings: [
      choice(
        spec.key,
        spec.settingLabel,
        first.id,
        spec.variants.map((v): [string, string] => [v.id, v.label]),
        spec.help,
      ),
    ],
    run: (ctx) => {
      const variant =
        spec.variants.find((v) => v.id === ctx.node.settings?.[spec.key]) ?? spec.variants[0];
      return source(variant).run!({
        ...ctx,
        node: { ...ctx.node, settings: { ...variant.settings } },
      });
    },
  };
}

/** 변형을 바꾸면 포트를 그 변형의 기본 구성으로 맞추고, 더는 맞지 않는 연결을 지운다. */
export function syncVariantPorts(
  specs: Record<string, MergedSpec>,
  graph: Graph,
  id: string,
  key: string,
  value: SettingValue,
): Graph {
  const node = graph.entities.find((e) => e.id === id);
  const spec = node && specs[node.kind];
  const variant = spec?.key === key ? spec.variants.find((v) => v.id === value) : undefined;
  if (!node || node.type !== 'resource' || !variant) return graph;
  const ports = portsOf(variant);
  const next = {
    ...graph,
    entities: graph.entities.map((e) => (e.id === id ? { ...node, ports: [...ports] } : e)),
  };
  const valid = (endpoint: { node: string; port: string }) =>
    endpoint.node !== id || findPort(next, endpoint) !== undefined;
  return {
    ...next,
    connections: next.connections.filter((c) => {
      if (!valid(c.from) || !valid(c.to)) return false;
      const from = findPort(next, c.from);
      const to = findPort(next, c.to);
      return !!from && !!to && from.material === to.material;
    }),
  };
}
