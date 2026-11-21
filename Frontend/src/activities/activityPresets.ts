import type { Answer } from '../curriculum/types';
import type { ActivitySpec } from './types';

type PresetGroup = {
  label: string;
  choices: { label: string; settings: Record<string, Answer> }[];
};

export const activityPresets: Partial<Record<ActivitySpec['kind'], PresetGroup>> = {
  memory: {
    label: '같은 유효 배치 예시',
    choices: [
      {
        label: '8 GiB에서 배치 32 × 1',
        settings: { vram: 8, batch: 32, accumulation: 1, precision: 'fp32' },
      },
      {
        label: '8 GiB에서 배치 16 × 2',
        settings: { vram: 8, batch: 16, accumulation: 2, precision: 'fp32' },
      },
    ],
  },
  compute: {
    label: '연산 개수 예시',
    choices: [
      { label: '연산 1개', settings: { jobs: 1 } },
      { label: '연산 128개', settings: { jobs: 128 } },
    ],
  },
  metrics: {
    label: '스파이크 관측 예시',
    choices: [
      { label: '30초 간격', settings: { interval: 30 } },
      { label: '5초 간격', settings: { interval: 5 } },
    ],
  },
};
