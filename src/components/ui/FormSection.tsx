import type { ReactNode } from 'react';
import styles from './FormSection.module.css';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Groups related fields under a heading. A long form scans as a few short
 * lists instead of one undifferentiated column.
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>{title}</legend>
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.fields}>{children}</div>
    </fieldset>
  );
}
