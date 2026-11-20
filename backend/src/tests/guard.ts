import { env } from "../config/env.js";

// Tests create and delete data, so they must never run against a real database.
// This file is imported first, so the check runs before anything can touch MySQL.
if (!env.DB_NAME.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests: database "${env.DB_NAME}" does not end with "_test".`,
  );
}