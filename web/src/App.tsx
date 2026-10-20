import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Composer } from "./components/Composer.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { Rail } from "./components/Rail.tsx";
import { EmptyState, ErrorState, LoadingState } from "./components/States.tsx";
import { TaskList } from "./components/TaskList.tsx";
import { ToastViewport, type ToastItem } from "./components/Toast.tsx";
import { useTasks } from "./hooks/useTasks.ts";
import { useTheme } from "./hooks/useTheme.ts";
import { addedToday, createdFromId, greeting, truncate } from "./lib/format.ts";
import { withMotion } from "./lib/motion.ts";
import type { PanelMode, SortKey, Task, TaskDraft, TaskScope } from "./types.ts";

const sorts: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "alpha", label: "A–Z" },
];

const scopes: { id: TaskScope; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const active = root?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!root || !active) return;

    const measure = () => {
      setThumb({ x: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      className={thumb ? "segmented is-ready" : "segmented"}
      role="radiogroup"
      aria-label={label}
    >
      {thumb ? (
        <span className="segment-thumb" style={{ width: thumb.width, transform: `translateX(${thumb.x}px)` }} />
      ) : null}
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    tasks,
    status,
    error,
    apiOnline,
    reload,
    addTask,
    editTask,
    setTaskDone,
    setTaskPriority,
    removeTask,
    restoreTask,
  } = useTasks();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [scope, setScope] = useState<TaskScope>("open");
  const [composerForced, setComposerForced] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<PanelMode>("read");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, "expiresAt">) => {
    setToasts((current) =>
      [...current.filter((item) => item.id !== toast.id), { ...toast, expiresAt: Date.now() + 8000 }].slice(-3),
    );
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "Escape") {
        if (selectedId) {
          withMotion(() => setSelectedId(null), "layout");
          return;
        }
        setComposerForced(false);
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setComposerForced(true);
      } else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const scoped = tasks.filter((task) => {
      if (scope === "open") return !task.done;
      if (scope === "done") return task.done;
      return true;
    });
    const filtered = needle
      ? scoped.filter(
          (task) =>
            task.title.toLowerCase().includes(needle) ||
            task.description.toLowerCase().includes(needle) ||
            task.priority.includes(needle),
        )
      : scoped;

    return [...filtered].sort((a, b) => {
      if (sort === "alpha") {
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      }
      const aTime = createdFromId(a._id)?.getTime() ?? 0;
      const bTime = createdFromId(b._id)?.getTime() ?? 0;
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [tasks, query, sort, scope]);

  const selected = tasks.find((task) => task._id === selectedId) ?? null;
  const composerOpen = (status === "ready" && tasks.length === 0) || composerForced;
  const todayCount = addedToday(tasks.map((task) => task._id));
  const openCount = tasks.filter((task) => !task.done).length;
  const doneCount = tasks.length - openCount;
  const highCount = tasks.filter((task) => !task.done && task.priority === "high").length;
  const scopedCount =
    scope === "open" ? openCount : scope === "done" ? doneCount : tasks.length;
  const caption = query.trim()
    ? `${visible.length} ${visible.length === 1 ? "match" : "matches"} of ${scopedCount}`
    : scope === "open"
      ? `${openCount} open`
      : scope === "done"
        ? `${doneCount} done`
        : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  function openTask(id: string, nextMode: PanelMode) {
    withMotion(() => {
      setSelectedId(id);
      setMode(nextMode);
    }, "layout");
  }

  function closeTask() {
    withMotion(() => setSelectedId(null), "layout");
  }

  async function handleCreate(draft: TaskDraft) {
    await addTask(draft);
    setComposerForced(false);
    pushToast({
      id: `added-${Date.now()}`,
      message: `Added “${truncate(draft.title, 48)}”`,
    });
  }

  async function handleUpdate(id: string, draft: TaskDraft) {
    await editTask(id, draft);
    pushToast({ id: `saved-${id}`, message: "Changes saved" });
  }

  async function handlePriority(task: Task, priority: Task["priority"]) {
    if (task.priority === priority) return;
    try {
      await setTaskPriority(task, priority);
    } catch (err) {
      pushToast({
        id: `priority-error-${Date.now()}`,
        message: err instanceof Error ? err.message : "Couldn't update that priority.",
      });
    }
  }

  async function handleToggle(task: Task) {
    const next = !task.done;
    const toastId = `done-${task._id}`;
    let undoing = false;
    pushToast({
      id: toastId,
      message: next
        ? `Finished “${truncate(task.title, 48)}”`
        : `Reopened “${truncate(task.title, 48)}”`,
      actionLabel: "Undo",
      onAction: () => {
        if (undoing) return;
        undoing = true;
        void setTaskDone(task, task.done).catch((err: unknown) => {
          pushToast({
            id: `done-undo-error-${Date.now()}`,
            message: err instanceof Error ? err.message : "Couldn't undo that.",
          });
        });
      },
    });

    try {
      await setTaskDone(task, next);
    } catch (err) {
      dismissToast(toastId);
      pushToast({
        id: `done-error-${Date.now()}`,
        message: err instanceof Error ? err.message : "Couldn't update that task.",
      });
    }
  }

  async function handleDelete(task: Task) {
    if (selectedId === task._id) setSelectedId(null);
    const toastId = `delete-${task._id}`;
    let restoring = false;
    pushToast({
      id: toastId,
      message: `Removed “${truncate(task.title, 48)}”`,
      actionLabel: "Undo",
      onAction: () => {
        if (restoring) return;
        restoring = true;
        void restoreTask(task)
          .then(() => {
            pushToast({
              id: `restored-${task._id}-${Date.now()}`,
              message: "Task restored",
            });
          })
          .catch((err: unknown) => {
            pushToast({
              id: `restore-error-${Date.now()}`,
              message: err instanceof Error ? err.message : "Couldn't restore that task.",
            });
          });
      },
    });

    try {
      await removeTask(task);
    } catch (err) {
      dismissToast(toastId);
      pushToast({
        id: `delete-error-${Date.now()}`,
        message: err instanceof Error ? err.message : "Couldn't delete that task.",
      });
    }
  }

  return (
    <div className={selected ? "app inspecting" : "app"}>
      <Rail
        openCount={openCount}
        doneCount={doneCount}
        highCount={highCount}
        addedToday={todayCount}
        loading={status === "loading"}
        query={query}
        onQuery={setQuery}
        apiOnline={apiOnline}
        theme={theme}
        onToggleTheme={toggleTheme}
        searchRef={searchRef}
      />

      <main className="workspace">
        <div className="workspace-inner">
          <header className="page-head">
            <div>
              <p className="kicker">Workspace</p>
              <h1>{greeting()}</h1>
            </div>
            <p className="lede">
              <kbd>N</kbd> new
              <kbd>/</kbd> search
              <kbd>Esc</kbd> close
            </p>
          </header>

          {status === "ready" && tasks.length > 0 ? (
            <div className="toolbar">
              <Segmented
                label="Show tasks"
                value={scope}
                options={scopes}
                onChange={(next) => withMotion(() => setScope(next), "list")}
              />
              <p className="toolbar-count">{caption}</p>
              <Segmented
                label="Sort tasks"
                value={sort}
                options={sorts}
                onChange={(next) => withMotion(() => setSort(next), "list")}
              />
            </div>
          ) : null}

          <Composer
            open={composerOpen}
            canDismiss={tasks.length > 0}
            onOpen={() => setComposerForced(true)}
            onDismiss={() => setComposerForced(false)}
            onCreate={handleCreate}
            titleRef={titleRef}
          />

          {status === "ready" && apiOnline === false ? (
            <p className="banner" role="status">
              The API is unreachable. You can keep reading what’s here, but changes may not save.
            </p>
          ) : null}

          {status === "loading" ? <LoadingState /> : null}
          {status === "error" ? (
            <ErrorState message={error ?? "Couldn't load tasks."} onRetry={() => void reload()} />
          ) : null}

          {status === "ready" && visible.length > 0 ? (
            <TaskList
              tasks={visible}
              query={query}
              selectedId={selected?._id ?? null}
              onOpen={(id) => openTask(id, "read")}
              onEdit={(id) => openTask(id, "edit")}
              onDelete={(task) => void handleDelete(task)}
              onToggle={(task) => void handleToggle(task)}
            />
          ) : null}

          {status === "ready" && visible.length === 0 && (tasks.length > 0 || query.trim()) ? (
            <EmptyState
              query={query}
              scope={scope}
              onClear={() => setQuery("")}
              onShowDone={() => withMotion(() => setScope("done"), "list")}
              onShowOpen={() => withMotion(() => setScope("open"), "list")}
            />
          ) : null}
        </div>
      </main>

      {selected ? (
        <Inspector
          key={selected._id}
          task={selected}
          mode={mode}
          onMode={setMode}
          onClose={closeTask}
          onUpdate={handleUpdate}
          onDelete={(task) => void handleDelete(task)}
          onToggle={(task) => void handleToggle(task)}
          onPriority={(task, priority) => void handlePriority(task, priority)}
        />
      ) : null}

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
