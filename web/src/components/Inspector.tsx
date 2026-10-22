import { useEffect, useId, useRef, useState } from "react";
import { createdFromId, formatFull } from "../lib/format.ts";
import type { PanelMode, Priority, Task, TaskDraft } from "../types.ts";
import { Icon } from "./Icon.tsx";
import { PriorityPicker } from "./Priority.tsx";

type InspectorProps = {
  task: Task;
  mode: PanelMode;
  onMode: (mode: PanelMode) => void;
  onClose: () => void;
  onUpdate: (id: string, draft: TaskDraft) => Promise<void>;
  onDelete: (task: Task) => void;
  onCopy: (task: Task) => void;
  onToggle: (task: Task) => void;
  onPriority: (task: Task, priority: Priority) => void;
};

const TITLE_LIMIT = 180;
const DESCRIPTION_LIMIT = 5000;

export function Inspector({
  task,
  mode,
  onMode,
  onClose,
  onUpdate,
  onDelete,
  onCopy,
  onToggle,
  onPriority,
}: InspectorProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleField = useId();
  const descriptionField = useId();
  const errorId = useId();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = title.trim() !== task.title || description.trim() !== task.description;
  const created = createdFromId(task._id);
  const [sheet, setSheet] = useState(() => window.matchMedia("(max-width: 860px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const onChange = () => setSheet(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget =
      mode === "edit"
        ? root.querySelector<HTMLElement>("input")
        : root.querySelector<HTMLElement>("[data-autofocus]");
    focusTarget?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>("button, input, textarea"),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("keydown", onKeyDown);
    const media = window.matchMedia("(max-width: 860px)");
    const previousOverflow = document.body.style.overflow;
    if (media.matches) document.body.style.overflow = "hidden";

    return () => {
      root.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [mode, task._id]);

  function cancel() {
    setTitle(task.title);
    setDescription(task.description);
    setError(null);
    onMode("read");
  }

  async function save() {
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (!nextTitle) {
      setError("Give the task a title.");
      return;
    }
    if (!nextDescription) {
      setError("Add a short description.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onUpdate(task._id, { title: nextTitle, description: nextDescription });
      setTitle(nextTitle);
      setDescription(nextDescription);
      onMode("read");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" className="backdrop" aria-label="Close task" onClick={onClose} />
      <aside
        ref={panelRef}
        className="inspector"
        role="dialog"
        aria-modal={sheet}
        aria-labelledby="inspector-title"
      >
        <div className="inspector-top">
          <p className="kicker">{task.done ? "Finished" : "Task"}</p>
          <button
            type="button"
            className="icon-btn"
            data-autofocus={mode === "read" ? true : undefined}
            onClick={onClose}
            aria-label="Close task details"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="inspector-body">
          {created ? <p className="meta">Added {formatFull(created)}</p> : null}
          <PriorityPicker value={task.priority} onChange={(priority) => onPriority(task, priority)} disabled={saving} />

          {mode === "read" ? (
            <>
              <h2 className={task.done ? "inspector-title is-done" : "inspector-title"} id="inspector-title">
                {task.title}
              </h2>
              <p className="prose">{task.description}</p>
            </>
          ) : (
            <form
              className="inspector-form"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <div className="field">
                <label className="label-row" htmlFor={titleField}>
                  <span>Title</span>
                  {title.length > 140 ? (
                    <span>
                      {title.length}/{TITLE_LIMIT}
                    </span>
                  ) : null}
                </label>
                <input
                  id={titleField}
                  className="title-input"
                  value={title}
                  maxLength={TITLE_LIMIT}
                  autoComplete="off"
                  aria-invalid={error !== null}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError(null);
                  }}
                />
              </div>
              <div className="field">
                <label className="label-row" htmlFor={descriptionField}>
                  <span>Description</span>
                </label>
                <textarea
                  id={descriptionField}
                  value={description}
                  maxLength={DESCRIPTION_LIMIT}
                  rows={8}
                  aria-invalid={error !== null}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setError(null);
                  }}
                />
              </div>
              <h2 className="sr-only" id="inspector-title">
                Edit {task.title}
              </h2>
              {error ? (
                <p className="field-error" id={errorId} role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>

        <div className="inspector-foot">
          <div className="foot-right">
            <button type="button" className="btn btn-ghost" onClick={() => onCopy(task)}>
              <Icon name="copy" />
              Copy
            </button>
            <button type="button" className="btn btn-ghost danger" onClick={() => onDelete(task)}>
              Delete
            </button>
          </div>
          <div className="foot-right">
            {mode === "edit" && dirty ? <span className="dirty">Unsaved</span> : null}
            {mode === "edit" ? (
              <button type="button" className="btn btn-ghost" onClick={cancel} disabled={saving}>
                Cancel
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => onMode("edit")}>
                <Icon name="pencil" />
                Edit
              </button>
            )}
            {mode === "edit" ? (
              <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save"}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => onToggle(task)}>
                {task.done ? "Reopen" : "Mark done"}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
