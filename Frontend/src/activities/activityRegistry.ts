import { FeatureStoreActivity } from './FeatureStoreActivity';
import { IoActivity } from './IoActivity';
import { MachineActivity } from './MachineActivity';
import { NumberActivity } from './NumberActivity';
import { ParallelScene, ReleaseScene, SearchScene } from './SimulationScenes';
import { StorageActivity } from './StorageActivity';
import { VirtualActivity } from './VirtualActivity';
import { ScenarioScene, StructureScene } from './Visual';

export const dedicatedActivities = {
  machine: MachineActivity,
  virtual: VirtualActivity,
  storage: StorageActivity,
  io: IoActivity,
  'feature-store': FeatureStoreActivity,
};

export const simulationScenes = {
  numbers: NumberActivity,
  search: SearchScene,
  parallel: ParallelScene,
  release: ReleaseScene,
  structure: StructureScene,
  scenario: ScenarioScene,
};
