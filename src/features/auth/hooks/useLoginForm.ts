'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ROUTES } from '@/constants';
import { useIsMounted, useSupabase } from '@/hooks';
import { parseForm, loginSchema } from '@/lib/validation';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import type { LoginFormValues } from '@/types/common';
import { toAuthMessage, type AuthMessage } from '@/utils/errors';

/**
 * All login behaviour, so `LoginForm` stays purely presentational.
 *
 * Nothing is persisted. Credentials are held in component state only, so a
 * refresh or a navigation away leaves no trace of them on the machine — which
 * matters on the shared terminals an admin console tends to run on.
 */
export function useLoginForm(redirectTo: Route = ROUTES.members) {
  const client = useSupabase();
  const router = useRouter();
  const isMounted = useIsMounted();
  const setError = useAuthStore((s) => s.setError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [formError, setFormError] = useState<AuthMessage | null>(null);
  /**
   * Increments on every rejected attempt, and is used as the banner's React
   * key so an identical second failure still remounts and replays its
   * entrance. Keying on the copy alone would be a no-op when someone hits
   * Enter twice without editing — the most common retry there is — and a
   * banner that does not move reads as a button that did not fire.
   */
  const [attempt, setAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  /**
   * Clears the banner as soon as the user starts fixing the problem.
   *
   * A failure notice that outlives the input it describes is the most common
   * way a login form feels broken: you retype the password, the red box is
   * still there, and it is no longer clear whether it refers to what you just
   * typed or what you typed before.
   */
  const clearFormError = useCallback(() => {
    setFormError((current) => {
      // Only touch the shared store when there is something to clear, so
      // typing does not push a state update on every keystroke.
      if (current) setError(null);
      return current ? null : current;
    });
  }, [setError]);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearFormError();
    },
    [clearFormError],
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      clearFormError();
    },
    [clearFormError],
  );

  const submit = useCallback(async () => {
    const { values, errors } = parseForm(loginSchema, { email, password });
    setFieldErrors(errors);
    setFormError(null);
    if (!values) return;

    setIsSubmitting(true);
    const result = await authService.signIn(client, values);

    // The router.replace below unmounts this component; without the guard the
    // setState calls after it would target a dead tree.
    if (!isMounted()) return;
    setIsSubmitting(false);

    if (!result.ok) {
      const message = toAuthMessage(result.error);
      setFormError(message);
      setAttempt((n) => n + 1);
      setError(message.message);

      // Wrong credentials means the password is the thing to retype, so clear
      // it and put the caret there — the alternative is the user selecting a
      // masked field by hand before every retry. The email is left alone: it
      // is usually right, and re-entering it is pure friction.
      //
      // A rejection the user cannot fix by typing (rate limit, no admin
      // access, server unreachable) is exempt: wiping the field there
      // discards correct input and invites another doomed attempt.
      if (result.error.code === 'invalid_credentials') {
        setPassword('');
        passwordRef.current?.focus();
      }
      return;
    }

    setPassword('');
    router.replace(redirectTo);
  }, [client, email, isMounted, password, redirectTo, router, setError]);

  return {
    email,
    setEmail: handleEmailChange,
    password,
    setPassword: handlePasswordChange,
    passwordRef,
    fieldErrors,
    formError,
    attempt,
    isSubmitting,
    submit,
  };
}
