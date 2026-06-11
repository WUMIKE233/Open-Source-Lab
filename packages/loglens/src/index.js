export class LoglensError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "LoglensError";
    this.details = details;
  }
}

const ISO_PREFIX = /^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+([A-Z]+)\s*(.*)$/;
const LEVELS = new Set(["TRACE", "DEBUG", "INFO", "WARN", "WARNING", "ERROR", "FATAL"]);

export function parseLogLine(line) {
  if (typeof line !== "string") {
    throw new LoglensError("Log line must be a string.");
  }

  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const jsonEvent = parseJsonLog(trimmed);
  if (jsonEvent) return normalizeEvent(jsonEvent, line);

  const isoMatch = trimmed.match(ISO_PREFIX);
  if (isoMatch) {
    const fields = parseKeyValueFields(isoMatch[3]);
    return normalizeEvent(
      {
        timestamp: isoMatch[1],
        level: isoMatch[2].toLowerCase(),
        message: removeKeyValueFields(isoMatch[3]),
        fields
      },
      line
    );
  }

  const fields = parseKeyValueFields(trimmed);
  const level = findLevel(trimmed);
  return normalizeEvent(
    {
      level: level?.toLowerCase() ?? "unknown",
      message: removeLogLevel(removeKeyValueFields(trimmed), level),
      fields
    },
    line
  );
}

export function summarizeLogs(events) {
  const normalized = events.filter(Boolean).map((event) => normalizeEvent(event));
  const byLevel = {};
  const byService = {};
  const messages = new Map();
  let firstTimestamp = null;
  let lastTimestamp = null;

  for (const event of normalized) {
    byLevel[event.level] = (byLevel[event.level] ?? 0) + 1;
    if (event.fields.service) {
      byService[event.fields.service] = (byService[event.fields.service] ?? 0) + 1;
    }
    messages.set(event.message, (messages.get(event.message) ?? 0) + 1);

    if (event.timestamp) {
      firstTimestamp = minTimestamp(firstTimestamp, event.timestamp);
      lastTimestamp = maxTimestamp(lastTimestamp, event.timestamp);
    }
  }

  return {
    total: normalized.length,
    byLevel,
    byService,
    firstTimestamp,
    lastTimestamp,
    topMessages: [...messages.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }))
  };
}

export function detectMetricAnomalies(events, options = {}) {
  const metric = options.metric ?? "latency";
  const threshold = Number(options.zScore ?? 2.5);
  const values = events
    .filter(Boolean)
    .map((event, index) => ({ event: normalizeEvent(event), index }))
    .map(({ event, index }) => ({ event, index, value: Number(event.fields[metric]) }))
    .filter((item) => Number.isFinite(item.value));

  if (values.length < 3) {
    return [];
  }

  const mean = values.reduce((sum, item) => sum + item.value, 0) / values.length;
  const variance = values.reduce((sum, item) => sum + (item.value - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) {
    return [];
  }

  return values
    .map((item) => ({
      index: item.index,
      metric,
      value: item.value,
      zScore: Number(((item.value - mean) / stddev).toFixed(3)),
      message: item.event.message,
      timestamp: item.event.timestamp
    }))
    .filter((item) => Math.abs(item.zScore) >= threshold);
}

export function summarizeErrorBudget(events, options = {}) {
  const targetReliability = Number(options.targetReliability ?? 0.99);
  const errorLevels = new Set((options.errorLevels ?? ["error", "fatal"]).map((level) => String(level).toLowerCase()));
  const normalized = events.filter(Boolean).map((event) => normalizeEvent(event));
  const byService = new Map();
  let observedErrors = 0;

  for (const event of normalized) {
    const service = event.fields.service ?? "unknown";
    const item = byService.get(service) ?? { service, total: 0, errors: 0 };
    const isError = errorLevels.has(event.level);
    item.total += 1;
    if (isError) {
      item.errors += 1;
      observedErrors += 1;
    }
    byService.set(service, item);
  }

  const total = normalized.length;
  const allowedErrorRate = Math.max(0, Math.min(1, 1 - targetReliability));
  const allowedErrors = Math.floor(total * allowedErrorRate);
  const remainingErrors = allowedErrors - observedErrors;
  const breached = observedErrors > allowedErrors;

  return {
    targetReliability,
    total,
    observedErrors,
    allowedErrors,
    remainingErrors,
    breached,
    status: breached ? "breached" : remainingErrors === 0 ? "exhausted" : "available",
    burnedPercent: allowedErrors === 0
      ? (observedErrors > 0 ? 100 : 0)
      : Number(((observedErrors / allowedErrors) * 100).toFixed(2)),
    byService: [...byService.values()]
      .map((item) => ({
        ...item,
        errorRate: item.total === 0 ? 0 : Number((item.errors / item.total).toFixed(4)),
        allowedErrors: Math.floor(item.total * allowedErrorRate),
        remainingErrors: Math.floor(item.total * allowedErrorRate) - item.errors
      }))
      .sort((a, b) => b.errors - a.errors || b.total - a.total)
  };
}

export async function collectStdin(stream) {
  let data = "";
  for await (const chunk of stream) {
    data += chunk;
  }
  return data
    .split(/\r?\n/)
    .map(parseLogLine)
    .filter(Boolean);
}

function parseJsonLog(line) {
  if (!line.startsWith("{")) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizeEvent(event, raw = event.raw) {
  const fields = { ...(event.fields ?? {}) };
  for (const [key, value] of Object.entries(event)) {
    if (!["timestamp", "time", "level", "severity", "message", "msg", "fields", "raw"].includes(key)) {
      fields[key] = value;
    }
  }

  return {
    timestamp: event.timestamp ?? event.time ?? null,
    level: String(event.level ?? event.severity ?? "unknown").toLowerCase(),
    message: String(event.message ?? event.msg ?? ""),
    fields: coerceFieldValues(fields),
    raw
  };
}

function parseKeyValueFields(text) {
  const fields = {};
  const pattern = /([A-Za-z_][\w.-]*)=("[^"]*"|'[^']*'|[^\s]+)/g;
  let match;
  while ((match = pattern.exec(text))) {
    fields[match[1]] = stripQuotes(match[2]);
  }
  return coerceFieldValues(fields);
}

function removeKeyValueFields(text) {
  return text.replace(/([A-Za-z_][\w.-]*)=("[^"]*"|'[^']*'|[^\s]+)/g, "").replace(/\s+/g, " ").trim();
}

function findLevel(text) {
  const tokens = text.toUpperCase().split(/\W+/);
  return tokens.find((token) => LEVELS.has(token));
}

function removeLogLevel(text, level) {
  if (!level) return text;
  return text.replace(new RegExp(`\\b${level}\\b`, "i"), "").replace(/\s+/g, " ").trim();
}

function coerceFieldValues(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (typeof value !== "string") return [key, value];
      if (/^-?\d+(\.\d+)?$/.test(value)) return [key, Number(value)];
      if (value === "true") return [key, true];
      if (value === "false") return [key, false];
      return [key, value];
    })
  );
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function minTimestamp(current, candidate) {
  if (!current) return candidate;
  return new Date(candidate) < new Date(current) ? candidate : current;
}

function maxTimestamp(current, candidate) {
  if (!current) return candidate;
  return new Date(candidate) > new Date(current) ? candidate : current;
}
