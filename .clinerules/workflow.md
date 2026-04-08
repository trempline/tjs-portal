# workflow.md

## Purpose
Defines the mandatory execution workflow the AI agent must follow when completing any task in this project.

---

## Execution Workflow (Strict Order)

For every task, follow this exact sequence:

1. Understand the task and inspect relevant code.
2. Implement code changes.
3. Create or update test cases.
4. Run unit tests.
5. If tests pass → update documentation.
6. Provide a final summary.

---

## Completion Gate (Mandatory)

A task is NOT complete unless ALL conditions are met:

- Code is implemented
- Relevant tests are added or updated
- Unit tests are executed
- All tests pass
- Documentation is updated (if applicable)
- Final summary is provided

If any step is incomplete → the task is NOT done.

---

## Testing Rules

- Always add or update tests for any code change.
- Run tests after implementation.
- Prefer focused tests first, then broader runs.
- If tests fail:
  - Stop
  - Fix the issue
  - Re-run tests
- Never proceed to documentation if tests are failing.
- If tests cannot be executed:
  - Clearly explain why
  - Do NOT mark task as complete

---

## Documentation Rules

- Documentation is updated ONLY after tests pass.
- Reflect actual implemented behavior (not intended behavior).
- Update wherever relevant:
  - README
  - Inline code comments
  - Angular components/services
  - Feature docs

---

## Development Principles

- Follow existing Angular project structure and conventions.
- Prefer minimal and targeted changes.
- Reuse existing services and patterns.
- Avoid unnecessary refactoring unless explicitly requested.

---

## Final Output Requirements

Every completed task must include:

- What was implemented
- What tests were added/updated
- Test results
- Any limitations or risks

---
