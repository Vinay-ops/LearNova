import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// Lightweight frontend test setup: pure-logic unit tests for the interview
// helpers, plus component tests for the Markdown renderer (those files opt in
// to jsdom with a `@vitest-environment jsdom` docblock). Tests never touch the
// network or an LLM.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/frontend/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
