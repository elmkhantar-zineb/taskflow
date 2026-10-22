import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";

const seconds = Math.floor(Date.now() / 1000)
  .toString(16)
  .padStart(8, "0");

const tasks = [
  {
    _id: `${seconds}0000000000000001`,
    title: "Write tests",
    description: "Cover the board",
    done: false,
    priority: "high",
  },
  {
    _id: `${seconds}0000000000000002`,
    title: "Ship the API",
    description: "Lint and tests",
    done: false,
    priority: "low",
  },
];

function installFetch() {
  const state = tasks.map((task) => ({ ...task }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/health/live")) return new Response("{}", { status: 200 });
      if (url.includes("/api/tasks") && method === "POST") {
        const draft = JSON.parse(String(init?.body)) as {
          title: string;
          description: string;
          priority?: string;
        };
        const created = {
          _id: `${seconds}00000000000000ff`,
          title: draft.title,
          description: draft.description,
          done: false,
          priority: draft.priority ?? "normal",
        };
        state.unshift(created);
        return new Response(JSON.stringify(created), { status: 201 });
      }
      if (url.includes("/api/tasks") && method === "PUT") {
        const id = decodeURIComponent(url.split("/").pop() ?? "");
        const patch = JSON.parse(String(init?.body)) as { done?: boolean };
        const task = state.find((item) => item._id === id);
        if (!task) {
          return new Response(JSON.stringify({ message: "Task not found." }), { status: 404 });
        }
        Object.assign(task, patch);
        return new Response(JSON.stringify(task), { status: 200 });
      }
      if (url.includes("/api/tasks")) return new Response(JSON.stringify(state), { status: 200 });
      return new Response("not found", { status: 404 });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("task board", () => {
  it("lists open tasks, marks one done, and searches the rest", async () => {
    installFetch();
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("button", { name: "Mark Write tests done" })).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/1 high/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark Write tests done" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Mark Write tests done" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Mark Ship the API done" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Done" }));
    expect(await screen.findByRole("button", { name: "Reopen Write tests" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "All" }));
    await user.type(screen.getByRole("textbox", { name: "Search tasks" }), "ship");
    expect(screen.getByRole("heading", { name: /Ship/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Write tests/ })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Search tasks" }));
    await user.type(screen.getByRole("textbox", { name: "Search tasks" }), "zzzz");
    expect(screen.getByRole("heading", { name: "No tasks match" })).toBeInTheDocument();
  });

  it("copies a task onto the open list", async () => {
    installFetch();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Copy Write tests" }));

    expect(await screen.findByText("Copied “Write tests”")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /Write tests/ })).toHaveLength(2);
    expect(screen.getAllByText("High")).toHaveLength(2);
  });
});
