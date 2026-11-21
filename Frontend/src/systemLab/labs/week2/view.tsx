import {
  Box,
  Cable,
  CircleCheck,
  CirclePlay,
  Cpu,
  FileBox,
  FileCog,
  Layers,
  Network,
  Package,
  Route,
  Send,
  Server,
} from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { NativeSelect } from '../../../components/ui/native-select';
import { hint } from '../../appearance';
import type { LabView } from '../../labContext';
import type { Version } from '../../lab';
import { appLabel } from './rules';

const panel = 'py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5';

export const week2View: LabView = {
  title: '모델 서빙 실습',
  description:
    '이미지를 `Kubernetes`에 연결하세요. 요청은 처음부터 내부 `Service`로 들어옵니다. 두 `Pod`에 모델을 전달하고 각 응답을 도착에 연결하세요.',
  ariaLabel: 'Docker·Kubernetes 시스템 실습',
  entry: '입출력을 연결하고 두 Pod가 Service를 통해 응답하는지 확인하세요.',
  icons: {
    root: Layers,
    ec2: Server,
    docker: Package,
    kubernetes: Network,
    start: CirclePlay,
    end: CircleCheck,
    model: FileBox,
    image: Box,
    deployment: FileCog,
    service: Route,
    pod: Cpu,
    container: Package,
  },
  materialIcons: {
    request: Send,
    prediction: CircleCheck,
    model: FileBox,
    image: Box,
    control: Cable,
  },
  tones: {
    request: 'var(--lab-request)',
    prediction: 'var(--lab-prediction)',
    model: 'var(--lab-model)',
    image: 'var(--lab-image)',
    control: 'var(--lab-control)',
  },
  hints: {
    root: '시스템을 선택하면 아래에서 만들 수 있는 도구를 볼 수 있습니다.',
    ec2: 'Docker와 Kubernetes를 배치할 실행 환경입니다.',
    docker: '서빙 앱을 실행할 이미지와 컨테이너를 준비합니다.',
    kubernetes: 'Pod의 실행과 요청 전달을 구성합니다.',
    start: '학습된 모델 파일과 리뷰 요청 10건을 각각의 출력 포트로 제공합니다.',
    end: '두 Pod의 응답 10건이 빠짐없이 도착했는지 확인합니다.',
    model: '학습과 평가를 마친 예제 모델을 제공합니다.',
    image: '서빙 앱과 의존성을 묶은 실행 자료입니다. Pod가 이 이미지로 컨테이너를 시작합니다.',
    deployment: 'Pod의 수와 사용할 이미지 버전을 지정합니다.',
    service:
      '리뷰 요청을 받아 대상 라벨이 맞는 Pod로 전달합니다. 대상 라벨과 네트워크 포트는 Kubernetes 설정에서 바꿀 수 있습니다.',
    pod: '이미지의 서빙 앱이 모델을 읽고 예측 응답을 만듭니다.',
    container: '이미지와 모델을 사용해 예제 요청을 처리합니다.',
  },
  panels: {
    start: (_, lab) => (
      <section className={panel}>
        <h4>제공 데이터</h4>
        <ol>
          <li>
            <strong>요청 출력</strong> · 분류할 리뷰 요청 {lab.requestIds.length}건을 제공합니다.
            요청마다 고유 ID가 있습니다. Kubernetes 내부 Service의 요청 입력에 연결하세요.
          </li>
          <li>
            <strong>모델 출력</strong> · 학습된 모델 파일 <code>model.pkl</code>을 제공합니다. 각
            Pod의 모델 입력에 연결하세요.
          </li>
        </ol>
      </section>
    ),
    end: (_, lab) => (
      <section className={panel}>
        <h4>응답 입력 · 완료 조건</h4>
        <ol>
          <li>서로 다른 Pod {lab.requiredPods}개 이상이 요청을 처리해야 합니다.</li>
          <li>
            출발의 리뷰 요청 {lab.requestIds.length}건에 대한 응답이 모두 도착해야 합니다. 누락,
            중복, 알 수 없는 요청 ID는 허용하지 않습니다.
          </li>
          <li>모든 요청은 Kubernetes 내부 Service를 거쳐야 합니다.</li>
          <li>응답을 보낸 Pod는 같은 배포에 속하며, 같은 모델과 이미지를 사용해야 합니다.</li>
        </ol>
        <p>실행에 성공한 뒤 왼쪽 패널의 이해 확인을 완료하세요.</p>
      </section>
    ),
  },
  systemSettings: ({ node, graph, dispatch, PortList }) => {
    if (node.type !== 'system' || !node.kubernetes) return null;
    const config = node.kubernetes;
    const edit = (patch: Partial<typeof config>) =>
      dispatch({ type: 'cluster', id: node.id, patch });
    return (
      <>
        <h4>Deployment</h4>
        <p className={hint}>이미지는 Kubernetes 옆면에, 요청은 내부 Service에 연결하세요.</p>
        <PortList node={node} graph={graph} direction="in" dispatch={dispatch} />
        <label>
          원하는 Pod 수
          <Input
            type="number"
            min={1}
            max={10}
            key={config.replicas}
            defaultValue={config.replicas}
            onBlur={(e) => {
              if (!edit({ replicas: Number(e.target.value) }))
                e.target.value = String(config.replicas);
            }}
          />
        </label>
        <label>
          배포 Pod 라벨
          <Input
            key={config.workloadLabel}
            defaultValue={config.workloadLabel}
            onBlur={(e) => {
              if (!edit({ workloadLabel: e.target.value.trim() }))
                e.target.value = config.workloadLabel;
            }}
          />
        </label>
        <h4>Service</h4>
        <label>
          대상 Pod 라벨
          <Input
            key={config.serviceSelector}
            defaultValue={config.serviceSelector}
            onBlur={(e) => {
              if (!edit({ serviceSelector: e.target.value.trim() }))
                e.target.value = config.serviceSelector;
            }}
          />
        </label>
        <label>
          Service 포트
          <Input
            type="number"
            min={1}
            max={65535}
            key={config.servicePort}
            defaultValue={config.servicePort}
            onBlur={(e) => {
              if (!edit({ servicePort: Number(e.target.value) }))
                e.target.value = String(config.servicePort);
            }}
          />
        </label>
      </>
    );
  },
  resourceHeader: ({ node, dispatch }) =>
    node.type === 'resource' && node.kind === 'pod' ? (
      <label>
        Pod 라벨
        <Input
          key={appLabel(node)}
          defaultValue={appLabel(node)}
          onBlur={(e) => {
            if (!dispatch({ type: 'pod-label', id: node.id, value: e.target.value.trim() }))
              e.target.value = appLabel(node);
          }}
        />
      </label>
    ) : null,
  resourceSettings: ({ node, dispatch }) => {
    if (node.type !== 'resource') return null;
    return (
      <>
        {['model', 'image', 'deployment'].includes(node.kind) && (
          <label>
            {node.kind === 'model' ? '모델 버전' : '이미지 태그'}
            <NativeSelect
              value={node.version}
              onChange={(e) =>
                dispatch({ type: 'settings', id: node.id, version: e.target.value as Version })
              }
            >
              <option value="v1">v1</option>
              <option value="v2">v2</option>
            </NativeSelect>
          </label>
        )}
        {node.kind === 'deployment' && (
          <label>
            원하는 Pod 수
            <NativeSelect
              value={node.replicas}
              onChange={(e) =>
                dispatch({ type: 'settings', id: node.id, replicas: Number(e.target.value) })
              }
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}개
                </option>
              ))}
            </NativeSelect>
          </label>
        )}
      </>
    );
  },
};
