import type { CSSProperties } from "react";
import { createdFromId, formatFull, formatWhen } from "../lib/format.ts";
import type { Task } from "../types.ts";
import { Highlight } from "./Highlight.tsx";
import { Icon } from "./Icon.tsx";

type TaskListProps = {
  tasks: Task[];
  query: string;
  selectedId: string | null;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({
  tasks,
  query,
  selectedId,
  onOpen,
  onEdit,
  onDelete,
}: TaskListProps) {
  return (
    <ul className="stack task-list">
      {tasks.map((task) => {
        const created = createdFromId(task._id);
        return (
          <li key={task._id} style={{ "--vt": `task-${task._id}` } as CSSProperties}>
            <article className={task._id === selectedId ? "card is-selected" : "card"}>
              <div className="card-copy">
                <h2 className="card-title">
                  <button type="button" onClick={() => onOpen(task._id)}>
                    <Highlight text={task.title} query={query} />
                  </button>
                </h2>
                <p className="card-body">
                  <Highlight text={task.description} query={query} />
                </p>
                {created ? (
                  <time className="card-meta" dateTime={created.toISOString()} title={formatFull(created)}>
                    {formatWhen(created)}
                  </time>
                ) : null}
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Edit ${task.title}`}
                  onClick={() => onEdit(task._id)}
                >
                  <Icon name="pencil" />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => onDelete(task)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
