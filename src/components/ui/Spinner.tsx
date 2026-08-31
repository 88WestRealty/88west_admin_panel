import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
