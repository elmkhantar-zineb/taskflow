export type Task = {
  _id: string;
  title: string;
  description: string;
};

export type TaskDraft = {
  title: string;
  description: string;
};

export type SortKey = "newest" | "oldest" | "alpha";

export type ThemeMode = "light" | "dark";

export type PanelMode = "read" | "edit";
