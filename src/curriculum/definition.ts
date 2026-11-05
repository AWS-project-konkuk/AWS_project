import type { Answer, Goal, LabField, LabNode, Lesson, Reading } from './types';

const mlopsIds = [
  '971ebb1cb38a83f98b6d817ad00ba220',
  'b5febb1cb38a8291ab0b815ce3c444d4',
  'e6bebb1cb38a82299e020156f70bf8f2',
  '15aebb1cb38a83209ecb81f1472e181b',
  '556ebb1cb38a8238afbb0110e26c7a27',
  '896ebb1cb38a8233bd6381f562fae5cd',
  '8f3ebb1cb38a828a88b401186cd88e3b',
];
export const devopsSources = {
  identity: {
    title: 'DevOps 1차시 · AWS와 IAM',
    url: 'https://www.notion.so/c67ebb1cb38a828db9d381b8f8372e3c',
  },
  storage: {
    title: 'DevOps 2차시 · 스토리지',
    url: 'https://www.notion.so/e00ebb1cb38a8206a6c80113b289da8f',
  },
  network: {
    title: 'DevOps 3차시 · 네트워킹',
    url: 'https://www.notion.so/60cebb1cb38a82688ff2013bcf3500ce',
  },
  availability: {
    title: 'DevOps 4차시 · 확장성과 고가용성',
    url: 'https://www.notion.so/fa2ebb1cb38a8267aa20818d08f186be',
  },
  container: {
    title: 'DevOps 6차시 · 컨테이너와 ECR',
    url: 'https://www.notion.so/392ebb1cb38a8286b9b501e0da4e0fdc',
  },
};
export const node = (id: string, title: string, detail: string): LabNode => ({ id, title, detail });
export const edge = (from: string, to: string, label: string, hint: string): Goal => ({
  id: `${from}-${to}`,
  kind: 'edge',
  from,
  to,
  label,
  hint,
});
export const answer = (
  field: string,
  value: Answer,
  label: string,
  hint: string,
  comparison?: 'atLeast' | 'atMost',
): Goal => ({ id: field, kind: 'answer', field, value, label, hint, comparison });
export const select = (
  id: string,
  label: string,
  initial: string,
  values: [string, string][],
  help: string,
): LabField => ({
  id,
  label,
  initial,
  options: values.map(([value, label]) => ({ value, label })),
  help,
});
export const number = (
  id: string,
  label: string,
  initial: number,
  help: string,
  min = 0,
  max = 64,
): LabField => ({ id, label, initial, min, max, step: 1, help });
export const reading = (title: string, body: string, table?: Reading['table']): Reading => ({
  title,
  body,
  table,
});
export function lesson(
  value: Omit<Lesson, 'references' | 'minutes'> & {
    references: Lesson['references'];
    minutes?: number;
  },
): Lesson {
  return {
    minutes: 12,
    ...value,
    references:
      value.week === 0
        ? value.references
        : [
            {
              title: `원본 · MLOps ${value.week}주차 워크북`,
              url: `https://www.notion.so/${mlopsIds[value.week - 1]}`,
            },
            ...value.references,
          ],
  };
}
