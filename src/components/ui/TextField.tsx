'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Guidance shown under the field. Announced via aria-describedby. */
  hint?: string;
  error?: string;
  /** Renders an "Optional" tag; the inverse of starring required fields. */
  isOptional?: boolean;
  /** Adds a show/hide toggle. Only meaningful for type="password". */
  revealable?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, isOptional = false, revealable = false, className, type, ...rest },
  ref,
) {
  const id = useId();
  const [isRevealed, setIsRevealed] = useState(false);

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  // Error first: screen readers announce descriptions in order, and the
  // problem matters more than the guidance once both are present.
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  const canReveal = revealable && type === 'password';
  const resolvedType = canReveal && isRevealed ? 'text' : type;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {isOptional ? <span className={styles.optional}>Optional</span> : null}
      </div>

      <div className={styles.inputWrap}>
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          className={[styles.input, canReveal ? styles.hasAffix : null]
            .filter(Boolean)
            .join(' ')}
          data-invalid={error ? 'true' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
        {canReveal ? (
          <button
            type="button"
            className={styles.affix}
            onClick={() => setIsRevealed((current) => !current)}
            // The label carries the state change; aria-pressed would be
            // redundant and read twice.
            aria-label={isRevealed ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {isRevealed ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>

      {hint && !error ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <svg
            className={styles.errorIcon}
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.5h1.5v5h-1.5v-5zm0 6.25h1.5v1.5h-1.5v-1.5z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
});
