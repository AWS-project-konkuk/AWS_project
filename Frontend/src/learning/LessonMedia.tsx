import { useState } from 'react';
import { Copy, ImageOff } from 'lucide-react';
import type { Reading } from '../curriculum/types';
import styles from './LessonLayout.module.css';

export function LessonMedia({ part }: { part: Reading }) {
  const [failedSrc, setFailedSrc] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
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
        <div className={styles.codeBlock}>
          <div className={styles.codeToolbar}>
            <span>{part.code.language}</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(part.code!.text);
                  setCopyStatus('코드를 복사했습니다.');
                } catch {
                  setCopyStatus('복사하지 못했습니다. 코드를 선택해 복사하세요.');
                }
              }}
            >
              <Copy size={14} aria-hidden="true" />
              코드 복사
            </button>
          </div>
          <pre aria-label={`${part.code.language} 예제`} tabIndex={0}>
            <code>{part.code.text}</code>
          </pre>
          {copyStatus && <p role="status">{copyStatus}</p>}
        </div>
      )}
    </>
  );
}
