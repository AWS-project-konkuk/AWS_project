declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { MDXProps } from 'mdx/types';
  import type { Reading, Lesson } from './curriculum/types';
  const Content: ComponentType<MDXProps>;
  export const readingIndex: Reading[];
  export const contentFeatures: NonNullable<Lesson['contentFeatures']>;
  export default Content;
}
