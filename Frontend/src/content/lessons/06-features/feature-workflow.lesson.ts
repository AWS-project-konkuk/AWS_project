import { defineMdxLesson } from '../../defineLesson';
import { scenarioById } from '../../../weekly/scenarios';

// 실습 화면은 공통 시나리오를 읽으므로 이 강의의 항목만 간소화합니다.
// 원천 계산은 준비된 것으로 두고, 별도 결과 노드를 비교 노드에 통합합니다.
const baseScenario = scenarioById['feature-workflow'];
const layout = {
  definition: { x: 0, y: 140 },
  offline: { x: 320, y: 0 },
  online: { x: 320, y: 280 },
  context: { x: 640, y: 140 },
};
const featureScenario = {
  ...baseScenario,
  title: '두 저장소의 피처 정의 맞추기',
  task: '두 저장소의 출력을 비교 노드에 연결하고, 온라인 집계 시간을 24시간에서 1시간으로 바꿔 결과를 비교하세요.',
  nodes: baseScenario.nodes
    .filter((node) => Object.hasOwn(layout, node.id))
    .map((node) => ({
      ...node,
      ...layout[node.id as keyof typeof layout],
      title:
        node.id === 'definition'
          ? '공통 피처 정의'
          : node.id === 'offline'
            ? 'Offline Store · 학습'
            : node.id === 'online'
              ? 'Online Store · 추론'
              : '정의 비교·결과 확인',
      purpose:
        node.id === 'definition'
          ? '최근 1시간 클릭 수의 계산 기준은 준비되어 있습니다.'
          : node.id === 'offline'
            ? '과거 시점의 학습 피처를 제공합니다. 예시: 1시간·12회.'
            : node.id === 'online'
              ? '추론용 최신 피처를 제공합니다. 온라인 집계 시간을 선택하세요.'
              : '학습·추론의 집계 정의가 같은지 확인하고 결과를 표시합니다.',
      inputs: node.id === 'definition' ? [] : node.inputs,
      outputs:
        node.id === 'context'
          ? node.outputs.map((port) => ({ ...port, label: '정의 일치 결과' }))
          : node.outputs,
    })),
  wires: baseScenario.wires.filter(
    (wire) => Object.hasOwn(layout, wire.source) && Object.hasOwn(layout, wire.target),
  ),
  starter: baseScenario.wires.filter((wire) => wire.source === 'definition'),
};
scenarioById['feature-workflow'] = featureScenario;

// 기존 6개 노드 기록 때문에 전체 학습 진행을 읽지 못하는 일이 없도록
// 이 강의의 저장 기록만 새 구성으로 옮깁니다. 다른 강의 기록은 유지합니다.
function migrateFeatureWorkflowProgress() {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = 'blockml:learning:v5';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    const saved = data?.lessons?.['feature-workflow'];
    const previousIds = new Set(['source', 'definition', 'offline', 'online', 'context', 'answer']);
    if (
      data?.version !== 5 ||
      !Array.isArray(saved?.nodes) ||
      saved.nodes.length !== previousIds.size ||
      new Set(saved.nodes.map((node: { id?: string }) => node?.id)).size !== previousIds.size ||
      !saved.nodes.every((node: { id?: string }) => previousIds.has(node?.id ?? '')) ||
      !Array.isArray(saved.edges) ||
      !Array.isArray(saved.activeNodes)
    )
      return;
    saved.nodes = saved.nodes.filter((node: { id: string }) => Object.hasOwn(layout, node.id));
    saved.activeNodes = saved.activeNodes.filter((id: string) => Object.hasOwn(layout, id));
    saved.edges = saved.edges.filter(
      (edge: { source: string; sourceHandle: string; target: string; targetHandle: string }) =>
        featureScenario.wires.some(
          (wire) =>
            wire.source === edge.source &&
            wire.sourceHandle === edge.sourceHandle &&
            wire.target === edge.target &&
            wire.targetHandle === edge.targetHandle,
        ),
    );
    saved.completed = false;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 형식이 잘못되었거나 저장할 수 없으면 원본을 유지하고 공통 복구 절차에 맡깁니다.
  }
}
migrateFeatureWorkflowProgress();

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'feature-workflow',
  unit: 5,
  order: 3,
  title: 'Offline·Online Store와 피처 동기화',
  summary: '학습용 과거 피처와 서비스용 최신 피처가 어디에 저장되고 어떻게 갱신되는지 실습합니다.',
  minutes: 14,
  scenario:
    '학습은 최근 1시간 클릭 수를 사용하지만 온라인 저장소에는 최근 24시간 값이 들어 있습니다. 두 경로의 정의를 맞추고 갱신 흐름을 확인하세요.',
  concepts: ['Offline Store', 'Online Store', '배치 동기화', '실시간 동기화', '피처 누락 처리'],
  caution:
    '대량 과거 조회와 실시간 조회의 저장 방식은 달라도 피처 의미와 시점 기준을 관리해야 합니다.',
  reflection: '저장소가 서로 달라도 반드시 일치시켜야 하는 피처 정보는 무엇인가요?',
  references: [
    {
      title: '원문 · MLOps 6주차 · 실제 도구 실습',
      url: 'https://www.notion.so/d3eebb1cb38a828ba5ac81827fb445b8',
    },
    {
      title: 'Databricks · What is a Feature Store?',
      url: 'https://www.databricks.com/blog/what-is-a-feature-store',
    },
  ],
  sourceWeek: 6,
  mapStages: ['data', 'training', 'serving'],
  workflow: 'feature-workflow',
  experiment: '두 저장소 비교',
  nodes: featureScenario.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    detail: node.purpose,
  })),
  fields: [
    {
      id: 'window',
      label: '온라인 집계 시간',
      initial: 'day',
      options: [
        {
          value: 'day',
          label: '최근 24시간',
        },
        {
          value: 'hour',
          label: '최근 1시간 · 학습과 일치',
        },
      ],
      help: '오프라인 학습 정의는 최근 1시간입니다.',
    },
  ],
});
