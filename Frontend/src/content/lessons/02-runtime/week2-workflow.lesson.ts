import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'week2-workflow',
  unit: 1,
  order: 7,
  title: '같은 이미지로 서비스를 복구하기',
  summary:
    '주차 종합 실습 · 이미지는 실행 템플릿, Pod는 실행 단위, Deployment는 원하는 수를 유지하는 관리자, Service는 요청 경로입니다.',
  minutes: 18,
  scenario:
    '이미지·원하는 상태·실제 요청을 구분해 연결하세요. 버전 불일치와 장애 상태를 관찰한 뒤 같은 이미지로 두 Pod를 준비하고 응답을 확인하세요.',
  concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution:
    '컨테이너는 호스트 커널을 공유하고, Deployment는 이미지 버전과 복제본의 실행 상태를 관리합니다.',
  reflection: 'Deployment에 이미지 태그를 지정하면 어떤 역할을 하나요?',
  references: [
    {
      title: '원문 · MLOps 2주차 · 실제 도구 실습',
      url: 'https://www.notion.so/f14ebb1cb38a82d6b28501d3693fd20e',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/overview/components/',
    },
    {
      title: '공식 자료 · 더 알아보기',
      url: 'https://docs.docker.com/get-started/docker-concepts/',
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
