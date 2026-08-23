import { useCallback, useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  // Remember what had focus so it can be handed back on close, otherwise
  // dismissing the dialog drops focus onto <body>.
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    confirmRef.current?.focus();
    return () => {
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && document.contains(target)) target.focus();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;

      // Trap Tab inside the dialog; without this it walks into the page behind.
      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        <p id={descriptionId} className="dialog__description">
          {description}
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" ref={confirmRef} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
