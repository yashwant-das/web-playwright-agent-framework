---
id: "T-010"
title: "Verify External Contact Form"
status: "BLOCKED"
owner: "AI"
priority: "High"
---

T-010: Verify External Contact Form

## Objective

Navigate to an external "Unknown World" website and verify the contact form functionality.
Target: `https://automationexercise.com/contact_us`

## Context

- **Page Object:** `pages/ContactPage.ts`
- **Test File:** `tests/external_contact.spec.ts`
- **Constraint:** This is an external site. You MUST use `@playwright/mcp` to explore it first as per `AGENTS.md`.

## Acceptance Criteria

> (See Standard DoD in AGENTS.md)

- [x] Use `@playwright/mcp` (or simulate it if unavailable) to map the page.
- [x] Upload a file during contact form submission.
- [x] Verify success message `Success! Your details have been submitted successfully.`
