import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CyclicDependencyError,
  TaskTimeoutError,
  WorkflowError,
  createWorkflow,
  validateGraph
} from "../src/index.js";

test("runs tasks after their dependencies complete", async () => {
  const workflow = createWorkflow()
    .task("extract", async () => 2)
    .task("transform", async ({ results }) => results.extract * 3, { needs: ["extract"] })
    .task("load", async ({ results }) => results.transform + 1, { needs: ["transform"] });

  const run = await workflow.run();

  assert.equal(run.results.load, 7);
  assert.equal(run.taskCount, 3);
});

test("retries failed tasks", async () => {
  let attempts = 0;
  const workflow = createWorkflow().task(
    "unstable",
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("not yet");
      return "ready";
    },
    { retries: 2, backoffMs: 1 }
  );

  const run = await workflow.run();

  assert.equal(run.results.unstable, "ready");
  assert.equal(attempts, 3);
});

test("reports missing dependencies and cycles", () => {
  assert.throws(
    () => validateGraph([{ id: "a", needs: ["missing"], run: async () => null }]),
    WorkflowError
  );

  assert.throws(
    () =>
      validateGraph([
        { id: "a", needs: ["b"], run: async () => null },
        { id: "b", needs: ["a"], run: async () => null }
      ]),
    CyclicDependencyError
  );
});

test("enforces task timeouts", async () => {
  const workflow = createWorkflow().task(
    "slow",
    async () => new Promise((resolve) => setTimeout(resolve, 30)),
    { timeoutMs: 1 }
  );

  await assert.rejects(
    workflow.run(),
    (error) => error.name === "WorkflowError" && error.cause?.name === "TaskTimeoutError"
  );
  await assert.rejects(
    async () => {
      throw new TaskTimeoutError("slow", 1);
    },
    { name: "TaskTimeoutError" }
  );
});
