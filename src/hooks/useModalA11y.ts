// Shared modal accessibility: Escape closes, initial focus moves into the
// dialog, and focus returns to the opener when it unmounts.

import { useEffect, useRef } from 'react';

export function useModalA11y(onClose: () => void, enabled = true) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;
    const opener = document.activeElement as HTMLElement | null;

    // Move focus into the dialog
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
  }, [enabled]);

  return dialogRef;
}
