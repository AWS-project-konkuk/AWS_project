/** 실습 화면이 공유하는 색. 종류 색은 Tailwind가 읽을 수 있도록 문자열 그대로 둔다. */
export const kindClass = {
  blue: '[--kind-color:light-dark(#305bb0,#a5bcff)]',
  orange: '[--kind-color:light-dark(#984318,#ffb486)]',
  teal: '[--kind-color:light-dark(#00708b,#7bd9f1)]',
  green: '[--kind-color:light-dark(#23694b,#83d9ad)]',
  slate: '[--kind-color:light-dark(#525f73,#b8c8dd)]',
  purple: '[--kind-color:light-dark(#78468f,#dcb4f1)]',
  gold: '[--kind-color:light-dark(#865d17,#f0cf82)]',
  pink: '[--kind-color:light-dark(#9b3d6b,#f2a8ce)]',
  olive: '[--kind-color:light-dark(#526813,#bdd988)]',
  indigo: '[--kind-color:light-dark(#594c9e,#c8b8ff)]',
  root: '[--kind-color:var(--color-accent)]',
} as const;

/** 자료 타입별 선과 포트 색. */
export const tone = {
  blue: 'light-dark(#305bb0,#a5bcff)',
  green: 'light-dark(#23694b,#83d9ad)',
  purple: 'light-dark(#78468f,#dcb4f1)',
  gold: 'light-dark(#865d17,#f0cf82)',
  teal: 'light-dark(#00708b,#7bd9f1)',
  pink: 'light-dark(#9b3d6b,#f2a8ce)',
  orange: 'light-dark(#984318,#ffb486)',
  olive: 'light-dark(#526813,#bdd988)',
  slate: 'light-dark(#525f73,#b8c8dd)',
} as const;
