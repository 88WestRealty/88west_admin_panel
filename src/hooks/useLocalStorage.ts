'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLatestRef } from './useLatestRef';

type Serializer<T> = { parse: (raw: string) => T; stringify: (value: T) => string };

const jsonSerializer = <T,>(): Serializer<T> => ({
  parse: (raw) => JSON.parse(raw) as T,
  stringify: (value) => JSON.stringify(value),
});

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (next: T | ((current: T) => T)) => void;
  remove: () => void;
  /** False during SSR and the first client render. Gate rendering on it. */
  isHydrated: boolean;
}

/**
 * localStorage bound to React state, without hydration mismatches.
 *
 * The first client render deliberately returns `initialValue` — identical to
 * what the server rendered — and the stored value is adopted in an effect.
 * Reading storage during render would produce different markup on the client
 * and trip React's hydration check.
 *
 * Also syncs across tabs via the `storage` event, and drops every listener
 * plus a `mounted` guard on unmount so a late setState never hits an
 * unmounted component.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  serializer: Serializer<T> = jsonSerializer<T>(),
): UseLocalStorageResult<T> {
  const [value, setStateValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Keeps the effects below off the dependency treadmill: reading the latest
  // serializer through a ref means the subscribe effect runs once per key
  // instead of on every render that passes a fresh object.
  const serializerRef = useLatestRef(serializer);
  // The initial value is captured once by design — a caller passing a fresh
  // object literal each render must not reset stored state.
  const initialRef = useRef(initialValue);

  useEffect(() => {
    let mounted = true;

    try {
      const raw = window.localStorage.getItem(key);
      if (mounted && raw !== null) setStateValue(serializerRef.current.parse(raw));
    } catch {
      // Corrupt JSON or a privacy-mode denial — fall back to the initial value.
    }
    if (mounted) setIsHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !mounted) return;
      try {
        setStateValue(
          event.newValue === null
            ? initialRef.current
            : serializerRef.current.parse(event.newValue),
        );
      } catch {
        /* ignore malformed writes from another tab */
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [key, serializerRef]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setStateValue((current) => {
        const resolved =
          typeof next === 'function' ? (next as (c: T) => T)(current) : next;
        try {
          window.localStorage.setItem(key, serializerRef.current.stringify(resolved));
        } catch {
          // Quota exceeded or storage disabled — keep in-memory state usable.
        }
        return resolved;
      });
    },
    [key, serializerRef],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
    setStateValue(initialRef.current);
  }, [key]);

  return { value, setValue, remove, isHydrated };
}
