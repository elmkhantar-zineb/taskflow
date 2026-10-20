import { afterEach, describe, expect, it, vi } from "vitest";
import { createTask, deleteTask, fetchTasks, pingApi, updateTask } from "./api.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const task = {
  _id: "abc",
  title: "Write tests",
  description: "Cover the client",
  done: false,
  priority: "high",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("task client", () => {
  it("fills in done and priority when the API omits them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse([{ _id: "abc", title: "Write tests", description: "Cover the client" }]),
      ),
    );

    await expect(fetchTasks()).resolves.toEqual([
      { _id: "abc", title: "Write tests", description: "Cover the client", done: false, priority: "normal" },
    ]);
  });

  it("rejects a payload that is not a task list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tasks: [] })));

    await expect(fetchTasks()).rejects.toThrow("The API returned an unexpected task list.");
  });

  it("uses the API error message when a request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Task not found." }, 404)));

    await expect(updateTask("abc", { done: true })).rejects.toThrow("Task not found.");
  });

  it("explains that the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    await expect(fetchTasks()).rejects.toThrow("Can't reach the API");
  });

  it("sends create, update, and delete to the task routes", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? "GET") === "DELETE") return jsonResponse({ message: "Task deleted successfully" });
      return jsonResponse(task);
    });
    vi.stubGlobal("fetch", fetchMock);

    await createTask({ title: "Write tests", description: "Cover the client", priority: "high" });
    await updateTask("abc", { done: true });
    await deleteTask("abc");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/tasks",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/tasks/abc",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/tasks/abc",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("reports whether the live check succeeded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    await expect(pingApi()).resolves.toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(pingApi()).resolves.toBe(false);
  });
});
