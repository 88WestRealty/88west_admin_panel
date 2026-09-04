'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useLatestRef } from '@/hooks/useLatestRef';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Native `<dialog>` modal.
 *
 * Two listeners are attached here — Escape via the dialog's `cancel` event and
 * the backdrop click — and both are removed in the same effect's cleanup. The
 * effect also closes the dialog if the component unmounts while open, which
 * otherwise leaves the browser's top layer and `inert` state stuck on.
 */
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useLatestRef(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();

    // Only the dialog's *own* cancel event means "Escape was pressed".
    // `cancel` also fires — and bubbles — from an <input type="file"> inside
    // the panel when the user dismisses the OS file picker, which otherwise
    // reads as an Escape here and closes the whole form behind the picker.
    const handleCancel = (event: Event) => {
      if (event.target !== dialog) return;
      event.preventDefault();
      onCloseRef.current();
    };
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) onCloseRef.current();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
      if (dialog.open) dialog.close();
    };
  }, [isOpen, onCloseRef]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label={title}>
      {isOpen ? (
        <div className={styles.panel}>
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          <div className={styles.body}>{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
