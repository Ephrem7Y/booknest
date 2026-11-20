// The guard must be the first import. ES modules run in import order.
import "./guard.js";

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import app from "../app.js";
import db from "../db.js";
import { users } from "../db/schema.js";

let server: Server | undefined;
let baseUrl = "";

// Starts the real Express app on a random free port.
export async function startServer(): Promise<void> {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });

  baseUrl = `http://127.0.0.1:${(server?.address() as AddressInfo).port}`;
}

// Stops the server so the test process can finish.
export async function stopServer(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export type ApiBody = Record<string, any>;

// Sends a request to the running test server and returns the status and the parsed JSON body.
export async function api(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; headers?: Record<string, string>} = {},
): Promise<{ status: number; body: ApiBody }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  // Extra headers go last, so a test can send a malformed Authorization header on purpose.
  Object.assign(headers, options.headers);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });

  return { status: response.status, body: (await response.json()) as ApiBody };
}

// Deletes every user, so each test file starts from a known empty state.
export async function resetUsers(): Promise<void> {
  await db.delete(users);
}
