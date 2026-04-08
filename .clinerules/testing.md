# 🧪 TJS Platform — Test Requirements

> **Audience**: All AI development agents and human developers working on the TJS platform.
> **Purpose**: Define mandatory testing standards, coverage expectations, and test architecture for the entire codebase.

---

## 1. Testing Philosophy

### 1.1 Core Principles

- **Tests are code, not an afterthought.** Every test file must be treated with the same care and quality standards as production code. This means proper naming, clean structure, no commented-out code, and no hardcoded test data that cannot be understood at a glance.

- **Write tests BEFORE or DURING development, not after.** Tests written after a feature is "complete" tend to only test the happy path because the developer already knows it works. Writing tests first forces you to think about edge cases, error conditions, and the contract of the code before it exists.

- **A test must be deterministic.** The same test must always produce the same result regardless of when, where, or how many times it runs. If a test depends on the order of execution, the current time, the state of a database, or random data, it is a flaky test and must be fixed.

- **A test must be isolated.** Each test must set up its own preconditions and clean up after itself. Tests must not depend on the side effects of other tests. The order in which tests run should never matter.

- **Test behavior, not implementation.** Tests should verify that a component produces the correct output for a given input, not that it calls a specific internal method in a specific order. Testing implementation details makes tests brittle — they break when you refactor the code even if the behavior remains correct.

### 1.2 Testing Pyramid

The TJS platform follows the testing pyramid model. The majority of tests should be fast, isolated unit tests at the base, with fewer integration tests in the middle, and a small number of end-to-end tests at the top.

```
        /  E2E  \              ← Fewest tests, highest confidence
       / Integration \          ← Moderate count, API + DB tests
      /   Unit Tests  \         ← Most tests, fastest execution
     /_________________\
```

| Level | Scope | Speed | Count | Tools |
|---|---|---|---|---|
| **Unit** | Single function, component, or service | < 5ms each | ~70% of all tests | Jest / Karma + Jasmine |
| **Integration** | Service + Database, API + Auth | 50-500ms each | ~25% of all tests | Supabase test helpers, http-testing |
| **E2E** | Full user flows across the application | 1-10s each | ~5% of all tests | Cypress / Playwright |

---

## 2. Unit Testing

### 2.1 Component Testing

Every component MUST have a corresponding `.spec.ts` file. The test file must cover the following scenarios at minimum:

- **Rendering**: The component renders correctly with default inputs. Verify that the expected HTML structure, text content, and CSS classes are present in the DOM.

- **Input binding**: The component correctly displays data passed through `@Input()` properties. Test with valid data, empty data, null values, and boundary values (very long strings, very large numbers, special characters).

- **Output emission**: The component correctly emits events through `@Output()` properties when the user interacts with the UI. Use `jasmine.createSpyObj()` or Jest mocks to capture emitted values and verify them.

- **User interaction**: The component responds correctly to user interactions (clicks, form input, keyboard events). Use Angular's `DebugElement` to query elements and trigger events.

- **Edge cases**: The component handles empty states, loading states, error states, and missing data gracefully. Each of these states should render appropriate UI feedback.

- **Accessibility**: Interactive elements are focusable, form fields have labels, and ARIA attributes are correctly applied.

**Component test template:**
```typescript
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  // --- Rendering tests ---
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user name when provided', () => {
    component.user = { id: '1', name: 'Jane Doe', email: 'jane@example.com' };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Jane Doe');
  });

  it('should display empty state when user is null', () => {
    component.user = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No user selected');
  });

  // --- Interaction tests ---
  it('should emit save event when save button is clicked', () => {
    component.user = { id: '1', name: 'Jane', email: 'jane@example.com' };
    fixture.detectChanges();
    spyOn(component.userSaved, 'emit');

    const saveButton = fixture.nativeElement.querySelector('[data-testid="save-btn"]');
    saveButton.click();

    expect(component.userSaved.emit).toHaveBeenCalledWith(component.user);
  });

  // --- Edge case tests ---
  it('should handle very long user names without layout break', () => {
    component.user = { id: '1', name: 'A'.repeat(500), email: 'jane@example.com' };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A'.repeat(500));
  });
});
```

### 2.2 Service Testing

Every service MUST have a corresponding `.spec.ts` file. Service tests must cover:

- **Method behavior**: Each public method produces the correct output for valid inputs. Test with typical values, edge cases, and boundary conditions.

- **HTTP communication**: For services that make HTTP calls, use `HttpTestingController` (or Supabase mock) to verify that the correct request is sent (URL, method, headers, body) and that the service correctly processes the response.

- **Error handling**: The service correctly handles HTTP errors (400, 401, 403, 404, 500) and network failures. Verify that errors are surfaced to the caller in a structured format.

- **State mutations**: For stateful services, verify that internal state changes correctly after method calls. Use `BehaviorSubject` or Signals and verify emitted values.

- **Observable behavior**: For methods returning observables, verify that the correct values are emitted over time, in the correct order, and that the observable completes (or does not complete, as expected).

**Service test template:**
```typescript
describe('HostService', () => {
  let service: HostService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HostService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should fetch hosts list', () => {
    const mockHosts: Host[] = [
      { id: '1', name: 'Host A', created_at: '2025-01-01' },
      { id: '2', name: 'Host B', created_at: '2025-01-02' },
    ];

    service.getHosts().subscribe(hosts => {
      expect(hosts).toEqual(mockHosts);
    });

    const req = httpMock.expectOne('/api/v1/hosts');
    expect(req.request.method).toBe('GET');
    req.flush(mockHosts);
  });

  it('should handle 404 when fetching a non-existent host', () => {
    service.getHostById('999').subscribe({
      next: () => fail('Expected error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.message).toContain('Host not found');
      },
    });

    const req = httpMock.expectOne('/api/v1/hosts/999');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});
```

### 2.3 Pipe & Directive Testing

- **Pipes**: Test with valid inputs, null inputs, undefined inputs, and empty strings. Verify that the output matches the expected transformation.

- **Directives**: Test that the directive correctly modifies the host element's behavior or appearance. Verify that the directive properly cleans up when the element is destroyed (unsubscribe from events, remove listeners).

### 2.4 Utility Function Testing

- Pure functions in the `utils/` directory must have 100% test coverage. These functions are deterministic and easy to test, so there is no excuse for missing coverage.

- Test with: valid inputs, invalid inputs (wrong types, out-of-range values), boundary values (empty string, zero, negative numbers, maximum safe integer), and `null`/`undefined` if applicable.

---

## 3. Database Testing

### 3.1 Schema Migration Testing

- Every SQL file in the `/db/` directory must be tested by executing it against a **local test database** before being applied to staging or production.

- Migration tests must verify:
  - The SQL executes without errors.
  - All expected tables, columns, indexes, and constraints are created.
  - The migration is idempotent (safe to run multiple times).
  - No existing data is corrupted or lost.
  - Foreign key relationships are valid.

- Use a dedicated test database that mirrors the production schema. Reset it to a known state before each test run.

**Migration test template:**
```sql
-- Test: Verify tjs_hosts table is created correctly
BEGIN;

-- Run migration
\i db/001_create_tjs_hosts.sql

-- Verify table exists
SELECT count(*) FROM information_schema.tables
WHERE table_name = 'tjs_hosts';

-- Verify columns exist with correct types
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tjs_hosts'
ORDER BY ordinal_position;

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'tjs_hosts';

ROLLBACK; -- Discard changes after test
```

### 3.2 Table Prefix Validation

- All tests must verify that the application ONLY interacts with tables prefixed with `tjs_`. This includes:
  - Unit tests for repository/service layers that construct SQL queries.
  - Integration tests that verify query patterns against the database.
  - Any custom query builders or ORM configurations.

- Write a dedicated test that scans the codebase for raw SQL strings and verifies every table reference starts with `tjs_`.

### 3.3 Data Integrity Testing

- Test foreign key constraints: inserting a record with a non-existent foreign key must fail.
- Test unique constraints: inserting a duplicate record must fail.
- Test NOT NULL constraints: inserting a record with a null required field must fail.
- Test default values: inserting a record without specifying a column with a default must succeed with the default value applied.
- Test cascading deletes: deleting a parent record must correctly cascade or restrict based on the configured relationship.

---

## 4. Integration Testing

### 4.1 API Integration Tests

Integration tests verify that multiple parts of the system work together correctly. These tests are slower than unit tests but provide higher confidence.

- **Test the full request lifecycle**: HTTP request → route → controller/handler → service → database → response.

- Use a **real or containerized test database** (not mocked). This catches issues like SQL syntax errors, type mismatches, and constraint violations that mocks would miss.

- Use **Supabase's test utilities** or a dedicated test project to run integration tests against a real Supabase instance.

- Test authentication flows: verify that unauthenticated requests are rejected, that valid tokens are accepted, and that expired tokens are rejected.

- Test authorization: verify that users can only access resources they have permission for.

**Integration test template:**
```typescript
describe('Hosts API Integration', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    // Initialize test Supabase client
    supabase = createTestSupabaseClient();
    // Seed test data
    await seedTestData(supabase);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanTestData(supabase);
  });

  it('should create a host and retrieve it', async () => {
    const newHost = {
      name: 'Test Host',
      description: 'Integration test host',
    };

    const { data, error } = await supabase
      .from('tjs_hosts')
      .insert(newHost)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Test Host');
    expect(data.id).toBeDefined();

    // Verify retrieval
    const { data: fetched, error: fetchError } = await supabase
      .from('tjs_hosts')
      .select('*')
      .eq('id', data.id)
      .single();

    expect(fetchError).toBeNull();
    expect(fetched.name).toBe('Test Host');
  });

  it('should enforce tjs_ table prefix — reject non-prefixed table access', async () => {
    const { error } = await supabase
      .from('hosts') // Missing tjs_ prefix
      .select('*');

    expect(error).toBeDefined();
    expect(error.code).toBe('42P01'); // relation does not exist
  });
});
```

### 4.2 Frontend-Backend Integration Tests

- Test that Angular services correctly communicate with the API and handle responses.

- Use Angular's `HttpClientTestingModule` with `HttpTestingController` for mocking API responses in component integration tests.

- Test error scenarios: network failures, server errors (500), validation errors (400), and unauthorized access (401/403).

---

## 5. End-to-End (E2E) Testing

### 5.1 Scope & Coverage

E2E tests simulate real user interactions with the application. They are the most expensive to write and maintain, so keep them focused on critical user journeys.

- Test the **primary user flows**:
  - User registration and login
  - Creating, reading, updating, and deleting core resources (hosts, events, etc.)
  - Navigation between pages
  - Form validation and submission
  - Error recovery scenarios

- Do NOT use E2E tests for:
  - Unit-level logic (calculations, data transformations)
  - Visual regression (use visual testing tools instead)
  - Performance benchmarking (use Lighthouse or dedicated tools)

### 5.2 E2E Test Structure

- Use **Cypress** or **Playwright** as the E2E framework.

- Use **page object pattern** to encapsulate page interactions. This makes tests more readable and reduces duplication when the UI changes.

- Each E2E test must be independent and clean up after itself (delete created records, reset state).

- Use **custom commands** for common operations (login, create host, navigate to page).

**Page object example:**
```typescript
// cypress/support/pages/hosts-page.ts
export class HostsPage {
  visit() {
    cy.visit('/hosts');
  }

  clickCreateHost() {
    cy.get('[data-testid="create-host-btn"]').click();
  }

  fillHostName(name: string) {
    cy.get('[data-testid="host-name-input"]').type(name);
  }

  submitForm() {
    cy.get('[data-testid="host-submit-btn"]').click();
  }

  getHostCard(name: string) {
    return cy.get(`[data-testid="host-card"]`).contains(name);
  }
}

// cypress/e2e/hosts.cy.ts
describe('Hosts Management', () => {
  const hostsPage = new HostsPage();

  beforeEach(() => {
    cy.login('testuser@example.com', 'password123');
  });

  it('should create a new host', () => {
    hostsPage.visit();
    hostsPage.clickCreateHost();
    hostsPage.fillHostName('Test Host');
    hostsPage.submitForm();
    hostsPage.getHostCard('Test Host').should('be.visible');
  });
});
```

### 5.3 Test Data Management

- Use **factory functions** or **fixtures** to generate test data. Never hardcode raw data directly in test cases.

- Each E2E test must create its own test data at the start and clean it up at the end (even if the test fails — use `afterEach` or `after` hooks).

- Use unique identifiers (timestamps, UUIDs) to prevent test data collisions between parallel test runs.

---

## 6. Test Data & Fixtures

### 6.1 Fixture Organization

```
src/
├── fixtures/
│   ├── hosts.fixture.ts       # Host mock data
│   ├── events.fixture.ts      # Event mock data
│   ├── users.fixture.ts       # User mock data
│   └── api-responses.fixture.ts  # API response shapes
```

- Fixtures must be **typed** using the same interfaces as the production code.
- Provide both **valid** and **invalid** fixture data for each entity.
- Include **edge case fixtures**: extremely long strings, special characters, unicode, null fields, missing fields.

### 6.2 Factory Pattern

For dynamic test data, use factory functions instead of static fixtures:

```typescript
// src/fixtures/host.factory.ts
export function createMockHost(overrides: Partial<Host> = {}): Host {
  return {
    id: crypto.randomUUID(),
    name: `Test Host ${Date.now()}`,
    description: 'Test description',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Usage in tests
it('should handle a host with a very long name', () => {
  const host = createMockHost({ name: 'A'.repeat(1000) });
  // ...
});
```

---

## 7. Coverage Requirements

### 7.1 Minimum Coverage Thresholds

| Area | Minimum Coverage | Target Coverage |
|---|---|---|
| Services | 90% | 95% |
| Components | 80% | 90% |
| Pipes & Directives | 90% | 95% |
| Utility Functions | 100% | 100% |
| Guards & Interceptors | 85% | 90% |
| Resolvers | 85% | 90% |
| Models & Types | N/A | N/A (no logic to test) |
| SQL Migrations | Tested manually | Automated migration tests |

### 7.2 Coverage Configuration

- Configure coverage reporting in `jest.config.js` or `karma.conf.js` with the thresholds above.
- CI/CD pipelines MUST fail if coverage drops below the minimum threshold for any file.
- Generate coverage reports in both **LCOV** (for CI integration) and **HTML** (for local review).

### 7.3 What NOT to Count

- Do not count third-party library code.
- Do not count auto-generated code (schema types from Supabase, protocol buffers).
- Do not count configuration files.
- Do not count test files themselves.

---

## 8. Test Naming Conventions

### 8.1 Describe / It Blocks

- `describe()` blocks should use the name of the unit under test (component, service, function).
- `it()` blocks should describe the **expected behavior**, not the implementation.

**Good naming:**
```typescript
describe('HostService', () => {
  describe('getHosts', () => {
    it('should return a list of hosts when the API responds successfully', () => {});
    it('should return an empty array when no hosts exist', () => {});
    it('should throw an error when the API returns 500', () => {});
  });
});
```

**Bad naming:**
```typescript
describe('HostService', () => {
  it('works', () => {});           // ❌ Too vague
  it('calls http.get', () => {});  // ❌ Tests implementation, not behavior
  it('test 1', () => {});          // ❌ Meaningless name
});
```

### 8.2 Test File Naming

| Artifact | Test File |
|---|---|
| `user-profile.component.ts` | `user-profile.component.spec.ts` |
| `host.service.ts` | `host.service.spec.ts` |
| `date-format.pipe.ts` | `date-format.pipe.spec.ts` |
| `format-currency.ts` | `format-currency.spec.ts` |

---

## 9. Test Anti-Patterns (DO NOT)

- ❌ **Testing implementation details**: Don't assert that a private method was called. Test the public API and its observable effects.

- ❌ **Testing framework internals**: Don't test that Angular's dependency injection works. Trust the framework.

- ❌ **Flaky tests with timing**: Don't use `setTimeout`, `delay`, or `fixture.whenStable()` without proper async handling. Use `fakeAsync`/`tick` or `waitForAsync`.

- ❌ **Test interdependency**: Don't let Test A depend on the state left by Test B. Each test must be independently runnable.

- ❌ **Testing trivial code**: Don't write tests for simple getters/setters, type aliases, or constant declarations. Focus on code with logic.

- ❌ **Ignoring failing tests**: Don't use `xit()`, `xdescribe()`, `it.skip()`, `describe.skip()` to skip failing tests. Fix the test or fix the code. If a test must be temporarily skipped, add a comment with the ticket number and expected fix date.

- ❌ **Over-mocking**: Don't mock everything. If you mock the service AND the HTTP client AND the response object, your test isn't testing anything real. Only mock external dependencies.

- ❌ **No cleanup**: Don't leave test data in the database after E2E or integration tests. Always clean up in `afterAll` or `afterEach`.

---

## 10. CI/CD Integration

### 10.1 Test Pipeline

All tests must run automatically in the CI/CD pipeline on every pull request:

```yaml
# Example CI pipeline stages
stages:
  - lint           # ESLint, Prettier check
  - type-check     # tsc --noEmit
  - unit-tests     # Jest/Karma with coverage
  - integration    # API + DB integration tests
  - e2e            # Cypress/Playwright
```

### 10.2 Test Execution Rules

- **Unit tests**: Run on every commit. Must complete in under 60 seconds for the entire suite.
- **Integration tests**: Run on every pull request. Must complete in under 5 minutes.
- **E2E tests**: Run on every pull request to `main` or `develop`. Must complete in under 15 minutes.

### 10.3 Failure Handling

- Any test failure MUST block the merge. No exceptions.
- Flaky tests that fail intermittently MUST be fixed or removed within 48 hours of being identified.
- The CI pipeline MUST report coverage trends — coverage must never decrease on `main`.
