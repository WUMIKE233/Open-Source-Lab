# @osl/flagship API

`flagship` evaluates feature flags with structured decision reasons.

## `evaluateFlag(flag, context?)`

Returns a decision:

```js
{
  flagKey: "new-dashboard",
  enabled: true,
  variant: "enabled",
  value: true,
  reason: "fallthrough"
}
```

## Flag Shape

```js
{
  key: "new-dashboard",
  enabled: true,
  rules: [],
  rollout: { percentage: 25, salt: "2026-q2" },
  defaultVariant: "disabled",
  variants: [
    { key: "disabled", weight: 75, value: false },
    { key: "enabled", weight: 25, value: true }
  ]
}
```

## Rule Operators

Supported operators:

- `eq`, `neq`
- `in`, `contains`
- `gt`, `gte`, `lt`, `lte`
- `regex`
- `exists`

Rules can be combined with `all`, `any`, and `not`.
