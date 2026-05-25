# @osl/flagship

`flagship` evaluates feature flags with predictable reasons and stable weighted rollouts.

```js
import { evaluateFlag } from "@osl/flagship";

const result = evaluateFlag(
  {
    key: "checkout-redesign",
    enabled: true,
    rules: [
      {
        name: "beta customers",
        if: { all: [{ attribute: "plan", op: "eq", value: "beta" }] },
        serve: "on"
      }
    ],
    variants: [
      { key: "off", weight: 80, value: false },
      { key: "on", weight: 20, value: true }
    ]
  },
  { identity: "user-123", attributes: { plan: "beta" } }
);

console.log(result.value, result.reason);
```

## Rule Operators

`eq`, `neq`, `in`, `contains`, `gt`, `gte`, `lt`, `lte`, `regex`, and `exists` are supported.

## More

- API reference: [`docs/api/flagship.md`](../../docs/api/flagship.md)
- Runnable example: [`examples/flagship/rollout.js`](../../examples/flagship/rollout.js)
