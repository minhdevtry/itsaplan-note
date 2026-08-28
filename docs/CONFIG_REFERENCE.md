# Tham Chiếu Cấu Hình Chi Tiết (Configuration Reference)

Tài liệu này chứa toàn bộ mẫu cấu hình chính xác của hệ thống để sao chép hoặc kiểm tra khi cần thiết.

---

## 1. File Cấu Hình Runner: `itsaplan-runner.json`

Vị trí: Nằm ngay tại thư mục gốc của repository làm việc (`/path/to/repo/itsaplan-runner.json`).

```json
{
  "url": "http://localhost:3002",
  "agent": "antigravity",
  "concurrency": 3,
  "pollIntervalMs": 3000,
  "cwd": "/home/minhdn3/Documents/test-chat",
  "agents": [
    {
      "name": "Triage Bot",
      "apiKey": "itp_VhyzYjSbFwGKqJESDyobJKwzOzqEksObRsXyyNtUiHVbyOkWalrwLzPfrONXYgXH"
    },
    {
      "name": "Dev Bot",
      "apiKey": "itp_akQnQRuYmreUTnYwvxWGEhPOnTooRQHLQwuiqdCcPYFKbgOOvMzWbFIGvmqHJixf"
    },
    {
      "name": "Review Bot",
      "apiKey": "itp_FcpyhqcVVXhQeolkcEPBVpPanAzDvJNRLLomZlHFIeOQhBSAruPLtMkHxFamImrV"
    },
    {
      "name": "Planner Bot",
      "apiKey": "itp_UqjnlgeUJJkwhLSKGRzKmbwjLbvbCrEyaNWXPoysLcvhIrTiEQGoaZgWmcDgKAum"
    }
  ]
}
```

* **`url`**: Endpoint của backend API It's a Plan (mặc định port 3002).
* **`agent`**: Tên CLI preset (`antigravity`).
* **`concurrency`**: Số lượng tác vụ chạy song song tối đa (khuyên dùng `3`).
* **`pollIntervalMs`**: Chu kỳ runner hỏi server tìm task mới (`3000` = 3 giây).
* **`cwd`**: Thư mục repo mã nguồn mà bot sẽ thao tác đọc/ghi file và chạy test.

---

## 2. File Cấu Hình MCP: `~/.gemini/config/mcp_config.json`

Vị trí: `~/.gemini/config/mcp_config.json` (dành cho Antigravity CLI).

```json
{
  "mcpServers": {
    "itsaplan": {
      "serverUrl": "http://localhost:3002/mcp",
      "headers": {
        "Authorization": "Bearer itp_VhyzYjSbFwGKqJESDyobJKwzOzqEksObRsXyyNtUiHVbyOkWalrwLzPfrONXYgXH"
      }
    }
  }
}
```

---

## 3. File Rule Global: `~/.gemini/config/rules/itsaplan.md`

Vị trí: `~/.gemini/config/rules/itsaplan.md`

```markdown
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
```

---

## 4. File Biến Môi Trường: `.env`

Vị trí: Thư mục gốc dự án `test-chat/.env`

```env
API_PORT=3002
WEB_PORT=3001
API_URL=http://localhost:3002
APP_URL=http://localhost:3001
DATABASE_URL=postgres://itsaplan:itsaplan_db_sec_x7k9Q2wE4rT8yU1i@postgres:5432/itsaplan
BETTER_AUTH_SECRET=0lQ3d4X4j3v0H...
APP_ENCRYPTION_KEY=1e7b2b8c9d...
WORKER_INTERNAL_TOKEN=9f8e7d...
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=itsaplan
S3_SECRET_ACCESS_KEY=itsaplan_minio_sec_...
S3_BUCKET=itsaplan
```
