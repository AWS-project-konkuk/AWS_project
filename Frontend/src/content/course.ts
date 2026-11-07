export const notionWeeks = [
  '896ebb1cb38a830b8ade81b394fce2f5',
  'f14ebb1cb38a82d6b28501d3693fd20e',
  '5f3ebb1cb38a83f4a40181082cca16c0',
  '02eebb1cb38a82a5b14d811093182c3f',
  'ea3ebb1cb38a827a91d381487e388ad4',
  'd3eebb1cb38a828ba5ac81827fb445b8',
  '8f3ebb1cb38a828a88b401186cd88e3b',
];
const titles = [
  '전체 흐름과 EC2·S3 기초',
  '같은 환경에서 실행하기',
  '데이터를 보존하고 공급하기',
  '같은 실험으로 돌아가기',
  'GPU로 학습하기',
  '학습과 추론의 피처 맞추기',
  '문서를 검색해 답변하기',
  '모델을 제공하고 교체하기',
  '운영 상태를 보고 개선하기',
  '전체 과정 설명하기',
];
const summaries = [
  '전체 워크플로우·EC2의 실행·S3의 저장',
  '격리·배포·스케줄링·요청 전달',
  'Storage lifecycle·share·데이터 공급 병목',
  '코드·데이터·환경과 실험 재현성',
  '연산·메모리·통신의 선택',
  '피처 정의·시점·온라인 조회',
  '문서 준비와 질문 처리의 두 경로',
  '응답 방식과 안전한 모델 전환',
  '시스템과 모델 품질을 관측하고 판단하기',
  '버전과 실행 환경을 따라 장애 영향 설명',
];
export const units = titles.map((title, week) => ({
  week,
  title,
  summary: summaries[week],
  color: '#8a82c4',
}));
export const sourceWeeks = [1, 2, 4, 5, 3, 6, 6, 7, 7, 1];
export const stages = [
  ['data', 'training', 'evaluation', 'registry', 'serving', 'monitoring'],
  ['training', 'serving'],
  ['data', 'training'],
  ['data', 'training', 'evaluation'],
  ['training'],
  ['data', 'training', 'serving'],
  ['retrieval'],
  ['registry', 'serving'],
  ['serving', 'monitoring'],
  ['data', 'training', 'evaluation', 'registry', 'serving', 'monitoring'],
];

const official = [
  'https://aws.amazon.com/what-is/mlops/',
  'https://kubernetes.io/docs/concepts/overview/components/',
  'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
  'https://doc.dvc.org/user-guide/project-structure/dvcyaml-files',
  'https://docs.pytorch.org/tutorials/beginner/dist_overview.html',
  'https://docs.feast.dev/getting-started/architecture/overview',
  'https://github.com/pgvector/pgvector',
  'https://grpc.io/docs/what-is-grpc/introduction/',
  'https://prometheus.io/docs/introduction/overview/',
  'https://aws.amazon.com/what-is/mlops/',
];
export function references(unit: number) {
  const sourceWeek = sourceWeeks[unit];
  return [
    {
      title: `원문 · MLOps ${sourceWeek}주차 · 실제 도구 실습`,
      url: `https://www.notion.so/${notionWeeks[sourceWeek - 1]}`,
    },
    { title: '공식 자료 · 원리와 적용 조건', url: official[unit] },
  ];
}
