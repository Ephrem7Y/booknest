import "./guard.js";

import assert from "node:assert/strict";
import { before, after, describe, it } from "node:test";

import { eq } from "drizzle-orm";
import { SignJWT } from "jose";

import { env } from "../config/env.js";
import db from "../db.js";
import { books, users } from "../db/schema.js";
import { hashPassword } from "../utils/password.js";
import { api, resetUsers, startServer, stopServer } from "./helpers.js";

const PASSWORD = "test-password-123";
const BOOK = { title: "Test Book", description: "temporary", price: 9.99 };
const key = new TextEncoder().encode(env.JWT_SECRET);
const nowSeconds = () => Math.floor(Date.now() / 1000);

let counter = 0;
const uniqueEmail = () => `user${++counter}@example.com`;

// Inserts a user straight into the TEST database. Public registration can never create admins.
async function createUser(
  role: "customer" | "admin" = "customer",
): Promise<string> {
  const email = uniqueEmail();
  await db.insert(users).values({
    name: "Test User",
    email,
    passwordHash: await hashPassword(PASSWORD),
    role,
  });
  return email;
}

async function getUser(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  assert.ok(user, "expected the user to exist in the database");
  return user;
}

async function loginToken(email: string): Promise<string> {
  const { status, body } = await api("POST", "/auth/login", {
    body: { email, password: PASSWORD },
  });
  assert.equal(status, 200);
  return body.token as string;
}

// Signs a token ourselves, to build tokens the login endpoint would never issue.
async function craftToken(options: {
  sub: string;
  role?: string;
  exp: number | null;
}): Promise<string> {
  let jwt = new SignJWT({ role: options.role ?? "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(options.sub)
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt(nowSeconds() - 120);

  if (options.exp !== null) jwt = jwt.setExpirationTime(options.exp);
  return jwt.sign(key);
}

describe("authentication", () => {
  before(async () => {
    await startServer();
    await resetUsers();
  });

  after(async () => {
    await db.delete(books);
    await resetUsers();
    await stopServer();
  });

  describe("registration", () => {
    it("creates a customer and never returns the hash or the password", async () => {
      const email = uniqueEmail();
      const { status, body } = await api("POST", "/auth/register", {
        body: { name: "Ada", email, password: PASSWORD },
      });

      assert.equal(status, 201);
      assert.equal(body.user.email, email);
      assert.equal(body.user.role, "customer");

      const raw = JSON.stringify(body);
      for (const forbidden of [
        "passwordHash",
        "password_hash",
        "argon2",
        PASSWORD,
      ]) {
        assert.ok(
          !raw.includes(forbidden),
          `response must not contain "${forbidden}"`,
        );
      }
    });

    it("trims and lowercases the email", async () => {
      const email = uniqueEmail();
      const { status, body } = await api("POST", "/auth/register", {
        body: {
          name: "Ada",
          email: `  ${email.toUpperCase()} `,
          password: PASSWORD,
        },
      });

      assert.equal(status, 201);
      assert.equal(body.user.email, email);
    });

    it("ignores a role submitted by the client", async () => {
      const email = uniqueEmail();
      const { status, body } = await api("POST", "/auth/register", {
        body: { name: "Mallory", email, password: PASSWORD, role: "admin" },
      });

      assert.equal(status, 201);
      assert.equal(body.user.role, "customer");
      assert.equal((await getUser(email)).role, "customer");
    });

    it("stores an Argon2id hash, not the password", async () => {
      const email = uniqueEmail();
      await api("POST", "/auth/register", {
        body: { name: "Ada", email, password: PASSWORD },
      });

      const stored = (await getUser(email)).passwordHash;
      assert.ok(stored.startsWith("$argon2id$"));
      assert.notEqual(stored, PASSWORD);
    });

    it("rejects invalid input with 400", async () => {
      const cases = [
        { name: "", email: uniqueEmail(), password: PASSWORD },
        { name: "Ada", email: "not-an-email", password: PASSWORD },
        { name: "Ada", email: uniqueEmail(), password: "short" },
        { name: "Ada", email: uniqueEmail() },
      ];

      for (const body of cases) {
        const response = await api("POST", "/auth/register", { body });
        assert.equal(
          response.status,
          400,
          `expected 400 for ${JSON.stringify(body)}`,
        );
      }
    });

    it("rejects a duplicate email, whatever its capitalization", async () => {
      const email = uniqueEmail();
      const first = await api("POST", "/auth/register", {
        body: { name: "Ada", email, password: PASSWORD },
      });
      const second = await api("POST", "/auth/register", {
        body: { name: "Other", email: email.toUpperCase(), password: PASSWORD },
      });

      assert.equal(first.status, 201);
      assert.equal(second.status, 409);
      assert.equal(second.body.message, "Email is already registered.");
    });

    it("lets exactly one of two simultaneous registrations win", async () => {
      const email = uniqueEmail();
      const request = () =>
        api("POST", "/auth/register", {
          body: { name: "Racer", email, password: PASSWORD },
        });

      const results = await Promise.all([request(), request()]);
      const statuses = results
        .map((result) => result.status)
        .sort((a, b) => a - b);

      assert.deepEqual(statuses, [201, 409]);
    });
  });

  describe("login", () => {
    it("returns a token and the safe user fields", async () => {
      const email = await createUser();
      const { status, body } = await api("POST", "/auth/login", {
        body: { email, password: PASSWORD },
      });

      assert.equal(status, 200);
      assert.equal(typeof body.token, "string");
      assert.equal(body.expiresIn, env.JWT_EXPIRES_IN);
      assert.equal(body.user.email, email);
      assert.equal(body.user.role, "customer");
      assert.ok(!JSON.stringify(body).includes("passwordHash"));
    });

    it("normalizes the email on login too", async () => {
      const email = await createUser();
      const { status } = await api("POST", "/auth/login", {
        body: { email: `  ${email.toUpperCase()} `, password: PASSWORD },
      });

      assert.equal(status, 200);
    });

    it("gives the same 401 for a wrong password and an unknown email", async () => {
      const email = await createUser();
      const wrongPassword = await api("POST", "/auth/login", {
        body: { email, password: "wrong-password-123" },
      });
      const unknownEmail = await api("POST", "/auth/login", {
        body: { email: uniqueEmail(), password: "wrong-password-123" },
      });

      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.deepEqual(wrongPassword.body, unknownEmail.body);
    });

    it("rejects malformed input with 400", async () => {
      const badEmail = await api("POST", "/auth/login", {
        body: { email: "not-an-email", password: "x" },
      });
      const noPassword = await api("POST", "/auth/login", {
        body: { email: uniqueEmail() },
      });

      assert.equal(badEmail.status, 400);
      assert.equal(noPassword.status, 400);
    });
  });

  describe("GET /auth/me (the authenticate middleware)", () => {
    let email: string;
    let token: string;

    before(async () => {
      email = await createUser();
      token = await loginToken(email);
    });

    it("returns the current user for a valid token", async () => {
      const { status, body } = await api("GET", "/auth/me", { token });

      assert.equal(status, 200);
      assert.equal(body.user.email, email);
    });

    it("rejects a missing or malformed Authorization header", async () => {
      const missing = await api("GET", "/auth/me");
      const wrongScheme = await api("GET", "/auth/me", {
        headers: { Authorization: `Token ${token}` },
      });
      const noToken = await api("GET", "/auth/me", {
        headers: { Authorization: "Bearer" },
      });

      for (const response of [missing, wrongScheme, noToken]) {
        assert.equal(response.status, 401);
        assert.equal(response.body.message, "Authentication required.");
      }
    });

    it("rejects a tampered or garbage token", async () => {
      for (const bad of [`${token}x`, "not.a.token"]) {
        const { status, body } = await api("GET", "/auth/me", { token: bad });
        assert.equal(status, 401);
        assert.equal(body.message, "Invalid token.");
      }
    });

    it("rejects an expired token with its own message", async () => {
      const user = await getUser(email);
      const expired = await craftToken({
        sub: String(user.id),
        exp: nowSeconds() - 60,
      });
      const { status, body } = await api("GET", "/auth/me", { token: expired });

      assert.equal(status, 401);
      assert.equal(body.message, "Token expired. Please log in again.");
    });

    it("rejects a validly signed token that has no expiry", async () => {
      const user = await getUser(email);
      const forever = await craftToken({ sub: String(user.id), exp: null });
      const { status, body } = await api("GET", "/auth/me", { token: forever });

      assert.equal(status, 401);
      assert.equal(body.message, "Invalid token.");
    });

    it("rejects a valid token whose account was deleted", async () => {
      const ghost = await createUser();
      const ghostToken = await loginToken(ghost);
      await db.delete(users).where(eq(users.email, ghost));

      const { status, body } = await api("GET", "/auth/me", {
        token: ghostToken,
      });

      assert.equal(status, 401);
      assert.equal(body.message, "Account no longer exists.");
    });
  });

  describe("role-based access to books", () => {
    let customerEmail: string;
    let customerToken: string;
    let adminToken: string;

    before(async () => {
      customerEmail = await createUser("customer");
      customerToken = await loginToken(customerEmail);
      adminToken = await loginToken(await createUser("admin"));
    });

    it("keeps browsing public", async () => {
      assert.equal((await api("GET", "/books")).status, 200);
    });

    it("rejects an anonymous request with 401", async () => {
      assert.equal((await api("POST", "/books", { body: BOOK })).status, 401);
    });

    it("rejects a customer with 403, even when the body is invalid", async () => {
      const valid = await api("POST", "/books", {
        body: BOOK,
        token: customerToken,
      });
      const invalid = await api("POST", "/books", {
        body: {},
        token: customerToken,
      });

      assert.equal(valid.status, 403);
      assert.equal(invalid.status, 403);
    });

    it("lets an admin create a book", async () => {
      const { status, body } = await api("POST", "/books", {
        body: BOOK,
        token: adminToken,
      });

      assert.equal(status, 201);
      assert.equal(typeof body.bookId, "number");
    });

    it("ignores an admin role claimed inside a token", async () => {
      const customer = await getUser(customerEmail);
      const forged = await craftToken({
        sub: String(customer.id),
        role: "admin",
        exp: nowSeconds() + 300,
      });
      const { status } = await api("POST", "/books", {
        body: BOOK,
        token: forged,
      });

      assert.equal(status, 403);
    });

    it("stops honouring an admin's old token after a demotion", async () => {
      const adminEmail = await createUser("admin");
      const token = await loginToken(adminEmail);
      assert.equal(
        (await api("POST", "/books", { body: BOOK, token })).status,
        201,
      );

      await db
        .update(users)
        .set({ role: "customer" })
        .where(eq(users.email, adminEmail));

      assert.equal(
        (await api("POST", "/books", { body: BOOK, token })).status,
        403,
      );
    });
  });
});
