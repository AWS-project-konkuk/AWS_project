import {
  Database,
  Cpu,
  BrainCircuit,
  FileText,
  Search,
  Network,
  Container,
  HardDrive,
  ShieldCheck,
  GitBranch,
  ChartNoAxesCombined,
  SlidersHorizontal,
  MessageSquare,
  Layers,
  CircleCheck,
  ArrowRightLeft,
  Box,
} from 'lucide-react';

const visuals = [
  {
    kind: 'security',
    label: '접근 권한',
    icon: ShieldCheck,
    color: '#b45309',
    pattern: /iam|security|권한|정책|보안/,
  },
  {
    kind: 'monitor',
    label: '관측',
    icon: ChartNoAxesCombined,
    color: '#0f766e',
    pattern: /monitor|metric|관측|모니터|드리프트|지표/,
  },
  {
    kind: 'evaluation',
    label: '검증·판단',
    icon: CircleCheck,
    color: '#15803d',
    pattern: /evaluat|approval|decision|평가|승인|판단|검증|reproduce/,
  },
  {
    kind: 'gpu',
    label: 'GPU 연산',
    icon: Cpu,
    color: '#b45309',
    pattern: /gpu|cuda|워커|연산|split|할당/,
  },
  {
    kind: 'vector',
    label: '벡터 색인',
    icon: Layers,
    color: '#7c3aed',
    pattern: /vector|index|임베딩·인덱스|벡터|색인/,
  },
  {
    kind: 'query',
    label: '검색·임베딩',
    icon: Search,
    color: '#7c3aed',
    pattern: /search|query|검색|질문 임베딩/,
  },
  {
    kind: 'feature',
    label: '피처 제공',
    icon: Layers,
    color: '#0369a1',
    pattern: /feature|offline|online|피처|definition/,
  },
  {
    kind: 'version',
    label: '버전 관리',
    icon: GitBranch,
    color: '#9333ea',
    pattern: /git|dvc|metadata|메타데이터|버전|체크아웃/,
  },
  {
    kind: 'volume',
    label: '볼륨·캐시',
    icon: HardDrive,
    color: '#0284c7',
    pattern: /pvc|pv\b|volume|claim|cache|ebs|볼륨|캐시/,
  },
  {
    kind: 'storage',
    label: '데이터 저장',
    icon: Database,
    color: '#0284c7',
    pattern: /s3|objects|dataset|remote|data\b|artifact|저장|데이터|원천/,
  },
  {
    kind: 'environment',
    label: '실행 환경',
    icon: Container,
    color: '#0891b2',
    pattern: /image|container|pod|controller|deployment|ecs|ecr|ami|이미지|컨테이너|환경|배포 선언/,
  },
  {
    kind: 'router',
    label: '요청 전달',
    icon: Network,
    color: '#db2777',
    pattern: /router|service|request|alb|route|라우|요청|분배/,
  },
  {
    kind: 'preprocess',
    label: '자료 가공',
    icon: SlidersHorizontal,
    color: '#0d9488',
    pattern: /prep|loader|전처리|가공|로더/,
  },
  {
    kind: 'sync',
    label: '결합·동기화',
    icon: ArrowRightLeft,
    color: '#c2410c',
    pattern: /merge|sync|결합|동기화/,
  },
  {
    kind: 'model',
    label: '모델',
    icon: BrainCircuit,
    color: '#c2410c',
    pattern: /model|train|serve|serving|registry|old|new|모델|학습|추론/,
  },
  {
    kind: 'document',
    label: '문서·근거',
    icon: FileText,
    color: '#6366f1',
    pattern: /document|context|문서|근거|문맥/,
  },
  {
    kind: 'response',
    label: '응답',
    icon: MessageSquare,
    color: '#db2777',
    pattern: /answer|response|generation|응답|생성/,
  },
];
export function nodeVisual(name: string, service = '') {
  // Explicit service keys take precedence; titles disambiguate scenario-local IDs.
  return (
    visuals.find((v) => service && v.pattern.test(service)) ??
    visuals.find((v) => v.pattern.test(name)) ?? {
      kind: 'component',
      label: '구성 요소',
      icon: Box,
      color: '#64748b',
    }
  );
}
export function NodeSymbol({
  name,
  service = '',
  size = 22,
}: {
  name: string;
  service?: string;
  size?: number;
}) {
  const visual = nodeVisual(name, service);
  const Icon = visual.icon;
  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      role="img"
      aria-label={`${visual.label} 아이콘`}
      data-node-icon={visual.kind}
      style={{ color: visual.color, flexShrink: 0 }}
    />
  );
}
