const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizePriority, buildTaskUpdate } = require("../../lib/taskPayload");

describe("normalizePriority", () => {
  it("keeps a known priority", () => {
    assert.equal(normalizePriority("high"), "high");
    assert.equal(normalizePriority("low"), "low");
    assert.equal(normalizePriority("normal"), "normal");
  });

  it("falls back to normal for anything else", () => {
    assert.equal(normalizePriority(undefined), "normal");
    assert.equal(normalizePriority("urgent"), "normal");
    assert.equal(normalizePriority(1), "normal");
  });
});

describe("buildTaskUpdate", () => {
  it("returns an empty object when nothing usable was sent", () => {
    assert.deepEqual(buildTaskUpdate(), {});
    assert.deepEqual(buildTaskUpdate({ title: 4, done: "yes", priority: "urgent" }), {});
  });

  it("copies only the fields the API accepts", () => {
    assert.deepEqual(
      buildTaskUpdate({
        title: "Ship it",
        description: "Write the notes",
        done: true,
        priority: "high",
        extra: "ignored",
      }),
      {
        title: "Ship it",
        description: "Write the notes",
        done: true,
        priority: "high",
      },
    );
  });
});
