const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Task = require("../../models/task.model");
const {
  getAllTasks,
  createTask,
  getTaskById,
  updateTaskById,
  deleteTaskById,
} = require("../../controllers/task.controller");

const originals = {
  find: Task.find,
  findById: Task.findById,
  findByIdAndUpdate: Task.findByIdAndUpdate,
  findByIdAndDelete: Task.findByIdAndDelete,
  save: Task.prototype.save,
};

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

afterEach(() => {
  Task.find = originals.find;
  Task.findById = originals.findById;
  Task.findByIdAndUpdate = originals.findByIdAndUpdate;
  Task.findByIdAndDelete = originals.findByIdAndDelete;
  Task.prototype.save = originals.save;
});

describe("task controller", () => {
  it("lists tasks returned by the model", async () => {
    Task.find = async () => [{ title: "One" }];
    const res = mockRes();

    await getAllTasks({}, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ title: "One" }]);
  });

  it("returns 500 when listing fails", async () => {
    Task.find = async () => {
      throw new Error("db down");
    };
    const res = mockRes();

    await getAllTasks({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "db down");
  });

  it("creates a task and defaults an unknown priority", async () => {
    Task.prototype.save = async function save() {
      return this;
    };
    const res = mockRes();

    await createTask(
      { body: { title: "Notes", description: "Draft them", priority: "urgent" } },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.title, "Notes");
    assert.equal(res.body.priority, "normal");
    assert.equal(res.body.done, false);
  });

  it("returns the task found by id, including null when it is missing", async () => {
    Task.findById = async () => null;
    const res = mockRes();

    await getTaskById({ params: { id: "missing" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body, null);
  });

  it("rejects an update that has no accepted fields", async () => {
    let called = false;
    Task.findByIdAndUpdate = async () => {
      called = true;
      return null;
    };
    const res = mockRes();

    await updateTaskById({ params: { id: "1" }, body: { priority: "nope" } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Nothing to update.");
    assert.equal(called, false);
  });

  it("returns 404 when the task to update does not exist", async () => {
    Task.findByIdAndUpdate = async () => null;
    const res = mockRes();

    await updateTaskById({ params: { id: "1" }, body: { done: true } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Task not found.");
  });

  it("deletes a task", async () => {
    let removed;
    Task.findByIdAndDelete = async (id) => {
      removed = id;
    };
    const res = mockRes();

    await deleteTaskById({ params: { id: "abc" } }, res);

    assert.equal(removed, "abc");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, "Task deleted successfully");
  });
});
