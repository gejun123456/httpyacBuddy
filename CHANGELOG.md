# Change Log

All notable changes to the "spring-http-buddy" extension will be documented in this file.

## [0.0.2] - 2026-07-01

### Added
- **httpYac support**: Generate `.http` request files compatible with httpYac, in addition to REST Client and IntelliJ HTTP Client.
- **Internationalization (i18n)**: Added Chinese language support. The extension now automatically detects VS Code display language and shows Chinese localized messages when available.
- **Localized AI Prompt**: The "Copy AI Parameter Prompt" command now outputs prompts in the detected language.

### Changed
- Extension renamed to **Spring HTTP Buddy** for clearer branding.
- Improved grammar and placeholder generation for non-English method names.
- Better path parameter handling for requests using `@RequestMapping` with wildcard patterns.
- Enhanced error messages for unsupported parameter types.

## [0.0.1] - 2026-06-10

### Added
- Initial release
- CodeLens provider: "Generate HTTP Request" action on Spring controller methods.
- "Open HTTP Request" command to navigate from Java code to generated `.http` files.
- "Open Java Controller" command to navigate from `.http` requests back to the Java source.
- "Copy AI Parameter Prompt" command to copy structured parameter descriptions for LLM-assisted request crafting.
- Supports `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`, and `@RequestMapping`.
- Detects `server.port` from Spring Boot `application.properties` / `application.yml`.
- Generates example values for common Java types (String, int, long, boolean, UUID, LocalDate, etc.).
- Configurable base URL via `springHttpBuddy.baseUrl`.
- Demo Spring Boot project included for testing.