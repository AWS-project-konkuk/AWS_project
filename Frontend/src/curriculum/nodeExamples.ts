import type { Material } from '../weekly/types';

export interface NodeExampleSpec {
  id: string;
  title: string;
  prompt: string;
  afterSection: number;
  kind: '자료 전달' | '구성 관계';
  nodes: { id: string; title: string; purpose: string; x: number; y: number }[];
  links: {
    id: string;
    source: string;
    target: string;
    label: string;
    detail: string;
    material: Material;
  }[];
  practiceHint: string;
  nextLesson?: string;
}
// 예제 데이터도 해당 강의 문서의 nodeExample에서 작성합니다.
