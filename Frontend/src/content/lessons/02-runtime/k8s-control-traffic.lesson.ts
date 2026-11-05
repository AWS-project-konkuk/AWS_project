import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'k8s-control-traffic',
  unit: 1,
  order: 2,
  title: 'Pod 배치와 요청 전달의 경로 나누기',
  summary:
    'GPU 서버에 Pod를 배치했는데 Service로 보낸 요청이 도착하지 않습니다. 올바른 노드에 배치됐다는 사실만으로 요청 대상이 되는 것은 아닙니다.',
  scenario:
    'GPU 서버에 Pod를 배치했는데 Service로 보낸 요청이 도착하지 않습니다. 올바른 노드에 배치됐다는 사실만으로 요청 대상이 되는 것은 아닙니다.',
  concepts: ['같은 환경에서 실행하기', 'Pod 배치와 요청 전달의 경로 나누기'],
  assessment: {
    question: '배치는 됐지만 Service 대상에서 빠진 Pod는 무엇을 확인해야 할까요?',
    options: [
      'Pod 라벨·Service selector·준비 상태와 포트',
      'etcd가 사용자 HTTP 요청을 직접 전달하는지',
    ],
    correct: 0,
    explanation:
      'Deployment → ReplicaSet → Pod 생성·배치 → kubelet 실행이라는 제어 흐름과 클라이언트 → Service → 선택된 준비 상태의 Pod라는 요청 흐름을 구분합니다. nodeSelector는 노드 라벨을, Service selector는 Pod 라벨을 봅니다. 노드 라벨이 Pod에 자동 복사되는 것은 아닙니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution:
    '컨테이너는 호스트 커널을 공유합니다. 이미지가 같아도 GPU 드라이버나 외부 설정이 다를 수 있습니다. Deployment의 복제본 유지와 HPA의 부하 기반 확장은 별도 기능입니다.',
  reflection: '배치는 됐지만 Service 대상에서 빠진 Pod는 무엇을 확인해야 할까요?',
  references: [
    {
      title: '원문 · MLOps 2주차 · 실제 도구 실습',
      url: 'https://www.notion.so/f14ebb1cb38a82d6b28501d3693fd20e',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/overview/components/',
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
