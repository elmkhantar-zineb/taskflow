import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import type { TaskDraft } from "../types.ts";
import { Icon } from "./Icon.tsx";

type ComposerProps = {
  open: boolean;
  canDismiss: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  onCreate: (draft: TaskDraft) => Promise<void>;
  titleRef: RefObject<HTMLInputElement | null>;
};

const TITLE_LIMIT = 180;
const DESCRIPTION_LIMIT = 5000;

function modifierLabel() {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
}

export function Composer({
  open,
  canDismiss,
  onOpen,
  onDismiss,
  onCreate,
  titleRef,
}: ComposerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const startedOpen = useRef(open);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const shortcut = modifierLabel();

  useEffect(() => {
    if (!open) return;
    const skipInitialMobile =
      startedOpen.current && window.matchMedia("(max-width: 860px)").matches;
    startedOpen.current = false;
    if (skipInitialMobile) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    titleRef.current?.scrollIntoView({ block: "center", behavior });
    titleRef.current?.focus();
  }, [open, titleRef]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (!nextTitle) {
      setError("Give the task a title.");
      titleRef.current?.focus();
      return;
    }
    if (!nextDescription) {
      setError("Add a short description.");
      descriptionRef.current?.focus();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate({ title: nextTitle, description: nextDescription });
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the task.");
    } finally {
      setSaving(false);
    }
  }

  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
    if (event.key === "Escape" && canDismiss) {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    }
  }

  if (!open) {
    return (
      <button type="button" className="composer-prompt" onClick={onOpen}>
        <Icon name="plus" />
        <span>Add a task</span>
        <kbd className="hint-key">N</kbd>
      </button>
    );
  }

  return (
    <form className="composer" onSubmit={onSubmit} onKeyDown={onFormKeyDown} noValidate>
      <div className="field">
        <label className="label-row" htmlFor={titleId}>
          <span>Title</span>
          {title.length > 140 ? (
            <span>
              {title.length}/{TITLE_LIMIT}
            </span>
          ) : null}
        </label>
        <input
          id={titleId}
          ref={titleRef}
          value={title}
          maxLength={TITLE_LIMIT}
          autoComplete="off"
          placeholder="Name the task"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
              event.preventDefault();
              descriptionRef.current?.focus();
            }
          }}
        />
      </div>

      <div className="field">
        <label className="label-row" htmlFor={descriptionId}>
          <span>Description</span>
          {description.length > 4500 ? (
            <span>
              {description.length}/{DESCRIPTION_LIMIT}
            </span>
          ) : null}
        </label>
        <textarea
          id={descriptionId}
          ref={descriptionRef}
          value={description}
          maxLength={DESCRIPTION_LIMIT}
          rows={2}
          placeholder="Add the detail you'll want later"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setDescription(event.target.value);
            setError(null);
          }}
        />
      </div>

      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      <div className="composer-actions">
        <p className="hint">{shortcut}+Enter to add</p>
        <div className="composer-buttons">
          {canDismiss ? (
            <button className="btn btn-ghost" type="button" onClick={onDismiss} disabled={saving}>
              Cancel
            </button>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Icon name="plus" />
            {saving ? "Adding…" : "Add task"}
          </button>
        </div>
      </div>
    </form>
  );
}
