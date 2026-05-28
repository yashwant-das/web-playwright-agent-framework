---
id: "T-001"
title: "Automate Login Page Critical Path"
status: "TODO"
owner: "AI"
priority: "High"
dependsOn: []
---

<details>
<summary>Task File Format Guide (Click to expand)</summary>

## YAML Frontmatter Fields

- **status**: `REQUIRED` - Used by `scripts/task.ts` for workflow transitions (TODO → IN_PROGRESS → DONE → BLOCKED)
- **dependsOn**: `OPTIONAL` - Array of task IDs (e.g. `["T-001"]`) that must be DONE before this task can be activated.
- **id**: `OPTIONAL` - Redundant with filename, kept for potential future tooling
- **title**: `OPTIONAL` - Redundant with markdown header, kept for metadata queries
- **owner**: `OPTIONAL` - Not currently used by scripts, available for future dashboards
- **priority**: `OPTIONAL` - Not currently used by scripts, available for future filtering

## Naming Convention

All task files MUST follow: `T-###_description-in-kebab-case.md`

Examples: `T-001_login-navigation.md`, `T-007_checkout-step1.md`

## Why the Duplication?

You'll notice the task ID and title appear in both YAML and the markdown header:

- **YAML frontmatter** = Machine-readable (parsed by scripts)
- **Markdown header** = Human-readable (what you see when opening the file)

This separation ensures both automated tools and humans can work with these files effectively.

</details>

T-001: Automate Login Page Critical Path

## Objective

Automate the primary authentication flow for the e-commerce application.
We need to verify that a standard user can log in and that invalid credentials show an error.

## Context

- **Page Object:** `pages/LoginPage.ts` (Does not exist yet)
- **Test File:** `tests/auth.spec.ts`
- **Url:** `/login`

## Implementation Plan

1. [ ] Map `username`, `password`, and `login-button` using `data-test` attributes.
2. [ ] Implement `login(user, pass)` method in Page Object.
3. [ ] Write test: "Should redirect to inventory on success".
4. [ ] Write test: "Should show error on locked_out_user".

## Blockers & Error Logs

- None

## Acceptance Criteria

> (See Standard DoD in AGENTS.md)

- [ ] (Specific functional requirement)
- [ ] (Specific functional requirement)
