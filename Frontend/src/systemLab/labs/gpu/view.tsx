import {
  Blocks,
  Boxes,
  CircleCheck,
  CirclePlay,
  Cpu,
  Layers,
  Merge,
  Package,
  Save,
  Split,
  TrendingDown,
} from 'lucide-react';
import type { LabView } from '../../labContext';
import { kindClass, tone } from '../palette';

export const gpuView: LabView = {
  title: 'GPU 두 장 학습 실습',
  description:
    '24GiB 모델 상태를 16GiB GPU 두 장에서 학습하세요. 먼저 데이터 병렬의 OOM을 관찰한 뒤, 병렬 전략을 바꿔 두 워커를 모두 사용해 완료합니다.',
  ariaLabel: 'GPU 병렬 학습 시스템 실습',
  entry:
    '데이터 병렬의 OOM을 먼저 확인하고, 병렬 전략을 바꿔 두 워커가 주고받는 자료와 통신량을 비교하세요.',
  icons: {
    root: Layers,
    gpu: Cpu,
    start: CirclePlay,
    end: CircleCheck,
    split: Split,
    worker: Cpu,
    merge: Merge,
  },
  materialIcons: {
    batch: Package,
    model: Boxes,
    task: Blocks,
    gradient: TrendingDown,
    activation: Layers,
    partial: Blocks,
    checkpoint: Save,
  },
  tones: {
    batch: tone.blue,
    model: tone.purple,
    task: tone.teal,
    gradient: tone.green,
    activation: tone.orange,
    partial: tone.pink,
    checkpoint: tone.gold,
  },
  kindColors: {
    gpu: kindClass.olive,
    start: kindClass.green,
    end: kindClass.slate,
    split: kindClass.teal,
    worker: kindClass.olive,
    merge: kindClass.purple,
  },
  hints: {
    root: '서비스를 선택하면 아래에서 만들 수 있는 작업 노드를 볼 수 있습니다.',
    gpu: '작업 분할, GPU 워커, 결과 결합을 담는 학습 서비스입니다. 병렬 전략과 통신 비용은 이 서비스의 설정입니다.',
    start: '학습 배치 64개와 24GiB 모델 학습 상태를 각각의 출력으로 제공합니다.',
    end: '갱신된 체크포인트와 장치당 메모리, 통신량을 확인합니다.',
    split: '병렬 전략에 따라 배치·레이어·행렬을 두 작업 조각으로 나눕니다.',
    worker:
      '받은 작업 조각을 한 장의 GPU에서 계산합니다. 모델 상태가 GPU 메모리를 넘으면 OOM으로 실패합니다.',
    merge: '두 워커의 결과를 합쳐 체크포인트를 갱신합니다.',
  },
  panels: {
    end: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>체크포인트 입력 · 완료 조건</h4>
        <ol>
          <li>16GiB 장치 두 장에서 데이터 병렬이 OOM이 나는 것을 관찰합니다.</li>
          <li>레이어 또는 텐서 분할로 두 워커를 모두 사용해 완료합니다.</li>
          <li>워커가 주고받는 자료 종류와 통신량을 결과에서 확인합니다.</li>
        </ol>
        <p>실행 성공 뒤 결과 패널의 이해 확인과 남은 관찰을 완료하세요.</p>
      </section>
    ),
  },
};
