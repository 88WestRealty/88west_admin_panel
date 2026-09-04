'use client';

import type { FormEvent } from 'react';
import type { Route } from 'next';
import { Button, TextField } from '@/components/ui';
import { useDevLogin } from '../hooks/useDevLogin';
import { useLoginForm } from '../hooks/useLoginForm';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  redirectTo?: Route;
}

/**
 * Container half of the login screen: it owns no logic of its own, only the
 * wiring between `useLoginForm` and the presentational primitives.
 */
export function LoginForm({ redirectTo }: LoginFormProps) {
  const { signInAsDev, isEnabled: isDevLoginEnabled } = useDevLogin(redirectTo);
  const {
    email,
    setEmail,
    password,
    setPassword,
    passwordRef,
    fieldErrors,
    formError,
    attempt,
    isSubmitting,
    submit,
  } = useLoginForm(redirectTo);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError ? (
        /* Keyed on the attempt count so every rejection remounts the node and
           replays its entrance — see the note on `attempt` in useLoginForm. */
        <div
          key={attempt}
          className={styles.banner}
          data-tone={formError.tone}
          role="alert"
        >
          <svg
            className={styles.bannerIcon}
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.5h1.5v5h-1.5v-5zm0 6.25h1.5v1.5h-1.5v-1.5z" />
          </svg>
          <span>{formError.message}</span>
        </div>
      ) : null}

      <TextField
        label="Email"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="username"
        placeholder="you@company.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        disabled={isSubmitting}
        required
      />

      <TextField
        ref={passwordRef}
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        revealable
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        disabled={isSubmitting}
        required
      />

      <Button type="submit" isLoading={isSubmitting} className={styles.submit}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      {/* The `process.env.NODE_ENV` test is written inline rather than read
          from the imported flag on purpose: Next replaces this expression with
          a literal at build time, so the whole branch is dead code the minifier
          deletes. Behind an imported constant the bundler cannot fold it, and
          the markup ships (inert, but present) in the production bundle. */}
      {/* Collapsed to a single line: dev scaffolding should not outweigh the
          actual sign-in. The full caveat lives in the title attribute. */}
      {process.env.NODE_ENV !== 'production' && isDevLoginEnabled ? (
        <button
          type="button"
          className={styles.devLink}
          onClick={signInAsDev}
          disabled={isSubmitting}
          title="Bypasses Supabase entirely — no real session and no RLS, so data screens stay empty unless a backend is configured."
        >
          Skip sign-in (dev)
        </button>
      ) : null}
    </form>
  );
}
