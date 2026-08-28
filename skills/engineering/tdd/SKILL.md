---
name: tdd
description: Test-driven development. Use when building features or fixing bugs test-first (red-green-refactor) with automatic It's a Plan lifecycle tracking.
---

# Test-Driven Development (It's a Plan Native)

TDD is the red → green loop. This skill guides the implementation cycle when `@dev-bot` or an engineer builds features or fixes bugs.

## It's a Plan Ticket Lifecycle (When executing as an Agent)

1. **Claim Task:**
   - Call MCP `update_issue` to set status / column to `In Progress` (or started column).
   - Read the **Agent Brief** in the issue description and comments for Acceptance Criteria.

2. **TDD Implementation Loop:**
   - **Seam Selection:** Identify public interface boundaries (API, service methods, schema).
   - **Red (Failing Test):** Write test verifying expected behavior against the public interface. Run test to verify it fails with the expected assertion failure.
   - **Green (Minimal Code):** Write minimal implementation code to pass the test. Run test suite to verify green.
   - **Refactor / Tidy:** Simplify code, remove dead code, maintain KISS/YAGNI principles.
   - Repeat per vertical slice until all acceptance criteria are met.

3. **Handover & Completion:**
   - Run full test suite (`bun run test` / `npm test`) to ensure zero regressions.
   - Call MCP `add_comment` posting a summary of changes, verified tests, and evidence.
   - Call MCP `update_issue` to set `assigneeUserId` to **`review-bot`** (or human maintainer) and move status towards review / completion.

---

## What a good test is

Tests verify behavior through public interfaces, not implementation details. A good test reads like a specification: `"user can checkout with valid cart"`.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-patterns

- **Implementation-coupled**: Mocking internals or testing private methods.
- **Tautological**: Recomputing expected values in the test the same way as the code.
- **Horizontal slicing**: Writing all tests first in bulk before any code. Always work in vertical slices.

## Rules of the loop

- **Red before green**: Always write and run the failing test before writing implementation.
- **One slice at a time**: One seam, one test, one minimal implementation per cycle.
- **Evidence before assertions**: Confirm test outputs before claiming success.
