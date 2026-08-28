---
name: to-tickets
description: Break a plan, spec, or conversation into vertical-slice tracer bullet tickets on It's a Plan with native blocking relationships and agent briefs.
disable-model-invocation: true
---

# To Tickets (It's a Plan Native)

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it on **It's a Plan**.

## Process

### 1. Gather Context & Explore Codebase
- Read the conversation context or target spec/ADR.
- Explore the local codebase to align vocabulary, interfaces, and architecture.
- Identify prefactoring opportunities ("Make the change easy, then make the easy change").

### 2. Draft Vertical Slices (Tracer Bullets)
- **Vertical**: Each slice cuts through schema, API, UI, and tests end-to-end.
- **Demoable / Verifiable**: Each slice can be tested independently.
- **Sized for one context window**: Fits comfortably in a single AI implementation cycle.
- **Declare Blocking Edges**: Identify which tickets depend on others.

### 3. Review Granularity with User (Interactive Mode)
When in interactive chat with the user, present the proposed breakdown:
- **Title**: Short, descriptive name.
- **Blocked by**: Blockers that must complete first.
- **What it delivers**: End-to-end functionality from the user perspective.
Confirm granularity before publishing.

### 4. Publish Tickets to It's a Plan via MCP

Use It's a Plan MCP tools to publish:

1. **Resolve IDs from It's a Plan:**
   - Call `get_project(projectKey)` to resolve column IDs, label IDs, and agent user IDs (`dev-bot`, `review-bot`).

2. **Create Parent / Child Issues:**
   - Call `create_issue` for each ticket in dependency order (blockers first).
   - Set description using the standard template:
     ```markdown
     ## What to build
     [End-to-end behavior delivered]

     ## Acceptance Criteria
     - [ ] Criterion 1
     - [ ] Criterion 2
     ```
   - If breaking down an existing feature issue, set `parentIssueId` to group them as subtasks.
   - For independent slices ready to be picked up immediately: Apply label `ready-for-agent` and **set `delegateUserId` to `dev-bot`'s user id**. Setting `delegateUserId` is what automatically triggers `dev-bot` on the runner!

3. **Establish Blocking Relationships:**
   - Call `link_issues` with:
     - `issueId`: The dependent ticket
     - `targetIssueId`: The blocking ticket
     - `relationType`: `"blocked_by"` (or `"blocks"` in reverse)

4. **Report to User:**
   - Output the created ticket keys (e.g. `TP-10`, `TP-11`, `TP-12`) with clickable links and dependency graph.
