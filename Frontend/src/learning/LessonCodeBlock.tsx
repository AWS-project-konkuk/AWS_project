import { useRef, useState, type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { copyText } from '../clipboard';
import styles from './LessonLayout.module.css';

const languageLabels: Record<string, string> = {
  bash: 'Bash',
  dockerfile: 'Dockerfile',
  promql: 'PromQL',
  python: 'Python',
  sql: 'SQL',
  text: '텍스트',
  yaml: 'YAML',
};

export function LessonCodeBlock({
  language,
  children,
}: {
  language: string;
  children?: ReactNode;
}) {
  const codeRef = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const label = Object.hasOwn(languageLabels, language) ? languageLabels[language] : language;

  async function copyCode() {
    setCopyStatus(
      (await copyText(codeRef.current?.textContent ?? ''))
        ? '코드를 복사했습니다.'
        : '복사하지 못했습니다. 코드를 선택해 복사하세요.',
    );
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeToolbar}>
        <span>{label}</span>
        <button type="button" onClick={copyCode}>
          <Copy size={14} aria-hidden="true" />
          코드 복사
        </button>
      </div>
      <pre aria-label={`${label} 예제`} tabIndex={0}>
        <code ref={codeRef} className={`language-${language}`}>
          {children}
        </code>
      </pre>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </div>
  );
}
