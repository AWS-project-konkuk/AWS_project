import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week2-workflow',
  unit: 1,
  order: 8,
  title: '실습',
  minutes: 30,
  summary:
    '이미지 버전과 장애 복구 설정을 하나씩 바꿔 서비스를 복구하고, 로컬 추가 실습에서 실행본과 응답을 확인합니다.',
  scenario:
    '이미지·관리 선언·요청 경로를 나누어 연결하고, 버전 불일치와 장애를 각각 수정한 뒤 응답을 비교합니다.',
  concepts: ['노드 종합 실습', '이미지 버전', 'Pod 교체', '요청·응답 확인'],
  caution:
    '브라우저는 교육용 모형입니다. 실제 실습에서는 컨테이너 재시작과 Pod 교체, Service 경로와 port-forward의 검증 범위를 구분합니다.',
  reflection:
    '새 이미지를 만드는 일, 배포 이미지를 바꾸는 일, 요청이 도착하는 일을 각각 어떻게 확인했나요?',
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
      title: 'Docker 공식 · 컨테이너 실행',
      url: 'https://docs.docker.com/get-started/docker-concepts/running-containers/',
    },
    {
      title: 'Minikube 공식 · 시작하기',
      url: 'https://minikube.sigs.k8s.io/docs/start/',
    },
    {
      title: 'Kubernetes 공식 · kubectl 설치',
      url: 'https://kubernetes.io/docs/tasks/tools/',
    },
    {
      title: 'Kubernetes 공식 · Deployment',
      url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
    },
    {
      title: 'Kubernetes 공식 · Service',
      url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
    },
    {
      title: 'Kubernetes 공식 · port-forward',
      url: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_port-forward/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
  workflow: 'week2-workflow',
  experiment: '워크플로 실행',
  nodes: [
    {
      id: 'image',
      title: '이미지 빌드',
      detail: '코드·의존성으로 실행 템플릿을 만듭니다.',
    },
    {
      id: 'controller',
      title: 'Deployment',
      detail: '두 복제본과 이미지 버전을 선언합니다.',
    },
    {
      id: 'requests',
      title: '요청 10건',
      detail: '예측 요청이 Service에 도착합니다.',
    },
    {
      id: 'service',
      title: 'Service',
      detail: '요청을 두 Pod 경로로 분배합니다.',
    },
    {
      id: 'pod1',
      title: 'Pod 1',
      detail: '장애 후 같은 이미지로 교체되는 복제본입니다.',
    },
    {
      id: 'pod2',
      title: 'Pod 2',
      detail: '같은 이미지로 실행하는 두 번째 복제본입니다.',
    },
    {
      id: 'response',
      title: '사용자 응답',
      detail: '두 복제본의 처리 결과를 확인합니다.',
    },
  ],
  fields: [
    {
      id: 'image',
      label: '빌드한 이미지 태그',
      initial: 'v2',
      options: [
        {
          value: 'v1',
          label: 'v1',
        },
        {
          value: 'v2',
          label: 'v2',
        },
      ],
      help: '빌드 결과와 배포에 지정한 태그를 비교하세요.',
    },
    {
      id: 'deployment',
      label: 'Deployment 이미지 태그',
      initial: 'v1',
      options: [
        {
          value: 'v1',
          label: 'v1',
        },
        {
          value: 'v2',
          label: 'v2',
        },
      ],
      help: 'Deployment는 이미지를 빌드하지 않고 사용할 버전을 지정합니다.',
    },
    {
      id: 'healing',
      label: '장애 뒤 복제본 복구',
      initial: 'off',
      options: [
        {
          value: 'off',
          label: '복구 사용 안 함',
        },
        {
          value: 'on',
          label: '원하는 복제본 2개로 복구',
        },
      ],
      help: 'Pod 1에 장애가 발생했다고 가정합니다.',
    },
  ],
});
