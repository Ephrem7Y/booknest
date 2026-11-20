import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { api, startServer, stopServer } from "./helpers.js";

describe("smoke", () => {
  before(startServer);
  after(stopServer);

  it("health check reports a connected database", async () => {
    const { status, body } = await api("GET", "/");
    assert.equal(status, 200);
    assert.equal(body.database, "connected");
  });

  it("unknown routes use the standard error shape", async () => {
    const { status, body } = await api("GET", "/nope");
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });
});
