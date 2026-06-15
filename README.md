# httpYac Buddy

A VS Code extension that generates [httpYac](https://httpyac.github.io/) `.http` files from Spring controller methods via CodeLens.

## Features (MVP)

Above every Spring `@*Mapping` method in a Java file, two CodeLens actions appear:

- **Generate HTTP Request** — Creates or appends to `src/main/resources/{ControllerName}.http` with a ready-to-send request block. Path variables, query parameters and request body DTO fields are pre-filled with type-based default values.
- **Open HTTP Request** — Jumps to the corresponding `###` block in the `.http` file. If multiple blocks exist for the same method (e.g. after repeated generations), a QuickPick lets you choose.

## Quick start

```bash
npm install
npm run build
```

Press **F5** in VS Code to launch the Extension Development Host. Open a Spring project, open any `@RestController`, and use the CodeLens buttons above each mapping method.

## Output convention

- Output file: `src/main/resources/{ControllerName}.http`
- One file per controller, methods separated by `###`
- Repeat generations append new blocks named `methodName_2`, `methodName_3`, …
- Base URL: hardcoded `http://localhost:8080` (env management is intentionally out of scope for the MVP)

## DTO default values

| Java type | Default |
|---|---|
| `String` | `""` |
| `int`, `long`, `BigDecimal`, … | `0` |
| `double`, `float` | `0.0` |
| `boolean` | `false` |
| `LocalDate` | `"2026-01-01"` |
| `LocalDateTime` / `Date` / `Instant` | `"2026-01-01T00:00:00"` |
| `List<X>` / `Set<X>` | `[<default of X>]` |
| `Map<K,V>` / array | `{}` / `[]` |
| Custom DTO | recursively expanded |

## Out of scope (intentional)

HTTP execution, OpenAPI/Swagger integration, controller ↔ http navigation, AI mock data, environment management. These may land in future versions.
