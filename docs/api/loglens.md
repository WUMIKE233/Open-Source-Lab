# @osl/loglens API

`loglens` parses logs into structured events and computes summaries.

## `parseLogLine(line)`

Supports JSON logs, ISO-prefixed logs, and plain key-value logs.

```js
parseLogLine("2026-05-25T10:00:00Z INFO service=api latency=42 ready");
```

Returns:

```js
{
  timestamp: "2026-05-25T10:00:00Z",
  level: "info",
  message: "ready",
  fields: { service: "api", latency: 42 },
  raw: "..."
}
```

## `summarizeLogs(events)`

Returns counts by level, counts by service, timestamp range, and top messages.

## `detectMetricAnomalies(events, options?)`

Finds metric outliers using z-score analysis.

Options:

- `metric`: field name to inspect, default `latency`
- `zScore`: anomaly threshold, default `2.5`

## `collectStdin(stream)`

Reads newline-delimited logs from a stream and returns parsed events.
