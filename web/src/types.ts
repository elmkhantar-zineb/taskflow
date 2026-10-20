export type Priority = "low" | "normal" | "high";

export type Task = {
  _id: string;
  title: string;
  description: string;
  done: boolean;
  priority: Priority;
};

export type TaskScope = "open" | "done" | "all";

export type TaskDraft = {
  title: string;
  description: string;
  priority?: Priority;
};

export type TaskPatch = Partial<TaskDraft> & {
  done?: boolean;
  priority?: Priority;
};

export type SortKey = "newest" | "oldest" | "alpha";

export type ThemeMode = "light" | "dark";

export type PanelMode = "read" | "edit";
