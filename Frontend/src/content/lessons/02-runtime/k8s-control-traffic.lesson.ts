import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'k8s-control-traffic',
  unit: 1,
  order: 7,
  title: 'Pod 배치와 요청 전달의 경로 나누기',
  minutes: 14,
  summary:
    '선언이 실제 Pod 실행으로 이어지는 제어 경로와 Service가 앱에 요청을 전달하는 경로를 나누어 추적합니다.',
  scenario:
    '배치·실행·준비·대상 선택·포트를 나누어 확인하고, nodeSelector와 Service selector가 보는 라벨을 구분합니다.',
  concepts: ['Control Plane', 'Scheduler·kubelet', 'Service selector', 'readiness·포트'],
  assessment: {
    question: 'Pod는 배치되어 실행 중인데 Service 요청에 응답하지 않습니다. 먼저 확인할 것은?',
    options: [
      'Pod 라벨·Service selector·준비 상태·앱 수신 주소와 포트',
      'etcd가 리뷰의 긍정·부정을 계산하는지',
    ],
    correct: 0,
    explanation:
      '실행 위치 결정과 사용자 요청 전달은 별도 경로입니다. Service의 Pod 선택 조건과 준비 상태, 대상 앱이 요청을 받는 주소·포트를 확인합니다. nodeSelector는 노드 라벨을, Service selector는 Pod 라벨을 봅니다.',
  },
  caution: '제어 관계와 사용자 요청을 같은 화살표로 합치지 않습니다. Running과 Ready도 구분합니다.',
  reflection: 'nodeSelector와 Service selector가 서로 다른 라벨을 확인하는 이유는 무엇인가요?',
  references: [
    {
      title: '원문 · MLOps 2주차 · 컨테이너 원리와 Kubernetes 실습',
      url: 'https://www.notion.so/f14ebb1cb38a82d6b28501d3693fd20e',
    },
    {
      title: '원문 · DevOps 6차시 · Docker와 AWS 컨테이너 서비스',
      url: 'https://www.notion.so/392ebb1cb38a8286b9b501e0da4e0fdc',
    },
    {
      title: '원문 · Docker에 대한 상세 · 실행 환경과 명령',
      url: 'https://www.notion.so/36cebb1cb38a802d8d0fec8b47a33a22',
    },
    {
      title: 'Kubernetes 공식 · 클러스터 구성 요소',
      url: 'https://kubernetes.io/docs/concepts/overview/components/',
    },
    {
      title: 'Kubernetes 공식 · Service',
      url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
    },
    {
      title: 'Kubernetes 공식 · 상태 검사',
      url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  nodeExample: {
    id: 'control-vs-request',
    title: '제어 경로와 사용자 요청 경로 나누기',
    prompt:
      'Deployment가 원하는 상태를 관리하는 관계와 Service가 요청을 전달하는 관계를 서로 다른 포트로 읽어보세요.',
    nodes: [
      {
        id: 'controller',
        title: 'Deployment',
        purpose: '원하는 Pod 구성과 복제본을 선언합니다.',
        x: 0,
        y: 0,
      },
      {
        id: 'service',
        title: 'Service',
        purpose: '라벨과 준비 상태가 맞는 Pod를 대상으로 합니다.',
        x: 0,
        y: 260,
      },
      {
        id: 'pod',
        title: '모델 Pod',
        purpose: '선언에 따라 실행되고 요청을 처리합니다.',
        x: 350,
        y: 110,
      },
    ],
    links: [
      {
        id: 'controller-pod',
        source: 'controller',
        target: 'pod',
        label: '원하는 실행 상태',
        detail: 'Deployment·ReplicaSet의 제어 관계를 단순화했습니다. 사용자 요청 본문이 아닙니다.',
        material: 'control',
      },
      {
        id: 'service-pod',
        source: 'service',
        target: 'pod',
        label: '추론 요청',
        detail: 'Service의 대상 Pod로 사용자 요청을 전달합니다.',
        material: 'request',
      },
    ],
    practiceHint:
      '사용자 요청은 Service에서 Pod로 갑니다. Deployment를 HTTP 요청 전달자로 연결하지 마세요.',
    nextLesson: 'week2-workflow',
    kind: '구성 관계',
    afterSection: 2,
  },
});
