import type { ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import styles from './ResultFeedback.module.css';

export function ResultFeedback({
  tone,
  title,
  children,
  label,
}: {
  tone: 'success' | 'error' | 'info';
  title: string;
  children: ReactNode;
  label?: string;
}) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? CircleAlert : Info;
  return (
    <div
      className={styles.feedback}
      data-feedback={tone}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
    >
      <Icon size={22} aria-hidden="true" />
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>{' '}
        <div className={styles.message}>{children}</div>
      </div>
    </div>
  );
}
