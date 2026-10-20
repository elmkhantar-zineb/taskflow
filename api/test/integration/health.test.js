const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../../app");

describe("health routes", () => {
  it("reports the process as live", async () => {
    const response = await request(app).get("/health/live");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(typeof response.body.uptime, "number");
  });

  it("is not ready before a database connection exists", async () => {
    const response = await request(app).get("/health/ready");

    assert.equal(response.status, 503);
    assert.equal(response.body.status, "not_ready");
    assert.equal(response.body.database, "disconnected");
  });
});
