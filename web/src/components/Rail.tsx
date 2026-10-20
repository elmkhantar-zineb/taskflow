import type { RefObject } from "react";
import { Icon } from "./Icon.tsx";
import type { ThemeMode } from "../types.ts";

type RailProps = {
  openCount: number;
  doneCount: number;
  highCount: number;
  addedToday: number;
  loading: boolean;
  query: string;
  onQuery: (value: string) => void;
  apiOnline: boolean | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

export function Rail({
  openCount,
  doneCount,
  highCount,
  addedToday,
  loading,
  query,
  onQuery,
  apiOnline,
  theme,
  onToggleTheme,
  searchRef,
}: RailProps) {
  const status = apiOnline === null ? "pending" : apiOnline ? "online" : "offline";
  const statusLabel =
    apiOnline === null ? "Checking API" : apiOnline ? "API connected" : "API offline";

  return (
    <header className="topbar">
      <div className="brand">
        <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="10" fill="#0f766e" />
          <path
            d="M9 16.5 14 21.5 23 11"
            fill="none"
            stroke="#f0fdfa"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="wordmark">TaskFlow</p>
          <p className="status-line">
            <span className={`status-dot ${status}`} />
            {statusLabel}
          </p>
        </div>
      </div>

      <label className="top-search">
        <span className="sr-only">Search tasks</span>
        <Icon name="search" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query) {
              event.preventDefault();
              event.stopPropagation();
              onQuery("");
            }
          }}
          placeholder="Search tasks"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button type="button" className="search-clear" onClick={() => onQuery("")} aria-label="Clear search">
            <Icon name="close" />
          </button>
        ) : null}
      </label>

      <div className="top-actions">
        <p className="count-pill">
          {loading ? "Loading…" : `${openCount} open`}
          {!loading && highCount > 0 ? <span className="pill-high">{` · ${highCount} high`}</span> : null}
          {!loading && doneCount > 0 ? <span>{` · ${doneCount} done`}</span> : null}
          {!loading && addedToday > 0 ? (
            <span>{addedToday === 1 ? " · 1 today" : ` · ${addedToday} today`}</span>
          ) : null}
        </p>
        <button
          type="button"
          className="icon-btn theme-btn"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          <Icon key={theme} name={theme === "light" ? "moon" : "sun"} />
        </button>
      </div>
    </header>
  );
}
