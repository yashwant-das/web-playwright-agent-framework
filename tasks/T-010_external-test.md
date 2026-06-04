---
id: "T-010"
title: "Verify External Contact Form"
status: "BLOCKED"
blockReason: "verification"
dependsOn: []
---

T-010: Verify External Contact Form

## Understanding

Feature: External Contact Form
Expected Behavior: Users can submit inquiries via an external contact form with attachments.
Business Outcome: External communication channel remains functional for lead generation.
Risk: External site changes could break our selectors.

## Context

- **Page Object:** `pages/ContactPage.ts`
- **Test File:** `tests/external_contact.spec.ts`
- **URL:** `https://automationexercise.com/contact_us`

## Implementation Plan

1. Explore external page using Playwright MCP to identify selectors.
2. Implement `ContactPage` with JSDoc metadata.
3. Handle file upload dialog and submission.
4. Verify success message presence.

## Acceptance Criteria

- [x] Use `@playwright/mcp` to map the page.
- [x] Upload a file during contact form submission.
- [x] Verify success message `Success! Your details have been submitted successfully.`
