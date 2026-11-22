import { rootId, type Connection, type Graph, type LabConfig } from '../lab';
import { fromCatalog, type CatalogKind } from './catalog';
import { defineLab, layout } from './kit';

type WorkflowSetup = Omit<Parameters<typeof fromCatalog>[0], 'custom'> & {
  id: string;
  start: CatalogKind;
  end: CatalogKind;
  custom?: Record<string, CatalogKind>;
  initial: (tools: ReturnType<typeof layout>) => Graph;
  starterTasks: Connection[];
  required: string[];
  observations: Record<string, string>;
};

export function defineWorkflowLab(setup: WorkflowSetup): LabConfig {
  const {
    id,
    start,
    end,
    custom,
    initial,
    starterTasks,
    required,
    observations,
    kinds,
    tools,
    defaults,
    omitPorts,
  } = setup;
  const lab = defineLab({
    ...fromCatalog({
      kinds: ['root', ...kinds],
      tools,
      defaults,
      omitPorts,
      custom: { ...custom, start, end },
    }),
    id,
    storageKey: 'blockml:system-lab:' + id + ':v1',
    initial: () => {
      const make = layout(lab);
      const graph = initial(make);
      const root = make.system('root', rootId, '', { x: 0, y: 0 }, 0, 0);
      return { ...graph, entities: [root, ...graph.entities] };
    },
    starterTasks,
    requiredNodeIds: new Set(['start', ...required, 'end']),
    requiredObservations: Object.keys(observations),
    observationLabels: observations,
  });
  return lab;
}
