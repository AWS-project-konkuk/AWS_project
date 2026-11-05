import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';
import type { Reading, Lesson } from '../curriculum/types';

export interface LessonMdxModule {
  default: ComponentType<MDXProps>;
  readingIndex: Reading[];
  contentFeatures: NonNullable<Lesson['contentFeatures']>;
}
