# @osl/loglens

`loglens` turns raw log lines into structured events, summaries, and anomaly signals.

```js
import { parseLogLine, summarizeLogs, detectMetricAnomalies, summarizeErrorBudget } from "@osl/loglens";

const events = [
  parseLogLine("2026-05-25T10:00:00Z INFO service=api latency=42 ready"),
  parseLogLine("2026-05-25T10:01:00Z ERROR service=api latency=980 timeout")
];

console.log(summarizeLogs(events));
console.log(detectMetricAnomalies(events, { metric: "latency" }));
console.log(summarizeErrorBudget(events, { targetReliability: 0.99 }));
```

## CLI

```bash
cat app.log | loglens --metric latency
```

The CLI reads newline-delimited logs from stdin and prints JSON.

`errorBudget.status` is `available`, `exhausted`, or `breached`, so CI jobs and dashboards can react without recalculating the budget.

## More

- API reference: [`docs/api/loglens.md`](../../docs/api/loglens.md)
- Runnable example: [`examples/loglens/analyze-logs.js`](../../examples/loglens/analyze-logs.js)
