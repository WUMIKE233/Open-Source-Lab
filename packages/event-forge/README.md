# @osl/event-forge

`event-forge` runs dependency-aware workflow graphs without external services.

```js
import { createWorkflow } from "@osl/event-forge";

const workflow = createWorkflow()
  .task("fetch", async () => ({ count: 3 }))
  .task("report", async ({ results }) => results.fetch.count, {
    needs: ["fetch"],
    retries: 2,
    timeoutMs: 500
  });

const run = await workflow.run({ concurrency: 4 });
console.log(run.results.report);
```

## Features

- DAG validation with clear configuration errors
- retry and timeout support per task
- cooperative cancellation through `AbortSignal`
- lifecycle hooks for metrics and observability
- deterministic task results keyed by task id
