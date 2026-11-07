import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'storage-lifecycle',
  unit: 2,
  order: 1,
  title: '파일의 lifecycle과 공유 조건 판단하기',
  summary:
    '어떤 기준으로 Storage를 선택해야하는가?',
  scenario:
    '기본적인 Storage의 lifecycle과 공유 조건을 판단하고, 어떤 Storage를 선택할지 학습합니다.',
  concepts: ['데이터를 보존하고 공급하기', '파일의 lifecycle과 share 조건 판단하기'],
  assessment: {
    question: '여러 Pod에서 AI 모델을 학습할 때, 스토리지를 선택하기 전에 가장 먼저 확인해야 할 조건은?',
    options: [
      '데이터의 보존 기간과 Pod 및 노드 간 읽기·쓰기 요구사항을 확인한다',
      '모든 데이터를 영구 저장하고 여러 Pod가 동시에 접근하도록 구성한다',
      '데이터의 크기와 저장 속도를 기준으로 가장 빠른 스토리지를 선택한다',
      '모든 데이터를 각 Pod에 개별적으로 저장하여 데이터 공유를 최소화한다',
    ],
    correct: 0,
    explanation:
      '데이터마다 필요한 보존 기간과 접근 방식이 다릅니다. 따라서 스토리지를 선택하기 전에 파일 수명과 공유 조건을 먼저 파악해야 합니다.',
  },
  caution:
    '영구 볼륨은 백업이 아닙니다. 공유 읽기만 필요한지 동시 쓰기도 필요한지 판단하고 저장소·드라이버의 지원을 확인합니다. 캐시는 반복 읽기를 돕지만 최초 읽기나 잘못된 데이터 자체를 해결하지 않습니다.',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/storage/volumes/',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
});
