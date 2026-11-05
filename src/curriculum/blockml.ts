import { units } from '../content/course';
import { lessonDocuments } from '../content/lessons';
import type { Lesson } from './types';
export const weeks = units.slice(0, -1);
export const chapters = units;
export const chapterLabel = (unit: number) => `${unit}단원`;
export const lessons = lessonDocuments.map((document) => document.lesson);
export const lessonById = Object.fromEntries(
  lessons.map((lesson) => [lesson.id, lesson]),
) as Record<string, Lesson>;
