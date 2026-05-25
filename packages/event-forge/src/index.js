export class WorkflowError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "WorkflowError";
    this.details = details;
    if (details.cause) {
      this.cause = details.cause;
    }
  }
}

export class TaskTimeoutError extends WorkflowError {
  constructor(taskId, timeoutMs) {
    super(`Task "${taskId}" exceeded timeout of ${timeoutMs}ms.`, { taskId, timeoutMs });
    this.name = "TaskTimeoutError";
  }
}

export class CyclicDependencyError extends WorkflowError {
  constructor(cycle) {
    super(`Workflow contains a dependency cycle: ${cycle.join(" -> ")}.`, { cycle });
    this.name = "CyclicDependencyError";
  }
}

export function createWorkflow(initialTasks = []) {
  const tasks = new Map();

  for (const task of initialTasks) {
    addTask(tasks, task.id, task.run, task);
  }

  const api = {
    task(id, run, options = {}) {
      addTask(tasks, id, run, options);
      return api;
    },
    definition() {
      return [...tasks.values()].map((task) => ({ ...task, run: task.run }));
    },
    async run(options = {}) {
      return runWorkflow([...tasks.values()], options);
    }
  };

  return api;
}

export async function runWorkflow(tasks, options = {}) {
  const taskMap = normalizeTasks(tasks);
  const ordered = validateGraph(taskMap);
  const concurrency = normalizeConcurrency(options.concurrency);
  const hooks = options.hooks ?? {};
  const startedAt = Date.now();
  const results = {};
  const attempts = {};
  const pending = new Set(ordered);
  const running = new Map();
  const completed = new Set();

  throwIfAborted(options.signal);

  while (pending.size > 0 || running.size > 0) {
    throwIfAborted(options.signal);

    const available = [...pending].filter((id) =>
      taskMap.get(id).needs.every((dependency) => completed.has(dependency))
    );

    while (available.length > 0 && running.size < concurrency) {
      const taskId = available.shift();
      pending.delete(taskId);
      const task = taskMap.get(taskId);
      attempts[taskId] = 0;
      hooks.onTaskStart?.({ taskId, needs: task.needs });
      running.set(
        taskId,
        executeTask(task, { results, signal: options.signal }).then(
          (value) => ({ taskId, status: "fulfilled", value }),
          (error) => ({ taskId, status: "rejected", error })
        )
      );
    }

    if (running.size === 0) {
      throw new WorkflowError("Workflow stalled before all tasks could run.", {
        pending: [...pending]
      });
    }

    const settled = await Promise.race(running.values());
    running.delete(settled.taskId);

    if (settled.status === "rejected") {
      hooks.onTaskFailure?.({ taskId: settled.taskId, error: settled.error });
      throw new WorkflowError(`Task "${settled.taskId}" failed.`, {
        taskId: settled.taskId,
        cause: settled.error
      });
    }

    results[settled.taskId] = settled.value;
    completed.add(settled.taskId);
    hooks.onTaskSuccess?.({ taskId: settled.taskId, value: settled.value });
  }

  const summary = {
    results,
    taskCount: ordered.length,
    durationMs: Date.now() - startedAt
  };
  hooks.onWorkflowComplete?.(summary);
  return summary;
}

export function validateGraph(tasks) {
  const taskMap = tasks instanceof Map ? tasks : normalizeTasks(tasks);

  for (const task of taskMap.values()) {
    for (const dependency of task.needs) {
      if (!taskMap.has(dependency)) {
        throw new WorkflowError(`Task "${task.id}" depends on missing task "${dependency}".`, {
          taskId: task.id,
          dependency
        });
      }
    }
  }

  const visited = new Set();
  const visiting = new Set();
  const ordered = [];

  function visit(taskId, stack) {
    if (visited.has(taskId)) return;
    if (visiting.has(taskId)) {
      const start = stack.indexOf(taskId);
      throw new CyclicDependencyError([...stack.slice(start), taskId]);
    }

    visiting.add(taskId);
    const task = taskMap.get(taskId);
    for (const dependency of task.needs) {
      visit(dependency, [...stack, taskId]);
    }
    visiting.delete(taskId);
    visited.add(taskId);
    ordered.push(taskId);
  }

  for (const taskId of taskMap.keys()) {
    visit(taskId, []);
  }

  return ordered;
}

function addTask(tasks, id, run, options = {}) {
  if (!id || typeof id !== "string") {
    throw new WorkflowError("Task id must be a non-empty string.");
  }
  if (tasks.has(id)) {
    throw new WorkflowError(`Task "${id}" is already registered.`, { taskId: id });
  }
  if (typeof run !== "function") {
    throw new WorkflowError(`Task "${id}" must provide a run function.`, { taskId: id });
  }

  tasks.set(id, {
    id,
    run,
    needs: [...(options.needs ?? [])],
    retries: Math.max(0, Number(options.retries ?? 0)),
    timeoutMs: options.timeoutMs ?? 0,
    backoffMs: options.backoffMs ?? 25
  });
}

function normalizeTasks(tasks) {
  const taskMap = new Map();
  for (const task of tasks) {
    addTask(taskMap, task.id, task.run, task);
  }
  return taskMap;
}

function normalizeConcurrency(value) {
  if (value === undefined || value === null) return Number.POSITIVE_INFINITY;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new WorkflowError("Concurrency must be a positive integer.");
  }
  return number;
}

async function executeTask(task, context) {
  let lastError;

  for (let attempt = 1; attempt <= task.retries + 1; attempt += 1) {
    throwIfAborted(context.signal);
    try {
      return await withTimeout(
        task.run({
          taskId: task.id,
          attempt,
          results: Object.freeze({ ...context.results }),
          signal: context.signal
        }),
        task.id,
        task.timeoutMs
      );
    } catch (error) {
      lastError = error;
      if (attempt <= task.retries) {
        await sleep(task.backoffMs * attempt, context.signal);
      }
    }
  }

  throw lastError;
}

function withTimeout(promise, taskId, timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) {
    return Promise.resolve(promise);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TaskTimeoutError(taskId, timeoutMs)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function sleep(ms, signal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason ?? new Error("Operation aborted."));
        },
        { once: true }
      );
    }
  });
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new Error("Operation aborted.");
  }
}
