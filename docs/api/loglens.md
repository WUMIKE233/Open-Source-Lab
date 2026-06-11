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

## `summarizeErrorBudget(events, options?)`

Computes a small reliability/error-budget summary from parsed log events.

Options:

- `targetReliability`: desired reliability as a decimal, default `0.99`
- `errorLevels`: log levels that count as errors, default `["error", "fatal"]`

Returns total events, observed errors, allowed errors, remaining budget, burn percentage, `status`, `breached`, and service-level error rates plus per-service allowed/remaining errors.

## `collectStdin(stream)`

Reads newline-delimited logs from a stream and returns parsed events.
