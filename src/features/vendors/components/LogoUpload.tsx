'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { useSupabase } from '@/hooks';
import { storageService } from '@/services';
import styles from './LogoUpload.module.css';

interface LogoUploadProps {
  /** Path of a logo already in storage, or null. */
  value: string | null;
  /** File chosen but not yet uploaded. */
  pendingFile: File | null;
  /** Fires on selection and on removal; the parent holds both pieces. */
  onSelect: (file: File | null) => void;
  /** Clears an already-saved logo. */
  onClear: () => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Chooses a logo and previews it — without touching the network.
 *
 * The file is handed to the parent and uploaded only when the form is
 * submitted. Uploading on selection would put a file in the bucket that no
 * row references if the admin then cancels, and every re-pick would leave
 * another one behind.
 *
 * The preview is a local `blob:` URL, revoked whenever it is replaced and on
 * unmount — an un-revoked object URL pins the whole file in memory for the
 * life of the document.
 */
export function LogoUpload({
  value,
  pendingFile,
  onSelect,
  onClear,
  error: fieldError,
  disabled = false,
}: LogoUploadProps) {
  const client = useSupabase();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Derived during render, not stored in state: the URL is a pure function of
  // the file the parent owns, so it can never drift from the selection.
  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );

  // The URL still needs releasing — an un-revoked object URL pins the whole
  // file in memory for the life of the document.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  /**
   * Dismissing the OS file picker fires `cancel` on the input, and that event
   * bubbles. Containing it here keeps a dismissed picker from reaching any
   * ancestor — notably the <dialog> hosting this form, which treats a `cancel`
   * of its own as "Escape was pressed" and closes. React exposes no `onCancel`
   * prop for inputs, so the listener is attached directly.
   */
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const stop = (event: Event) => event.stopPropagation();
    input.addEventListener('cancel', stop);
    return () => input.removeEventListener('cancel', stop);
  }, []);

  const storedUrl = storageService.vendorLogoUrl(client, value);
  const shown = previewUrl ?? storedUrl;
  const error = localError ?? fieldError ?? null;

  const handleFile = useCallback(
    (file: File) => {
      // Validated on pick, so an oversized or wrong-typed file is rejected
      // immediately rather than after the rest of the form is filled in.
      const validationError = storageService.validateLogoFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      onSelect(file);
    },
    [onSelect],
  );

  const handleRemove = useCallback(() => {
    setLocalError(null);
    onSelect(null);
    onClear();
    if (inputRef.current) inputRef.current.value = '';
  }, [onClear, onSelect]);

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Logo</span>

      <div className={styles.row}>
        <div
          className={styles.preview}
          data-empty={!shown || undefined}
          data-invalid={error && !shown ? 'true' : undefined}
        >
          {shown ? (
            // Plain <img>: the bucket host is dynamic and these are small
            // assets, so next/image optimisation would add config for no gain.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className={styles.image} />
          ) : (
            <span className={styles.placeholder} aria-hidden>
              &#9635;
            </span>
          )}
        </div>

        <div className={styles.controls}>
          <input
            ref={inputRef}
            type="file"
            accept={storageService.ACCEPTED_LOGO_TYPES.join(',')}
            className={styles.input}
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {shown ? 'Replace' : 'Choose image'}
            </Button>
            {shown ? (
              <Button variant="ghost" disabled={disabled} onClick={handleRemove}>
                Remove
              </Button>
            ) : null}
          </div>
          <p className={styles.hint}>
            {pendingFile
              ? `${pendingFile.name} — uploads when you save.`
              : 'PNG, JPG, WebP or SVG · up to 2 MB · square works best.'}
          </p>
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
