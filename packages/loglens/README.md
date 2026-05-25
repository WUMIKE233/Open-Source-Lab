# @osl/loglens

`loglens` turns raw log lines into structured events, summaries, and anomaly signals.

```js
import { parseLogLine, summarizeLogs, detectMetricAnomalies } from "@osl/loglens";

const events = [
  parseLogLine("2026-05-25T10:00:00Z INFO service=api latency=42 ready"),
  parseLogLine("2026-05-25T10:01:00Z ERROR service=api latency=980 timeout")
];

console.log(summarizeLogs(events));
console.log(detectMetricAnomalies(events, { metric: "latency" }));
```

## CLI

```bash
cat app.log | loglens --metric latency
```

The CLI reads newline-delimited logs from stdin and prints JSON.
