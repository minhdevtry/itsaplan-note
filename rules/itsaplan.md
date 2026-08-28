# It's a Plan Agent Rules

When interacting with It's a Plan via MCP tools, follow these strict rules:

## 1. Resolving IDs & Entities
- Given a ticket key "KEY-42", call `get_issue_by_number` directly (projectKey: "KEY", sequenceNumber: 42).
- Never guess numeric IDs. Always call `get_project(projectKey)` to resolve `columnId`, `labelIds`, and assignees.
- **Assignee vs Delegate:**
  - `assigneeUserId`: For the human member responsible for the issue (where `kind === 'member'`).
  - `delegateUserId`: For the AI Agent executing the task (where `kind === 'agent'`).
  - **CRITICAL:** When handing off or assigning work to an AI Agent (`dev-bot`, `review-bot`, etc.), ALWAYS set `delegateUserId` (via `create_issue` or `update_issue`). Setting `delegateUserId` is what automatically triggers the agent runner to execute the task.
- Always select columns by `stateType` (`unstarted`, `started`, `completed`, `canceled`), never by column name.

## 2. Bot Roles & Handoff Pipeline
- **Triage (@triage-bot):**
  - If issue lacks reproduction steps, logs, or clear spec: Apply label `needs-info`, remove `needs-triage`, and comment specific questions (automatically notifies the user's Inbox).
  - If issue is fully specified: Apply label `ready-for-agent`, remove `needs-triage`, post an Agent Brief in comments, and call `update_issue` to set `delegateUserId` to `dev-bot`'s user id.
- **Planning (@planner-bot):**
  - Break down large features into vertical slice issues via `create_issue` (using `parentIssueId` for subtasks).
  - Create dependency edges using `link_issues` with `relationType: "blocked_by"` (or `"blocks"`).
  - Mark independent slices ready to start with label `ready-for-agent` and set `delegateUserId` to `dev-bot`'s user id.
- **Development (@dev-bot):**
  - Move issue to column with `stateType: "started"` before writing code.
  - Follow TDD (Red -> Green -> Refactor) at pre-agreed seams. Run tests to verify green.
  - When done: Post test verification summary in comment.
    - For standalone tasks: Set `delegateUserId` to `review-bot`'s user id.
    - For subtasks: When the final subtask of a parent issue completes, set `delegateUserId` of the parent issue to `review-bot`'s user id.
- **Review (@review-bot):**
  - **Step 1 (Tidy):** Clean up formatting, dead code, and debug logs without changing business logic.
  - **Step 2 (Two-Axis Review):** Run test suite and inspect git diff along Standards (clean code, KISS/YAGNI) and Spec (acceptance criteria fidelity).
  - **Step 3 (Outcome):**
    - If APPROVED: Post approval report in comments, move issue to `completed` column, and clear `delegateUserId` (or assign back to human maintainer).
    - If CHANGES REQUESTED: Post specific feedback (files, line numbers, failing criteria) in comments, and set `delegateUserId` back to `dev-bot` for automated rework.

## 3. Communication & Safety
- **Delegation:** Bots delegate work by updating `delegateUserId` via `update_issue`, never by tagging each other in comments.
- **Human Mentions:** When a human user @mentions an agent in a comment, the agent must address that specific request directly.
- **Evidence over Assertions:** Always run the project's test suite (`bun test`, `npm test`, etc.) and verify outputs before marking a task complete.
- **Restraint:** Keep comments concise, factual, and strictly focused on requirements, reproduction steps, or test results.
