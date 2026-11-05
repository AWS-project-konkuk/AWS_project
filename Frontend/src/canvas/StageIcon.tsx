import {
  Database,
  SlidersHorizontal,
  BrainCircuit,
  ScanLine,
  PackageCheck,
  Radio,
  type LucideProps,
} from 'lucide-react';
import type { NodeKind } from '../workflow/types';
const icons = {
  dataset: Database,
  preprocess: SlidersHorizontal,
  training: BrainCircuit,
  evaluation: ScanLine,
  registry: PackageCheck,
  serving: Radio,
};
export function StageIcon({ kind, ...props }: LucideProps & { kind: NodeKind }) {
  const Icon = icons[kind];
  return <Icon size={19} strokeWidth={1.7} {...props} />;
}
