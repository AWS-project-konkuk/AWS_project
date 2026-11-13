import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'container-isolation',
  unit: 1,
  order: 4,
  title: '커널을 공유하면서 어떻게 격리할까',
  minutes: 12,
  summary:
    '커널은 공유하지만 보이는 범위와 자원 사용 조건은 나눕니다. Namespaces와 Cgroups의 역할을 구분합니다.',
  scenario: '프로세스·네트워크 범위의 분리와 CPU·메모리 제한을 서로 다른 문제에 연결합니다.',
  concepts: ['공유 커널', 'Namespaces', 'Cgroups', '접근 권한'],
  assessment: {
    question: '프로세스가 보이는 범위와 메모리 사용 제한을 각각 연결하면?',
    options: [
      'Namespaces는 범위를 나누고 Cgroups는 자원 사용을 제한·계측한다',
      'Namespaces가 물리 메모리 장치를 새로 만들고 Cgroups가 게스트 OS를 부팅한다',
    ],
    correct: 0,
    explanation:
      'Namespaces는 PID·네트워크·마운트 등의 범위를 나누며 Cgroups는 프로세스 집합의 자원 사용을 계측하고 제한합니다. 공유 여부는 namespace와 마운트 등의 설정도 확인해야 합니다.',
  },
  caution:
    '보이는 범위, 자원 제한, 접근 권한을 나누어 봅니다. 같은 Pod 안에서는 네트워크를 공유할 수 있습니다.',
  reflection:
    '같은 커널을 쓰는 두 컨테이너가 각자의 프로세스 목록과 메모리 제한을 가질 수 있는 이유는 무엇인가요?',
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
      title: 'Docker 공식 · Namespaces와 Cgroups',
      url: 'https://docs.docker.com/engine/security/',
    },
    {
      title: 'Kubernetes 공식 · Pod의 공유 환경',
      url: 'https://kubernetes.io/docs/concepts/workloads/pods/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
});
