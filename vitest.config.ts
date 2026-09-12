import { defineConfig } from "vitest/config";

// Lightweight frontend test setup: pure-logic unit tests for the interview
// helpers. Tests never touch the network or an LLM.
export default defineConfig({
  test: {
    include: ["tests/frontend/**/*.test.ts"],
    environment: "node",
  },
});
