# Spring HTTP Buddy

A VS Code extension that generates `.http` request files from Spring controller methods via CodeLens.

The generated files use standard `.http` syntax, so they run as-is in [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client), [httpYac](https://httpyac.github.io/), and the IntelliJ HTTP Client.

## Features (MVP)

Above every Spring `@*Mapping` method in a Java file, two CodeLens actions appear:

- **Generate HTTP Request** — Creates or appends to `src/main/resources/{ControllerName}.http` with a ready-to-send request block. Path variables, query parameters and request body DTO fields are pre-filled with type-based default values.
- **Open HTTP Request** — Jumps to the corresponding `###` block in the `.http` file. If multiple blocks exist for the same method or HTTP verb, a QuickPick lets you choose.
- **Open Java Controller** — From a `###` block in a generated `.http` file, jumps back to the matching Java controller method.
- **Copy AI Parameter Prompt** — From a `###` block, copies a prompt containing the current request block and Java controller method so an AI assistant can replace placeholders with realistic sample values.

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
- If one Java method maps to multiple HTTP verbs, blocks are named `methodName_GET`, `methodName_POST`, etc.
- Unannotated complex parameters and `@ModelAttribute` are expanded from DTO fields; `@RequestBody` generates a JSON body.
- Base URL: auto-detects `server.port` from Spring `application.properties`, `application.yml`, or `application.yaml`; `springHttpBuddy.baseUrl` can override it, and the fallback is `http://localhost:8080`

## DTO default values

| Java type | Default |
|---|---|
| `String` | field or parameter name, e.g. `"username"` |
| `int`, `long`, `BigDecimal`, … | `0` |
| `double`, `float` | `0.0` |
| `boolean` | `false` |
| `LocalDate` | `"2026-01-01"` |
| `LocalDateTime` / `Date` / `Instant` | `"2026-01-01T00:00:00"` |
| `List<X>` / `Set<X>` | `[<default of X>]` |
| `Map<K,V>` / array | `{}` / `[]` |
| Custom DTO | recursively expanded |

## Out of scope (intentional)

HTTP execution, OpenAPI/Swagger integration, direct AI API calls, environment management. These may land in future versions.

## License

MIT
