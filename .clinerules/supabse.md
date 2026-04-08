

# supabase.md

## Purpose
Defines strict safety rules for interacting with Supabase to prevent unintended database changes.

---

## Core Rule (Critical)

The AI agent MUST treat Supabase as READ-ONLY unless explicit user approval is given.

---

## Forbidden Without Approval

The agent MUST NOT perform any of the following without explicit user permission:

- Modify database tables
- Change schema
- Create or run migrations
- Insert, update, or delete data
- Modify RLS (Row Level Security) policies
- Create or modify functions or triggers
- Seed or reset data

---

## Allowed Without Approval

The agent MAY:

- Inspect schema files
- Read configuration
- Analyze Supabase usage in code
- Suggest SQL queries
- Generate migration files (without executing them)
- Explain database structure or changes

---

## Approval Workflow (Mandatory)

Before performing ANY database-affecting action, the agent MUST:

1. Explain what will change
2. Provide exact SQL or migration content
3. Describe the impact
4. Provide a rollback plan
5. Explicitly ask for approval

The agent MUST wait for user confirmation before proceeding.

---

## Execution Restrictions

The agent MUST NOT automatically run:

- supabase db push
- supabase migration up
- direct SQL execution affecting data or schema

---

## Safety Defaults

- If unsure whether an action affects schema or data → assume it DOES and ask first
- Default behavior = READ-ONLY

---

## Best Practices

- Prefer generating migrations instead of direct DB changes
- Always keep changes reversible
- Clearly communicate risks before any DB operation

---

## Failure Handling

If a database-related action is attempted without approval:

- STOP immediately
- Notify the user
- Request confirmation

---

## Summary Rule

"Never modify Supabase without explicit approval. Always show the change first."