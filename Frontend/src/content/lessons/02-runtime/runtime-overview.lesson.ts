import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'runtime-overview',
  unit: 1,
  order: 1,
  title: '단원 개요',
  minutes: 6,
  summary:
    '내 컴퓨터에서만 되는 프로그램을 다른 서버에서도 실행하고, 여러 실행본을 유지하는 흐름을 배웁니다.',
  scenario:
    '환경 포장 → 실행본 관리 → 요청 전달의 흐름을 살펴보고, 이번 단원에서 해결할 문제를 파악합니다.',
  concepts: ['실행 환경', 'Docker', 'Kubernetes', '단원 학습 순서'],
  assessment: {
    question:
      '서버를 빌렸는데도 내 컴퓨터에서만 프로그램이 동작합니다. 이번 단원에서 먼저 다룰 문제는?',
    options: [
      '사용자 요청이 올 때마다 모델을 다시 학습하기',
      '코드와 실행 의존성을 명시하고 같은 환경을 준비하기',
    ],
    correct: 1,
    explanation:
      '컴퓨터를 확보하는 것과 실행 환경을 맞추는 것은 다릅니다. Docker로 실행 환경을 준비하고, Kubernetes의 실행 관리와 요청 전달로 이어갑니다.',
  },
  caution: '환경을 준비하는 작업과 준비된 앱이 요청을 처리하는 흐름을 나누어 봅니다.',
  reflection: 'Docker와 Kubernetes가 각각 어느 문제를 해결하는지 설명해 보세요.',
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
      title: 'Docker 공식 · Docker의 역할',
      url: 'https://docs.docker.com/get-started/docker-overview/',
    },
    {
      title: 'Kubernetes 공식 · 개요',
      url: 'https://kubernetes.io/docs/concepts/overview/',
    },
  ],
  sourceWeek: 2,
  mapStages: ['training', 'serving'],
});
