import { createWorkflow } from "../../packages/event-forge/src/index.js";

const workflow = createWorkflow()
  .task("extract", async () => {
    return ["checkout", "search", "profile"];
  })
  .task(
    "transform",
    async ({ results }) => {
      return results.extract.map((name) => ({ name, slug: name.toUpperCase() }));
    },
    { needs: ["extract"], retries: 1 }
  )
  .task(
    "load",
    async ({ results }) => {
      return {
        stored: results.transform.length,
        records: results.transform
      };
    },
    { needs: ["transform"], timeoutMs: 500 }
  );

const result = await workflow.run({
  hooks: {
    onTaskStart: ({ taskId }) => console.log(`starting ${taskId}`),
    onTaskSuccess: ({ taskId }) => console.log(`finished ${taskId}`)
  }
});

console.log(JSON.stringify(result.results.load, null, 2));
