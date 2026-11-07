import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'container-isolation',
  unit: 1,
  order: 1,
  title: '커널을 공유하면서 어떻게 격리할까',
  summary:
    '두 컨테이너가 같은 커널을 쓰는데 서로 다른 프로세스 목록을 보고 메모리 제한도 다릅니다.',
  scenario:
    '두 컨테이너가 같은 커널을 쓰는데 서로 다른 프로세스 목록을 보고 메모리 제한도 다릅니다.',
  concepts: ['같은 환경에서 실행하기', '커널을 공유하면서 어떻게 격리할까'],
  assessment: {
    question: '메모리 사용 제한을 설명하는 개념은?',
    options: ['Cgroups의 자원 제어', '각 컨테이너의 독립된 물리 메모리 장치'],
    correct: 0,
    explanation:
      '애플리케이션 → 격리된 프로세스 환경 → 공유 호스트 커널 → 하드웨어 순서로 봅니다. 이미지의 사용자 공간 라이브러리와 호스트 드라이버의 역할을 나눠 확인합니다. Docker Desktop에서는 Linux VM 위에 컨테이너가 실행될 수도 있습니다.',
  },
  advanced: [
    {
      title: '심화 · GPU 배치 조건',
      body: 'nodeSelector·Affinity는 실행 위치 조건을, Taints·Tolerations는 배치 허용 조건을 표현합니다. Toleration이 있다고 특정 노드에 반드시 배치되는 것은 아닙니다. GPU 장치 플러그인과 자원 요청도 확인합니다.',
    },
  ],
  caution:
    '컨테이너는 호스트 커널을 공유합니다. 이미지가 같아도 GPU 드라이버나 외부 설정이 다를 수 있습니다. Deployment의 복제본 유지와 HPA의 부하 기반 확장은 별도 기능입니다.',
  reflection: '메모리 사용 제한을 설명하는 개념은?',
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
});
