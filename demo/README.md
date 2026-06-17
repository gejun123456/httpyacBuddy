# Spring HTTP Buddy — Demo Project

A small Spring Boot project for exercising every feature of the **Spring HTTP Buddy** extension.

## How to test

1. In the extension repo, press **F5** to launch the Extension Development Host.
2. In that window, open this `demo/` folder (`File → Open Folder…`).
3. Open any controller under `src/main/java/com/example/demo/controller/`.
4. Click the **Generate HTTP Request** CodeLens above any `@*Mapping` method.
5. Generated `.http` files land in `src/main/resources/{ControllerName}.http`.
6. Try **Open HTTP Request**, **Open Java Controller**, and **Copy AI Parameter Prompt** from the generated blocks.

> Base URL is auto-detected from `src/main/resources/application.yml` (`server.port: 9090`),
> so generated requests target `http://localhost:9090`.

## Feature coverage map

| Endpoint | Feature exercised |
|---|---|
| `GET /api/users/{id}` | `@PathVariable` (id-like → `1`) + `@RequestHeader` |
| `GET /api/users` | `@ModelAttribute` → flattened query params |
| `GET /api/users/search` | `@RequestParam` scalar / `defaultValue` / `required=false` |
| `POST /api/users` | rich `@RequestBody`: nested DTO, `List<String>`, `List<DTO>`, `Map`, `LocalDate`, `BigDecimal` |
| `PUT /api/users/{id}` | path variable + `@RequestBody` |
| `DELETE /api/users/{id}` | DELETE verb |
| `PATCH /api/users/{id}/status` | PATCH verb + path variable + query param |
| `POST /api/orders` | `List<OrderItem>` + `Map` body; `HttpServletRequest` auto-skipped |
| `GET /api/orders/{orderId}/items/{itemId}` | multiple path variables |
| `… /api/orders/sync` | one `@RequestMapping` → both GET & POST (`sync_GET` / `sync_POST`) |
| `GET /api/products/search` | `@ModelAttribute` with nested object + list (`page.number`, `tags[0]`) |
| `GET /api/products/advanced-search` | unannotated complex param expanded as query |
| `POST /api/products/{sku}/image` | `MultipartFile` auto-skipped |

## Run it for real (optional)

```bash
cd demo
mvn spring-boot:run
```

Requires JDK 17+ and Maven. The endpoints return `null`/empty — they exist only to drive request generation, not to do real work.
