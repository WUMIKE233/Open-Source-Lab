import { createWorkflow } from "../packages/event-forge/src/index.js";
import { evaluateFlag } from "../packages/flagship/src/index.js";
import { summarizeLogs } from "../packages/loglens/src/index.js";

const workflow = createWorkflow()
  .task("build", async () => "ok")
  .task("ship", async ({ results }) => `ship:${results.build}`, { needs: ["build"] });

const workflowResult = await workflow.run();
const flagResult = evaluateFlag(
  {
    key: "welcome-copy",
    enabled: true,
    variants: [
      { key: "control", weight: 50, value: "Hello" },
      { key: "treatment", weight: 50, value: "Welcome back" }
    ]
  },
  { identity: "demo-user" }
);
const logResult = summarizeLogs([
  { level: "info", message: "ready" },
  { level: "error", message: "timeout" }
]);

if (workflowResult.results.ship !== "ship:ok") {
  throw new Error("event-forge smoke check failed");
}

if (!flagResult.variant) {
  throw new Error("flagship smoke check failed");
}

if (logResult.total !== 2 || logResult.byLevel.error !== 1) {
  throw new Error("loglens smoke check failed");
}

console.log("Smoke check passed.");
