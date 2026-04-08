# 🏗️ TJS Platform — Architecture Decisions

> **Audience**: All AI development agents and human developers working on the TJS platform.
> **Purpose**: Document the key structural decisions, technology choices, and architectural patterns that govern the TJS platform.

---

## 1. Architecture Overview

### 1.1 System Context

The TJS platform is a web application built with a clear separation between the frontend presentation layer and the backend data layer, connected through a well-defined API boundary. The platform uses Supabase as the Backend-as-a-Service (BaaS) provider, which handles authentication, database management, real-time subscriptions, and file storage.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TJS Platform Architecture                     │
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│  │   Angular SPA   │────▶│   Supabase API  │────▶│  PostgreSQL   │ │
│  │  (Frontend)     │     │   (BaaS Layer)  │     │  (Database)   │ │
│  │                 │◀────│                 │◀────│               │ │
│  └─────────────────┘     └─────────────────┘     └───────────────┘ │
│                                  │                                   │
│                          ┌───────┴────────┐                          │
│                          │  Supabase Auth │                          │
│                          │  Supabase Storage                        │
│                          │  Realtime Engine                          │
│                          └────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

These principles guide every architectural decision on the TJS platform:

- **Explicit over implicit**: Every behavior should be visible and understandable by reading the code. Avoid magic, convention-based behavior that isn't documented, and hidden side effects. When a developer reads a function, they should be able to predict exactly what it does without running it.

- **Safety first**: The `tjs_` table prefix rule exists for a reason — to prevent accidental data corruption or access to system tables. Every architectural decision should err on the side of safety. Make destructive operations hard to perform accidentally. Make safe operations easy and intuitive.

- **Separation of concerns**: Keep UI rendering, business logic, and data access in distinct layers. Components should not construct SQL queries. Services should not manipulate the DOM. Database functions should not contain business logic that belongs in the application layer.

- **Evolutionary architecture**: Build for today's requirements, but design in a way that allows the architecture to evolve. Avoid irreversible decisions. Use dependency injection and abstraction layers so that implementations can be swapped without rippling changes across the codebase.

- **Convention over configuration, with guardrails**: Establish strong conventions (naming, file structure, patterns) so that developers can be productive quickly. But always provide guardrails (linting rules, CI checks, code reviews) to catch deviations early.

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Angular** | 17+ | UI framework, component model, routing |
| **TypeScript** | 5.x | Type-safe JavaScript superset |
| **RxJS** | 7.x | Reactive programming, async data streams |
| **Angular Signals** | 17+ | Fine-grained reactivity for local state |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Angular Material** | 17+ | UI component library |
| **NgRx SignalStore** | (optional) | Complex state management |

### 2.2 Backend / BaaS

| Technology | Purpose |
|---|---|
| **Supabase** | Backend-as-a-Service (auth, DB, storage, realtime) |
| **PostgreSQL** | Primary relational database |
| **Supabase Auth** | User authentication (email/password, OAuth, magic links) |
| **Supabase Storage** | File storage (images, documents, media) |
| **Supabase Realtime** | WebSocket-based real-time data subscriptions |
| **PostgREST** | Auto-generated REST API from database schema |
| **Row Level Security (RLS)** | Database-level access control |

### 2.3 Development Tools

| Technology | Purpose |
|---|---|
| **Angular CLI** | Scaffolding, building, testing |
| **ESLint** | Static code analysis |
| **Prettier** | Code formatting |
| **Jest / Karma** | Unit and integration testing |
| **Cypress / Playwright** | End-to-end testing |
| **Nx** (optional) | Monorepo management |

---

## 3. Frontend Architecture

### 3.1 Module Organization

The frontend follows a **feature-based modular architecture**. The codebase is organized by feature, not by type. This means that all the code related to a single feature (components, services, models, routes) lives together in one directory, making it easy to understand, navigate, and maintain.

```
src/app/
├── core/                          # Application-wide singleton providers
│   ├── auth/
│   │   ├── guards/
│   │   │   └── auth.guard.ts      # Functional route guard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # Functional HTTP interceptor
│   │   └── services/
│   │       └── auth.service.ts    # Singleton auth service
│   ├── http/
│   │   ├── interceptors/
│   │   │   └── error.interceptor.ts
│   │   └── services/
│   │       └── api.service.ts     # Base HTTP service
│   └── config/
│       └── app-config.ts          # App-wide configuration
│
├── shared/                        # Reusable across features
│   ├── components/
│   │   ├── loading/
│   │   ├── error-state/
│   │   ├── confirmation-dialog/
│   │   └── data-table/
│   ├── pipes/
│   │   ├── date-format/
│   │   └── truncate/
│   ├── directives/
│   │   ├── click-outside/
│   │   └── debounce-click/
│   └── models/
│       ├── pagination.model.ts
│       └── api-response.model.ts
│
├── features/                      # Feature modules (lazy-loaded)
│   ├── hosts/
│   │   ├── pages/
│   │   │   ├── host-list/
│   │   │   ├── host-detail/
│   │   │   └── host-form/
│   │   ├── components/
│   │   │   ├── host-card/
│   │   │   └── host-filter/
│   │   ├── services/
│   │   │   └── host.service.ts
│   │   ├── models/
│   │   │   └── host.model.ts
│   │   ├── hosts.routes.ts
│   │   └── hosts.resolver.ts
│   │
│   ├── events/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   └── events.routes.ts
│   │
│   └── dashboard/
│       ├── pages/
│       │   └── dashboard/
│       ├── services/
│       │   └── dashboard.service.ts
│       └── dashboard.routes.ts
│
├── models/                        # Global shared interfaces and types
│   ├── user.model.ts
│   └── common.model.ts
│
├── utils/                         # Pure utility functions (no Angular deps)
│   ├── date.utils.ts
│   ├── string.utils.ts
│   └── validation.utils.ts
│
├── app.routes.ts                  # Root route configuration
├── app.config.ts                  # Application configuration providers
├── app.component.ts               # Root component
├── app.component.html
└── app.component.scss
```

### 3.2 Data Flow Architecture

The TJS platform uses a **unidirectional data flow** pattern. Data flows downward from services to components via inputs and observables/signals. Events flow upward from components to services via method calls and event emitters. This makes the data flow predictable and easy to debug.

```
┌──────────────┐     Data (Observable/Signal)     ┌──────────────┐
│              │ ─────────────────────────────────▶ │              │
│   Service     │                                   │  Component   │
│  (Data Layer) │ ◀───────────────────────────────── │  (View Layer)│
│              │     Events (Method Calls)           │              │
└──────┬───────┘                                    └──────────────┘
       │
       │ HTTP / Supabase Client
       ▼
┌──────────────┐
│   Supabase   │
│  (API/DB)    │
└──────────────┘
```

**Data flow rules:**

1. **Services own the data**: All data fetching, transformation, and caching logic lives in services. Components never make direct HTTP calls.

2. **Components own the view**: Components receive data from services and render it. They emit user actions (clicks, form submissions) back to services. Components should be as stateless as possible.

3. **State flows down**: Parent components pass data to child components via `@Input()` bindings or shared services. Children never reach up to read parent state.

4. **Events flow up**: Child components notify parents of user interactions via `@Output()` event emitters or by calling methods on injected services.

5. **Side effects are centralized**: HTTP calls, localStorage access, and other side effects are always performed in services, never in components.

### 3.3 Routing Architecture

- All feature modules are **lazy-loaded** via `loadChildren`. This ensures that feature code is only downloaded when the user navigates to that feature, reducing the initial bundle size.

- Route guards are **functional** (not class-based). They are simpler, more testable, and the recommended approach in Angular 15+.

- Route resolvers **pre-fetch data** before the component initializes. This prevents the component from rendering in a loading state and simplifies the component logic.

- Route configuration lives **inside the feature directory**, not in the root. This keeps feature modules self-contained and makes it easy to add, remove, or modify routes without touching the root configuration.

```typescript
// src/app/features/hosts/hosts.routes.ts
import { Routes } from '@angular/router';

export const HOSTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/host-list/host-list.component'),
    resolve: { hosts: HostResolver },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/host-detail/host-detail.component'),
    resolve: { host: HostDetailResolver },
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/host-form/host-form.component'),
  },
];
```

### 3.4 State Management Strategy

The TJS platform uses a **layered state management** approach. Not all state requires the same tool:

| State Type | Scope | Management Approach |
|---|---|---|
| **Local UI state** | Single component | Angular Signals (`signal()`, `computed()`) |
| **Shared feature state** | Within a feature | ComponentStore / BehaviorSubject service |
| **Global application state** | Cross features | NgRx SignalStore / Global BehaviorSubject service |
| **Server state** | From API | RxJS observables with `async` pipe |

**Decision criteria:**

- Use **Signals** for simple local state (form values, toggle states, selected items). Signals are synchronous, have no subscription overhead, and are the future of Angular reactivity.

- Use **BehaviorSubject in services** for shared state that needs to be accessed by multiple components (e.g., the currently authenticated user, global notifications). BehaviorSubjects ensure that late subscribers receive the most recent value.

- Use **NgRx SignalStore** (or ComponentStore) only when the state is truly complex (multiple related entities, derived computations, complex transitions). Do not use NgRx for simple toggle states or lists.

- Use the **async pipe** for consuming server data in templates. The async pipe handles subscription, unsubscription, and change detection automatically.

---

## 4. Database Architecture

### 4.1 Schema Design Principles

- **All tables use the `tjs_` prefix**: This is the single most important database rule. It provides namespace isolation, prevents accidental access to system tables, and makes it immediately clear which tables belong to the application versus the infrastructure.

- **Every table is a `tjs_` table**: There are no exceptions. If a table does not start with `tjs_`, it either belongs to Supabase internals or should not exist in this project.

- **Use UUIDs as primary keys**: All `tjs_` tables use `UUID` type for their `id` column. UUIDs are globally unique, preventing ID collisions in distributed systems, and they do not expose information about record count or creation order (unlike auto-incrementing integers).

- **Timestamps on every table**: Every `tjs_` table must include `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()) and `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()). The `updated_at` column should be automatically updated via a database trigger.

- **Soft deletes over hard deletes**: Prefer adding an `is_deleted` or `deleted_at` column over actually deleting records. This preserves audit trails and allows data recovery. Hard deletes should only be used for data that must be permanently erased (GDPR compliance).

### 4.2 Table Relationship Patterns

- **Foreign keys reference only `tjs_` tables**: All foreign key constraints must point to other `tjs_` tables. This is enforced by the table prefix rule and by database-level constraints.

- **Use ON DELETE CASCADE carefully**: Cascade deletes are convenient but dangerous. Only use them when the child record has no meaning without the parent (e.g., `tjs_event_tags` when a `tjs_events` record is deleted). For most relationships, use `ON DELETE SET NULL` or `ON DELETE RESTRICT`.

- **Junction tables for many-to-many**: Use explicitly named junction tables (e.g., `tjs_event_hosts`, `tjs_user_roles`) with composite primary keys.

### 4.3 Schema Migration Architecture

```
db/
├── 001_create_tjs_hosts.sql
├── 002_create_tjs_events.sql
├── 003_create_tjs_event_hosts.sql  (junction table)
├── 004_add_tjs_events_description.sql
├── 005_create_tjs_audit_log.sql
└── ...
```

**Migration rules:**

1. **Sequential numbering**: Each migration file has a three-digit sequential number. This defines the order of execution. Never reuse numbers and never skip numbers.

2. **Descriptive file names**: The filename must clearly describe what the migration does. Use `create` for new tables, `add` for new columns, `update` for modifications, `drop` for removals.

3. **Idempotent migrations**: Every migration file must be safe to run multiple times. Use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and `INSERT ... ON CONFLICT DO NOTHING` patterns.

4. **Transactional migrations**: Wrap all statements in `BEGIN` / `COMMIT` blocks. If any statement fails, the entire migration rolls back, leaving the database in a consistent state.

5. **Backward-compatible changes only**: New columns must be nullable or have default values. Never rename or remove a column in a way that breaks existing queries. Use a two-step migration (add new column → migrate data → remove old column) for breaking changes.

6. **No direct schema modification**: Never modify existing tables directly through the Supabase dashboard or raw SQL. All schema changes must go through the migration file system.

### 4.4 Row Level Security (RLS)

- **All `tjs_` tables MUST have RLS enabled**. This is a security requirement, not a suggestion. RLS ensures that users can only access data they are authorized to access, even if they bypass the frontend.

- **RLS policies must be explicit**: Each table must have at least one `SELECT` policy, one `INSERT` policy, one `UPDATE` policy, and one `DELETE` policy. If a table should not allow writes, create explicit `DENY` policies.

- **Use Supabase's `auth.uid()` function** in RLS policies to enforce row-level ownership. For example:
  ```sql
  CREATE POLICY "Users can read their own records"
    ON tjs_user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  ```

- **Service role bypass**: The Supabase service role key bypasses RLS. Use it only in server-side contexts (API routes, edge functions), never in client-side code.

### 4.5 Database Function & Trigger Patterns

- Use PostgreSQL **functions** for complex queries that are executed frequently from the application. Functions reduce network round-trips and keep query logic close to the data.

- Use **triggers** for maintaining derived state (e.g., updating `updated_at` timestamps, maintaining materialized views, writing to audit logs).

- All functions and triggers must follow the `tjs_` naming convention: `tjs_fn_calculate_host_rating()`, `tjs_trg_update_timestamp()`.

---

## 5. API Architecture

### 5.1 API Layer Design

The TJS platform uses Supabase's auto-generated **PostgREST API** as the primary data access layer. This eliminates the need to build and maintain a custom backend API for standard CRUD operations.

**When to use PostgREST directly:**
- Simple CRUD operations (create, read, update, delete)
- Filtering, sorting, and pagination
- One-to-many and many-to-many relationships with foreign key joins

**When to use Supabase Edge Functions instead:**
- Complex business logic that cannot be expressed in a single query
- Operations that require validating against external APIs
- Multi-step transactions that need atomic rollback
- Rate limiting or request validation beyond RLS

### 5.2 API Service Pattern

All database interactions from the Angular frontend go through typed service classes. These services wrap the Supabase client and provide a type-safe, application-specific API.

```typescript
// Standard service pattern for tjs_ table access
@Injectable({ providedIn: 'root' })
export class HostService {
  private readonly supabase = inject(SupabaseClient);
  private readonly tableName = 'tjs_hosts' as const; // ← Always tjs_ prefixed

  getAll(): Observable<Host[]> {
    return from(
      this.supabase
        .from(this.tableName)  // ← Safe: always uses tjs_ prefix
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map(({ data, error }) => {
      if (error) throw new ApiError(error.message, error.code);
      return data as Host[];
    }));
  }

  getById(id: string): Observable<Host> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(map(({ data, error }) => {
      if (error) throw new ApiError(error.message, error.code);
      return data as Host;
    }));
  }
}
```

### 5.3 Error Handling Architecture

The platform uses a **layered error handling** strategy:

1. **Database level**: PostgreSQL constraints, RLS policies, and triggers enforce data integrity and access control.

2. **Service level**: Services catch Supabase errors and wrap them in application-specific error classes. This abstracts away database-specific error codes and provides a consistent error interface.

3. **Component level**: Components catch service errors and display user-friendly messages. Components never show raw error codes or database messages.

4. **Global level**: A global error handler catches unhandled errors, logs them with full context (request ID, user ID, timestamp), and displays a generic error message to the user.

```typescript
// Application error hierarchy
export class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class ApiError extends AppError {
  constructor(message: string, public statusCode: number) {
    super(message, `API_${statusCode}`);
  }
}

export class ValidationError extends AppError {
  constructor(public fields: Record<string, string>) {
    super('Validation failed', 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
  }
}
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
User ──▶ Angular App ──▶ Supabase Auth ──▶ PostgreSQL
            │                                    │
            │  JWT Token                          │
            │◀────────────────────────────────────│
            │                                    │
            │  API Request + JWT                  │
            │────────────────────────▶ Supabase API
            │                                    │
            │  RLS enforces access                │
            │◀────────────────────────────────────│
```

- **Supabase Auth** handles user registration, login, password recovery, and session management. The application does not implement custom authentication logic.

- **JWT tokens** are issued by Supabase Auth and include the user's ID, role, and expiration. These tokens are sent with every API request via the `Authorization` header.

- **Session management**: The Angular app stores the JWT in memory (not localStorage for security-sensitive apps, or in localStorage for convenience). The auth service automatically refreshes the token when it expires.

- **Route guards** prevent unauthenticated users from accessing protected routes. Guards check the auth state before allowing navigation.

### 6.2 Authorization Model

- **RLS as the primary authorization layer**: Database-level Row Level Security ensures that users can only access data they own or have been granted access to, regardless of the client they use.

- **API-level authorization**: Edge Functions and service-side code must validate the user's role and permissions before performing operations. Do not rely solely on RLS for server-side operations.

- **Role-based access control (RBAC)**: Define roles (admin, editor, viewer) in a `tjs_user_roles` table. Check roles in RLS policies and API guards.

### 6.3 Data Protection

- **Encryption in transit**: All communication between the Angular app and Supabase uses HTTPS/TLS. Never use HTTP in production.

- **Encryption at rest**: Supabase encrypts all data at rest. No additional encryption is needed for data stored in `tjs_` tables.

- **PII handling**: Personal identifiable information (names, emails, phone numbers) must be stored only in designated `tjs_` tables. Never log PII. Use data masking in non-production environments.

- **API key management**: Supabase API keys (anon key, service role key) must be stored in environment files. The service role key must NEVER be exposed to the client side.

---

## 7. File & Asset Architecture

### 7.1 File Storage

- Use **Supabase Storage** for all file uploads (images, documents, media files).
- Organize storage buckets by purpose: `avatars/`, `event-images/`, `documents/`, `exports/`.
- Set **storage policies** to control who can upload, read, and delete files. These policies should mirror the RLS policies on the corresponding `tjs_` tables.
- Generate **signed URLs** for private files instead of making buckets publicly accessible.

### 7.2 Asset Pipeline

- Images: Use `NgOptimizedImage` directive for automatic image optimization (lazy loading, responsive sizes, WebP format).
- Icons: Use Angular Material icons or custom SVG sprites. Avoid icon fonts for better performance and accessibility.
- Fonts: Self-host fonts. Avoid loading fonts from external CDNs to prevent layout shift and privacy leaks.

---

## 8. Environment & Configuration Architecture

### 8.1 Environment Configuration

```
src/environments/
├── environment.example.ts    # Template with all keys (committed to git)
├── environment.development.ts # Development values (committed to git)
├── environment.staging.ts     # Staging values (committed to git)
└── environment.production.ts  # Production values (NOT committed)
```

**Rules:**

- All environment-specific values (API URLs, feature flags, analytics keys) must be defined in environment files, never hardcoded in components or services.

- `environment.example.ts` must be committed to git with placeholder values. This serves as documentation for required configuration keys.

- Production secrets (API keys, database passwords) must NOT be committed to git. Use environment variables or a secrets manager (Supabase Vault, AWS Secrets Manager).

- Access environment values through an `EnvironmentService` or Angular's `inject(ENVIRONMENT)` pattern, not by importing `environment.ts` directly.

### 8.2 Feature Flags

- Use a dedicated `tjs_feature_flags` table or a feature flag service to control feature availability without redeploying.

- Feature flags must be evaluated at the route level (using route guards) and at the component level (using `*ngIf` or `@if` with the feature flag value).

---

## 9. Performance Architecture

### 9.1 Bundle Optimization

- **Lazy loading**: All feature modules are lazy-loaded. Only the core module and shared module are included in the initial bundle.

- **Tree shaking**: Use ES modules and `import { specific }` syntax. Avoid barrel files (index.ts) that re-export everything, as they can prevent tree shaking.

- **Preloading strategy**: Use `preload` for features that the user is likely to navigate to (e.g., after loading the dashboard, preload the events feature).

### 9.2 Runtime Performance

- **OnPush change detection**: Mandatory for all components. This reduces the number of change detection cycles dramatically.

- **Virtual scrolling**: Use `@angular/cdk` virtual scrolling for lists with more than 100 items.

- **Image optimization**: Use `NgOptimizedImage` for all images. Serve images in WebP format. Use responsive `srcset` attributes.

- **Debouncing**: Debounce user input events (search fields, auto-save) using RxJS `debounceTime` operator.

---

## 10. Deployment Architecture

### 10.1 Environments

| Environment | Purpose | Database | Branch |
|---|---|---|---|
| **Development** | Local development | Local Supabase | `feature/*` |
| **Staging** | Pre-production testing | Staging Supabase | `develop` |
| **Production** | Live application | Production Supabase | `main` |

### 10.2 CI/CD Pipeline

```
Code Push ──▶ Lint & Format ──▶ Type Check ──▶ Unit Tests ──▶ Build ──▶ E2E Tests ──▶ Deploy
                                                                                      │
                                                                              ┌───────┴────────┐
                                                                              │  Staging or    │
                                                                              │  Production    │
                                                                              └────────────────┘
```

- **Lint & Format**: ESLint + Prettier. Must pass with zero errors and zero warnings.
- **Type Check**: `tsc --noEmit`. Must pass with zero type errors.
- **Unit Tests**: Must pass with coverage above minimum thresholds.
- **Build**: `ng build --configuration=production`. Must succeed with no warnings.
- **E2E Tests**: Must pass for staging and production deployments.
- **Deploy**: Automated deployment to the target environment after all checks pass.

### 10.3 Database Deployment

- Database migrations must be applied **before** the application deployment.
- Migrations must be applied in sequential order, with a rollback plan for each.
- Never apply destructive migrations (DROP TABLE, DROP COLUMN) without a backup and a rollback migration file.

---

## 11. Architectural Decision Records (ADR)

When making significant architectural decisions, document them using the ADR format:

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

Store ADRs in `/docs/adr/` directory. Each ADR is a separate markdown file named `NNNN-title.md`.
