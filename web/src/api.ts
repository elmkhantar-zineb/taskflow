import type { Task, TaskDraft } from "./types.ts";

const UNREACHABLE =
  "Can't reach the API. In the api folder, run npm run dev so it listens on port 3000.";

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task._id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string"
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(UNREACHABLE);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `The API returned ${response.status}.`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const data = await request<unknown>("/api/tasks");
  if (!Array.isArray(data) || !data.every(isTask)) {
    throw new Error("The API returned an unexpected task list.");
  }
  return data;
}

export async function createTask(draft: TaskDraft): Promise<Task> {
  const data = await request<unknown>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  if (!isTask(data)) throw new Error("The API returned an unexpected task.");
  return data;
}

export async function updateTask(id: string, draft: TaskDraft): Promise<Task> {
  const data = await request<unknown>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(draft),
  });
  if (!isTask(data)) throw new Error("That task could not be updated.");
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await request<unknown>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function pingApi(): Promise<boolean> {
  try {
    const response = await fetch("/health/live", {
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}
