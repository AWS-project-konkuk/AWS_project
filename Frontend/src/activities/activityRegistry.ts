import { MachineActivity } from './MachineActivity';
import { VirtualActivity } from './VirtualActivity';
import { SimulationActivity } from './SimulationActivity';
import type { ActivityDefinition, ActivityKind } from './types';

const simulation: ActivityDefinition = {
  component: SimulationActivity,
  summary: '선택 활동 · 결과를 예측하고 비교하기',
};

// 독립적인 조작 방식이 필요한 활동을 등록합니다.
// 나머지는 기존 데이터 기반 시뮬레이션 본문을 재사용합니다.
const activities: Partial<Record<ActivityKind, ActivityDefinition>> = {
  machine: {
    component: MachineActivity,
    summary: '선택 활동 · EC2와 프로그램을 따로 실행해 보기',
    title: '컴퓨터를 켜면 학습도 시작될까요?',
    label: 'EC2 시작과 프로그램 실행 실습',
  },
  virtual: {
    component: VirtualActivity,
    summary: '비교 실습 · 앱을 늘리며 커널 위치 확인하기',
    title: '앱을 하나 더 넣으면, 커널도 하나 더 필요할까요?',
    label: 'VM과 컨테이너 구조 비교 실습',
  },
};

export function getActivityDefinition(kind: ActivityKind): ActivityDefinition {
  return activities[kind] ?? simulation;
}
