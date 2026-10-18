import { useEffect, useState } from "react";

export type ToastItem = {
  id: string;
  message: string;
  expiresAt: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  const [leaving, setLeaving] = useState<string[]>([]);

  function beginDismiss(id: string) {
    setLeaving((current) => (current.includes(id) ? current : [...current, id]));
    window.setTimeout(() => onDismiss(id), 220);
  }

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setLeaving((current) => (current.includes(toast.id) ? current : [...current, toast.id]));
        window.setTimeout(() => onDismiss(toast.id), 220);
      }, Math.max(0, toast.expiresAt - Date.now())),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="toaster" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={leaving.includes(toast.id) ? "toast is-leaving" : "toast"}
          role="status"
        >
          <p>{toast.message}</p>
          <div className="toast-actions">
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.onAction?.();
                  beginDismiss(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => beginDismiss(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
