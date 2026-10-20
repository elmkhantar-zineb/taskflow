import { describe, expect, it } from "vitest";
import { addedToday, createdFromId, formatWhen, greeting, truncate } from "./format.ts";

function objectId(seconds: number) {
  return `${seconds.toString(16).padStart(8, "0")}0000000000000000`;
}

describe("createdFromId", () => {
  it("reads the creation time from an ObjectId", () => {
    const seconds = 1_700_000_000;
    expect(createdFromId(objectId(seconds))?.getTime()).toBe(seconds * 1000);
  });

  it("rejects a value that is not an ObjectId", () => {
    expect(createdFromId("not-an-id")).toBeNull();
  });
});

describe("formatWhen", () => {
  const now = 1_700_000_000_000;

  it("describes how long ago a task was added", () => {
    expect(formatWhen(new Date(now - 10_000), now)).toBe("Just now");
    expect(formatWhen(new Date(now - 61_000), now)).toBe("1m ago");
    expect(formatWhen(new Date(now - 2 * 3_600_000), now)).toBe("2h ago");
    expect(formatWhen(new Date(now - 3 * 86_400_000), now)).toBe("3d ago");
  });
});

describe("greeting", () => {
  it("follows the local hour", () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 0, 1, 20))).toBe("Good evening");
  });
});

describe("truncate", () => {
  it("trims short text and ellipsizes long text", () => {
    expect(truncate("  hello  ", 10)).toBe("hello");
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("addedToday", () => {
  it("counts ids created since local midnight", () => {
    const now = new Date(2026, 5, 15, 15, 0, 0);
    const today = Math.floor(new Date(2026, 5, 15, 9).getTime() / 1000);
    const yesterday = Math.floor(new Date(2026, 5, 14, 9).getTime() / 1000);

    expect(addedToday([objectId(today), objectId(yesterday), "bad"], now)).toBe(1);
  });
});
