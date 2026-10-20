import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  pingApi,
  updateTask,
} from "../api.ts";
import { withMotion } from "../lib/motion.ts";
import type { Priority, Task, TaskDraft } from "../types.ts";

function messageFrom(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchTasks();
      setTasks(next);
      setStatus("ready");
      setError(null);
      setApiOnline(true);
      hasLoaded.current = true;
    } catch (err) {
      setApiOnline(false);
      if (hasLoaded.current) return;
      setStatus("error");
      setError(messageFrom(err, "Couldn't load tasks."));
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchTasks()
      .then((next) => {
        if (ignore) return;
        setTasks(next);
        setStatus("ready");
        setError(null);
        setApiOnline(true);
        hasLoaded.current = true;
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setApiOnline(false);
        if (hasLoaded.current) return;
        setStatus("error");
        setError(messageFrom(err, "Couldn't load tasks."));
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const ping = () => {
      void pingApi().then((ok) => {
        if (!ignore) setApiOnline(ok);
      });
    };
    ping();
    const id = window.setInterval(ping, 20000);
    return () => {
      ignore = true;
      window.clearInterval(id);
    };
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    hasLoaded.current = false;
    await load();
  }, [load]);

  const addTask = useCallback(async (draft: TaskDraft) => {
    const created = await createTask(draft);
    setApiOnline(true);
    if (!hasLoaded.current) {
      withMotion(() => {
        setTasks((prev) => [created, ...prev.filter((task) => task._id !== created._id)]);
      }, "list");
      await load();
      return created;
    }
    withMotion(() => {
      setTasks((prev) => [created, ...prev.filter((task) => task._id !== created._id)]);
    }, "list");
    setStatus("ready");
    return created;
  }, [load]);

  const editTask = useCallback(async (id: string, draft: TaskDraft) => {
    const updated = await updateTask(id, draft);
    setTasks((prev) => prev.map((task) => (task._id === id ? updated : task)));
    setApiOnline(true);
    return updated;
  }, []);

  const removeTask = useCallback(async (task: Task) => {
    withMotion(() => {
      setTasks((prev) => prev.filter((item) => item._id !== task._id));
    }, "list");
    try {
      await deleteTask(task._id);
      setApiOnline(true);
    } catch (err) {
      setTasks((prev) =>
        prev.some((item) => item._id === task._id) ? prev : [task, ...prev],
      );
      throw err;
    }
  }, []);

  const setTaskPriority = useCallback(async (task: Task, priority: Priority) => {
    setTasks((prev) => prev.map((item) => (item._id === task._id ? { ...item, priority } : item)));
    try {
      const updated = await updateTask(task._id, { priority });
      setTasks((prev) => prev.map((item) => (item._id === task._id ? updated : item)));
      setApiOnline(true);
      return updated;
    } catch (err) {
      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? { ...item, priority: task.priority } : item)),
      );
      throw err;
    }
  }, []);

  const setTaskDone = useCallback(async (task: Task, done: boolean) => {
    withMotion(() => {
      setTasks((prev) => prev.map((item) => (item._id === task._id ? { ...item, done } : item)));
    }, "list");
    try {
      const updated = await updateTask(task._id, { done });
      setTasks((prev) => prev.map((item) => (item._id === task._id ? updated : item)));
      setApiOnline(true);
      return updated;
    } catch (err) {
      withMotion(() => {
        setTasks((prev) =>
          prev.map((item) => (item._id === task._id ? { ...item, done: task.done } : item)),
        );
      }, "list");
      throw err;
    }
  }, []);

  const restoreTask = useCallback(async (task: Task) => {
    const created = await createTask({
      title: task.title,
      description: task.description,
    });
    withMotion(() => {
      setTasks((prev) => [created, ...prev]);
    }, "list");
    setApiOnline(true);
    return created;
  }, []);

  return {
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
  };
}
