# 📐 TJS Platform — Coding Standards

> **Audience**: All AI development agents and human developers working on the TJS platform.
> **Purpose**: Establish consistent, safe, and maintainable coding practices across the entire codebase.

---

## 1. General Principles

### 1.1 Code Quality

- Write **readable, self-documenting code**. Code is read far more often than it is written, so clarity is paramount. Prefer descriptive variable and function names over inline comments. A well-named function eliminates the need for most explanatory comments entirely.

- Follow the **Single Responsibility Principle (SRP)**. Each function, class, and module should do exactly one thing and do it well. If a function is doing two distinct tasks, it should be split into two separate functions. Similarly, a component that handles both UI rendering and complex data fetching should be refactored to delegate the data logic to a service.

- Apply the **Don't Repeat Yourself (DRY)** principle. When you find identical or near-identical blocks of code appearing in more than two places, extract the common logic into a shared utility function, service, or component. However, do not over-abstract prematurely — wait until the pattern genuinely repeats before extracting it.

- Keep functions **short and focused**. A function should ideally fit within one screen (approximately 30-50 lines). If it exceeds this, it likely has too many responsibilities and should be decomposed into smaller helper functions.

- **Prefer composition over inheritance**. Use dependency injection, mixins, or strategy patterns rather than deep inheritance chains. Inheritance creates tight coupling between parent and child classes, making the system harder to modify and test.

### 1.2 Code Formatting

- All code must be formatted automatically using **Prettier** with a shared configuration file (`.prettierrc`). This eliminates formatting debates and ensures every file looks identical regardless of who wrote it.

- Use **ESLint** with the project's shared configuration (`.eslintrc.js` or equivalent). All linting rules must pass before any code is merged. Do not use `// eslint-disable` unless absolutely necessary, and always include a comment explaining why.

- **Indentation**: 2 spaces (no tabs). This applies to TypeScript, JavaScript, SQL, YAML, JSON, and all configuration files.

- **Line length**: Maximum 120 characters. Break long lines at logical boundaries (after commas, operators, or before closing parentheses).

- **Trailing commas**: Required in multi-line arrays, objects, and function parameters. This improves git diffs when new items are added.

- **Semicolons**: Required in all TypeScript and JavaScript files. Consistency across the codebase prevents subtle parsing bugs.

- **Quotes**: Single quotes for strings in TypeScript/JavaScript, double quotes in JSON and SQL.

### 1.3 Type Safety

- All TypeScript code must be written with **`strict: true`** enabled in `tsconfig.json`. This includes `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, and `strictPropertyInitialization`.

- **Never use the `any` type**. If the type is genuinely unknown, use `unknown` and narrow it using type guards, type assertions (with justification), or discriminated unions. The `any` type completely bypasses TypeScript's type system and negates the benefits of using TypeScript in the first place.

- **Never use `// @ts-ignore` or `// @ts-nocheck`**. These comments suppress type errors without fixing them, leading to runtime bugs. Fix the underlying type issue instead.

- Define **explicit return types** on all public methods and exported functions. This serves as documentation and catches breaking changes at compile time rather than at runtime.

- Use **readonly** properties for values that should not be reassigned after initialization. This includes configuration objects, constant arrays, and immutable data structures.

- Prefer **`interface`** for defining object shapes that describe data contracts (API responses, component props, database records). Prefer **`type`** for union types, intersection types, mapped types, and utility types.

---

## 2. Database Coding Standards

### 2.1 Table Prefix Rule (MANDATORY)

- **ALL** database tables accessed by the application MUST use the `tjs_` prefix. This is a non-negotiable safety rule that prevents accidental interaction with system tables, Supabase internal tables (such as `auth.users`, `storage.buckets`), or any external schema tables.

- When writing any SQL query — whether in a service, a migration, or a utility function — verify that every table reference starts with `tjs_`. If a table name does not start with `tjs_`, do not proceed without explicit user authorization.

- Examples of **valid** table references:
  ```sql
  SELECT * FROM tjs_hosts;
  SELECT h.name, e.title FROM tjs_hosts h JOIN tjs_events e ON h.id = e.host_id;
  ```

- Examples of **forbidden** table references (without explicit override):
  ```sql
  SELECT * FROM users;           -- ❌ No tjs_ prefix
  SELECT * FROM auth.users;      -- ❌ Supabase system table
  SELECT * FROM storage.buckets; -- ❌ Supabase system table
  ```

### 2.2 SQL Coding Style

- All SQL keywords must be **UPPERCASE**: `SELECT`, `FROM`, `WHERE`, `JOIN`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `INDEX`, `CONSTRAINT`, `PRIMARY KEY`, `FOREIGN KEY`.

- Table and column names must be **lowercase snake_case**: `tjs_user_profiles`, `created_at`, `is_active`.

- Always use **parameterized queries** to prevent SQL injection. Never concatenate user input directly into SQL strings.

- All `SELECT` statements must explicitly list columns. Avoid `SELECT *` except in rapid prototyping or when every column is genuinely needed. When using `SELECT *`, add a comment explaining why.

- Every SQL migration file must include a **transaction block** (`BEGIN` / `COMMIT`) so that changes are atomic. If any statement fails, the entire migration rolls back.

- Use **idempotent patterns** where possible. For example, use `CREATE TABLE IF NOT EXISTS` or `INSERT ... ON CONFLICT DO NOTHING` when the migration may be re-run.

- All `CREATE TABLE` statements must include:
  - A `PRIMARY KEY` definition
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` column
  - Appropriate `NOT NULL` constraints
  - Descriptive `COMMENT` on the table

### 2.3 Database Interaction Code

- All database queries must go through the **designated data access layer** (e.g., Supabase client, repository pattern, or query builder). Never execute raw SQL directly from UI components or API route handlers.

- Wrap all database operations in proper **error handling**. Database errors should be caught, logged with context, and surfaced to the caller in a structured format (not raw SQL error messages, which may leak schema details).

- Use **connection pooling** for server-side database connections. Never open a new connection for every single query in a hot loop.

- Prefer **batch operations** over individual queries in loops. For example, use `INSERT INTO ... VALUES (...), (...), (...)` instead of executing N separate `INSERT` statements.

### 2.4 Schema Change Code

- New schema changes MUST be placed in **versioned SQL files** inside the `/db/` directory.

- File naming convention: `db/NNN_description.sql` where `NNN` is a zero-padded, sequential number.

- Every schema file must be **idempotent** — safe to run multiple times without errors or side effects.

- Never include `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN`, or any destructive DDL in a schema file unless absolutely required and explicitly documented with a warning comment.

- All new columns must have **default values** or be **nullable** to maintain backward compatibility with existing data.

---

## 3. Frontend Coding Standards

### 3.1 Component Design

- Follow the **Smart/Dumb (Container/Presentational)** component pattern. Smart components handle state management, data fetching, and business logic. Dumb (presentational) components receive data through inputs and emit events through outputs. This separation makes components reusable, testable, and easier to reason about.

- Every component must use **`ChangeDetectionStrategy.OnPush`**. This is mandatory. OnPush ensures that Angular only checks a component's template when its inputs change, dramatically improving performance.

- Components must be **standalone** (Angular 17+). Do not create NgModules for individual components. Use the `standalone: true` property and import dependencies directly into each component.

- Template and style must be in **separate files** (`component.html` and `component.scss`). Never inline templates or styles except for trivially small components (fewer than 3 lines of template).

- Use the **new control flow syntax** (`@if`, `@for`, `@switch`) instead of the old structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`). The new syntax is more readable, has better type checking, and is the recommended approach going forward.

### 3.2 State Management

- Prefer **Signals** (`signal()`, `computed()`, `effect()`) for local component state. Signals provide fine-grained reactivity and eliminate the need for `ChangeDetectorRef` or manual subscription management.

- For **shared or complex state**, use a dedicated state management solution such as NgRx SignalStore, NgRx ComponentStore, or a lightweight BehaviorSubject-based service. The choice depends on the complexity of the state and the size of the feature.

- Never store UI-specific state (modal open/close, form dirty status, dropdown visibility) in global state stores. Keep this state local to the component.

- Expose state as **observables or signals with a `$` suffix** (e.g., `users$`, `isLoading$`). Expose state mutations as **methods** (e.g., `loadUsers()`, `createHost()`).

### 3.3 Template Best Practices

- Always use the **`async` pipe** to consume observables in templates. Never manually subscribe in a component just to display data in the template. The async pipe automatically handles subscription and unsubscription, preventing memory leaks.

- Avoid complex expressions in templates. If a template binding requires more than a single function call or a ternary, move the logic to the component class. Templates should be declarative and easy to read.

- Use **`trackBy`** (or `@track` in the new control flow) for every `*ngFor` or `@for` loop. This enables Angular to efficiently track items in a list, reducing DOM operations when the list changes.

- All interactive elements must have proper **`aria-label`** attributes. Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`) instead of generic `<div>` elements for interactive content.

### 3.4 RxJS Standards

- **Always unsubscribe** from observables. The preferred methods, in order, are:
  1. `takeUntilDestroyed()` — the cleanest approach for components.
  2. `async` pipe in templates — automatic unsubscription.
  3. `takeUntil` with a destroy subject — the traditional approach.

- Prefer **composition operators** (`map`, `switchMap`, `filter`, `mergeMap`, `catchError`, `tap`) over manual `subscribe` calls. This keeps data flows declarative and easier to test.

- Use `switchMap` for HTTP calls where a new request should cancel the previous one (e.g., search-as-you-type). Use `concatMap` for sequential execution where order matters. Use `mergeMap` for parallel execution where order does not matter.

- Never call `.subscribe()` inside a service. Services should return observables and let the consuming component decide when to subscribe.

---

## 4. Backend / API Coding Standards

### 4.1 API Design

- Follow **RESTful conventions** for API endpoints. Use HTTP methods semantically: `GET` for retrieval, `POST` for creation, `PUT` for full updates, `PATCH` for partial updates, `DELETE` for removal.

- Use **plural nouns** for resource names: `/api/v1/hosts`, `/api/v1/events`, `/api/v1/users`. Avoid verbs in URLs (e.g., prefer `POST /hosts` over `POST /createHost`).

- Return consistent **JSON response envelopes**:
  ```json
  {
    "data": { ... },
    "meta": {
      "total": 100,
      "page": 1,
      "pageSize": 20
    },
    "errors": []
  }
  ```

- Use appropriate **HTTP status codes**: `200` for success, `201` for created, `204` for no content, `400` for bad request, `401` for unauthorized, `403` for forbidden, `404` for not found, `500` for server error.

### 4.2 Error Handling

- All API endpoints must have **structured error handling**. Errors must be caught, classified, and returned in a consistent format. Never expose raw stack traces, database error messages, or internal implementation details to the client.

- Implement a **global error handler** or middleware that catches unhandled exceptions, logs them with full context (request ID, user ID, timestamp, stack trace), and returns a generic error response to the client.

- Use **try/catch** blocks around all database operations and external API calls. Log the error details server-side and return a user-friendly message client-side.

### 4.3 Authentication & Authorization

- All protected endpoints must validate the **JWT token** from the request header. Use Supabase Auth for token verification and user management.

- Implement **role-based access control (RBAC)** at the API level. Each endpoint should check the user's role and permissions before processing the request.

- Never store passwords in plain text. Use Supabase Auth for user authentication — do not implement custom password hashing.

- All sensitive operations (delete, update permissions, bulk actions) must require **re-authentication** or additional confirmation.

---

## 5. Naming Conventions Summary

| Category | Convention | Example |
|---|---|---|
| Database tables | `snake_case` with `tjs_` prefix | `tjs_user_events` |
| Database columns | `snake_case` | `created_at`, `host_id` |
| SQL keywords | `UPPERCASE` | `SELECT`, `WHERE`, `JOIN` |
| TypeScript files | `kebab-case` | `user-profile.component.ts` |
| TypeScript classes | `PascalCase` | `UserProfileComponent` |
| TypeScript interfaces | `PascalCase` | `UserProfile` |
| TypeScript variables | `camelCase` | `isLoading`, `userName` |
| TypeScript constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| TypeScript observables | `camelCase` + `$` suffix | `users$`, `selectedHost$` |
| CSS classes | `kebab-case` or BEM | `user-card__title` |
| API endpoints | `kebab-case`, plural nouns | `/api/v1/user-events` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL` |
| Git branches | `kebab-case` with type prefix | `feat/add-host-management` |

---

## 6. Import & Dependency Rules

- **Never import from barrel files** (`index.ts`) with wildcards. Import directly from the source file. Barrel files create circular dependency issues and break tree-shaking.

- **Order imports** consistently in every file:
  1. External libraries (Angular, RxJS, third-party)
  2. Internal shared modules/utilities
  3. Feature-specific imports (components, services, models in the same feature)
  4. Relative imports (same directory)

- Add a **blank line** between each import group for readability.

- Do not import **entire libraries** (`import * as _ from 'lodash'`). Import only the specific functions needed (`import { debounce } from 'lodash-es'`).

- **No circular dependencies**. If module A imports module B and module B imports module A, this is a circular dependency. Restructure the shared code into a third module that both can import from.

---

## 7. Commenting & Documentation

- Write **JSDoc comments** on all public classes, methods, and exported functions. Include `@param`, `@returns`, and `@throws` tags where applicable.

- Use inline comments only to explain **why** something is done, not **what** is done. The code itself should explain what is happening. Comments like `// increment counter` add no value; comments like `// Using +1 here because the API is 1-indexed, not 0-indexed` add significant value.

- Document **complex business logic** with a comment block at the top of the function explaining the business rule, the expected inputs, and the expected outputs.

- Keep comments **up to date**. A stale comment is worse than no comment because it misleads the reader.

- Do not leave `console.log`, `console.debug`, or `debugger` statements in committed code. Use a proper logging library with configurable log levels.

---

## 8. File Organization

```
src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── services/
│   │   └── core.module.ts
│   ├── shared/            # Reusable UI components, pipes, directives
│   │   ├── components/
│   │   ├── pipes/
│   │   ├── directives/
│   │   └── shared.module.ts
│   ├── features/          # Lazy-loaded feature modules
│   │   ├── hosts/
│   │   ├── events/
│   │   └── ...
│   ├── models/            # Interfaces, types, enums
│   ├── utils/             # Pure utility functions
│   └── config/            # App configuration constants
├── db/                    # Versioned SQL migration files
├── assets/                # Static assets
├── environments/          # Environment-specific configs
└── styles/                # Global styles
```

- One **class/interface/type per file**, except for closely related types (e.g., a model and its associated enum can share a file).

- Feature directories should be **self-contained**: each feature has its own components, services, models (if feature-specific), and routes.
