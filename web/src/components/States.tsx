import type { TaskScope } from "../types.ts";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function LoadingState() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tasks</span>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="empty">
      <svg className="empty-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M32 22v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="42" r="1.2" fill="currentColor" />
      </svg>
      <h2>Can’t reach your tasks</h2>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  query,
  scope,
  onClear,
  onShowDone,
  onShowOpen,
}: {
  query: string;
  scope: TaskScope;
  onClear: () => void;
  onShowDone: () => void;
  onShowOpen: () => void;
}) {
  if (query.trim()) {
    return (
      <div className="empty">
        <h2>No tasks match</h2>
        <p>Nothing lines up with “{query.trim()}”. Try another word, or clear the search.</p>
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear search
        </button>
      </div>
    );
  }

  if (scope === "done") {
    return (
      <div className="empty">
        <svg className="empty-mark" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M22 33.5 29 40.5 43 25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2>Nothing finished yet</h2>
        <p>Mark a task done and it will wait here, out of the way of what is still open.</p>
        <button type="button" className="btn btn-ghost" onClick={onShowOpen}>
          Back to open
        </button>
      </div>
    );
  }

  if (scope === "open") {
    return (
      <div className="empty">
        <svg className="empty-mark" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M22 33.5 29 40.5 43 25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2>All clear</h2>
        <p>Every task is finished. Reopen one if it still needs you.</p>
        <button type="button" className="btn btn-ghost" onClick={onShowDone}>
          See finished
        </button>
      </div>
    );
  }

  return (
    <div className="empty">
      <svg className="empty-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 32h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <h2>A clear plate</h2>
      <p>When something needs doing, write it down. A title and a short description are enough.</p>
    </div>
  );
}
