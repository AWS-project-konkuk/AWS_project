import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Reading } from '../curriculum/types';
import { LessonCodeBlock } from './LessonCodeBlock';
import styles from './LessonLayout.module.css';

export function LessonMedia({ part }: { part: Reading }) {
  const [failedSrc, setFailedSrc] = useState('');
  return (
    <>
      {part.image && (
        <figure className={styles.lessonFigure}>
          {failedSrc === part.image.src ? (
            <p role="status">
              <ImageOff size={18} aria-hidden="true" /> 이미지를 불러오지 못했습니다.{' '}
              {part.image.alt}
            </p>
          ) : (
            <a
              href={part.image.src}
              target="_blank"
              rel="noreferrer"
              aria-label={`${part.image.alt} 원본 보기`}
            >
              <img
                src={part.image.src}
                alt={part.image.alt}
                loading="eager"
                decoding="async"
                onError={() => setFailedSrc(part.image!.src)}
              />
            </a>
          )}
          {(part.image.caption || part.image.source) && (
            <figcaption>
              {part.image.caption && <span>{part.image.caption}</span>}
              {part.image.source && (
                <a href={part.image.source.url} target="_blank" rel="noreferrer">
                  {part.image.source.title}
                </a>
              )}
            </figcaption>
          )}
        </figure>
      )}
      {part.code && (
        <LessonCodeBlock language={part.code.language}>{part.code.text}</LessonCodeBlock>
      )}
    </>
  );
}
