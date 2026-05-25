export class FlagshipError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "FlagshipError";
    this.details = details;
  }
}

export function evaluateFlag(flag, context = {}) {
  validateFlag(flag);

  if (!flag.enabled) {
    return decision(flag, null, "disabled");
  }

  for (const rule of flag.rules ?? []) {
    if (matchesRule(rule.if, context.attributes ?? {})) {
      return decision(flag, selectServedVariant(flag, rule.serve, context), `rule:${rule.name ?? "unnamed"}`);
    }
  }

  if (flag.rollout) {
    const bucket = bucketIdentity(flag.key, context.identity ?? "anonymous", flag.rollout.salt);
    if (bucket > flag.rollout.percentage) {
      return decision(flag, getVariant(flag, flag.defaultVariant), "rollout:excluded");
    }
  }

  return decision(flag, selectWeightedVariant(flag, context), "fallthrough");
}

export function matchesRule(rule, attributes = {}) {
  if (!rule) return true;
  if (Array.isArray(rule.all)) {
    return rule.all.every((condition) => matchesRule(condition, attributes));
  }
  if (Array.isArray(rule.any)) {
    return rule.any.some((condition) => matchesRule(condition, attributes));
  }
  if (rule.not) {
    return !matchesRule(rule.not, attributes);
  }

  return matchesCondition(rule, attributes);
}

export function bucketIdentity(flagKey, identity, salt = "") {
  const hash = fnv1a(`${flagKey}:${identity}:${salt}`);
  return (hash % 10000) / 100;
}

export function selectWeightedVariant(flag, context = {}) {
  const variants = flag.variants ?? [];
  if (variants.length === 0) return null;

  const total = variants.reduce((sum, variant) => sum + Number(variant.weight ?? 0), 0);
  if (total <= 0) {
    return variants[0];
  }

  const bucket = bucketIdentity(flag.key, context.identity ?? "anonymous", flag.salt);
  let cursor = 0;
  for (const variant of variants) {
    cursor += (Number(variant.weight ?? 0) / total) * 100;
    if (bucket < cursor) {
      return variant;
    }
  }
  return variants.at(-1);
}

export function validateFlag(flag) {
  if (!flag || typeof flag !== "object") {
    throw new FlagshipError("Flag must be an object.");
  }
  if (!flag.key || typeof flag.key !== "string") {
    throw new FlagshipError("Flag key must be a non-empty string.");
  }
  if (flag.variants && !Array.isArray(flag.variants)) {
    throw new FlagshipError(`Flag "${flag.key}" variants must be an array.`);
  }
  const keys = new Set();
  for (const variant of flag.variants ?? []) {
    if (!variant.key) {
      throw new FlagshipError(`Flag "${flag.key}" has a variant without a key.`);
    }
    if (keys.has(variant.key)) {
      throw new FlagshipError(`Flag "${flag.key}" has duplicate variant "${variant.key}".`);
    }
    keys.add(variant.key);
  }
  for (const rule of flag.rules ?? []) {
    if (rule.serve && !keys.has(rule.serve)) {
      throw new FlagshipError(`Rule "${rule.name ?? "unnamed"}" serves unknown variant "${rule.serve}".`);
    }
  }
}

function matchesCondition(condition, attributes) {
  const actual = attributes[condition.attribute];
  const expected = condition.value;

  switch (condition.op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "contains":
      return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? "").includes(String(expected));
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "regex":
      return new RegExp(expected).test(String(actual ?? ""));
    case "exists":
      return condition.attribute in attributes === Boolean(expected ?? true);
    default:
      throw new FlagshipError(`Unsupported rule operator "${condition.op}".`);
  }
}

function selectServedVariant(flag, serve, context) {
  if (!serve) {
    return selectWeightedVariant(flag, context);
  }
  return getVariant(flag, serve);
}

function getVariant(flag, key) {
  if (!key) return null;
  return (flag.variants ?? []).find((variant) => variant.key === key) ?? null;
}

function decision(flag, variant, reason) {
  return {
    flagKey: flag.key,
    enabled: Boolean(flag.enabled),
    variant: variant?.key ?? null,
    value: variant?.value ?? null,
    reason
  };
}

function fnv1a(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
