const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../../app");
const Task = require("../../models/task.model");

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

afterEach(async () => {
  await Task.deleteMany({});
});

describe("task API", () => {
  it("creates, lists, reads, updates, and deletes a task", async () => {
    const created = await request(app).post("/api/tasks").send({
      title: "Write the API notes",
      description: "Cover validation and the happy path",
      priority: "high",
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.title, "Write the API notes");
    assert.equal(created.body.priority, "high");
    assert.equal(created.body.done, false);
    const id = created.body._id;

    const listed = await request(app).get("/api/tasks");
    assert.equal(listed.status, 200);
    assert.equal(listed.body.length, 1);
    assert.equal(listed.body[0]._id, id);

    const fetched = await request(app).get(`/api/tasks/${id}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.description, "Cover validation and the happy path");

    const updated = await request(app).put(`/api/tasks/${id}`).send({ done: true });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.done, true);
    assert.equal(updated.body.priority, "high");
    assert.equal(updated.body.title, "Write the API notes");

    const removed = await request(app).delete(`/api/tasks/${id}`);
    assert.equal(removed.status, 200);

    const afterDelete = await request(app).get("/api/tasks");
    assert.deepEqual(afterDelete.body, []);
  });

  it("stores normal priority when the client omits it", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "A plain task",
      description: "No priority was sent",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.priority, "normal");
  });

  it("rejects a task without a title", async () => {
    const response = await request(app).post("/api/tasks").send({
      description: "Missing the title",
    });

    assert.equal(response.status, 500);
    assert.match(response.body.message, /title/i);
  });

  it("returns 400 when an update has no accepted fields", async () => {
    const created = await request(app).post("/api/tasks").send({
      title: "Keep me",
      description: "Unchanged",
    });

    const response = await request(app)
      .put(`/api/tasks/${created.body._id}`)
      .send({ priority: "urgent" });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Nothing to update.");
  });

  it("returns null when a real id has no task", async () => {
    const response = await request(app).get("/api/tasks/64b64c1c0000000000000001");

    assert.equal(response.status, 200);
    assert.equal(response.body, null);
  });

  it("returns 500 when the id is not an ObjectId", async () => {
    const response = await request(app).get("/api/tasks/not-an-id");

    assert.equal(response.status, 500);
  });

  it("returns 404 when updating a task that does not exist", async () => {
    const response = await request(app)
      .put("/api/tasks/64b64c1c0000000000000001")
      .send({ done: true });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Task not found.");
  });

  it("reports ready once MongoDB is connected", async () => {
    const response = await request(app).get("/health/ready");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ready");
    assert.equal(response.body.database, "connected");
  });

  it("allows the local Vite origin to call the API", async () => {
    const response = await request(app)
      .options("/api/tasks")
      .set("Origin", "http://localhost:5173");

    assert.equal(response.status, 204);
    assert.equal(response.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  it("does not open the API to other origins", async () => {
    const response = await request(app).get("/api/tasks").set("Origin", "https://example.com");

    assert.equal(response.headers["access-control-allow-origin"], undefined);
  });
});
