import { detectMetricAnomalies, parseLogLine, summarizeLogs } from "../../packages/loglens/src/index.js";

const lines = [
  "2026-05-25T10:00:00Z INFO service=api latency=42 request complete",
  "2026-05-25T10:01:00Z INFO service=api latency=45 request complete",
  "2026-05-25T10:02:00Z WARN service=api latency=81 slow request",
  "2026-05-25T10:03:00Z ERROR service=api latency=980 upstream timeout"
];

const events = lines.map(parseLogLine);

console.log("summary");
console.log(JSON.stringify(summarizeLogs(events), null, 2));

console.log("anomalies");
console.log(JSON.stringify(detectMetricAnomalies(events, { metric: "latency", zScore: 1.4 }), null, 2));
