# @osl/event-forge API

`event-forge` runs directed acyclic task graphs.

## `createWorkflow(initialTasks?)`

Creates a fluent workflow builder.

```js
const workflow = createWorkflow()
  .task("a", async () => 1)
  .task("b", async ({ results }) => results.a + 1, { needs: ["a"] });
```

## `workflow.task(id, run, options?)`

Registers a task.

Options:

- `needs`: task ids that must complete first
- `retries`: number of retry attempts
- `timeoutMs`: task timeout in milliseconds
- `backoffMs`: retry backoff base in milliseconds

## `workflow.run(options?)`

Runs the workflow and returns:

```js
{
  results: { taskId: value },
  taskCount: 2,
  durationMs: 10
}
```

Options:

- `concurrency`: maximum number of parallel tasks
- `signal`: `AbortSignal` for cooperative cancellation
- `hooks`: lifecycle callbacks such as `onTaskStart`, `onTaskSuccess`, `onTaskFailure`, and `onWorkflowComplete`
