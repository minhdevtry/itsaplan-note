# Kiến Trúc Hệ Thống & Vòng Lặp Phối Hợp Tự Chủ (Architecture)

## 1. Tổng Quan Kiến Trúc (High-Level Architecture)

Hệ thống kết hợp giữa 3 tầng chính:

```mermaid
flowchart TD
    subgraph UserInterface["1. Giao Diện Tương Tác"]
        Human["🧑‍💻 Bạn (Tech Lead / Product Owner)"]
        Chat["💬 Antigravity CLI Chat (Terminal / IDE)"]
        WebUI["🌐 It's a Plan Web (http://localhost:3001)"]
    end

    subgraph CentralServer["2. Máy Chủ Quản Trị Trung Tâm (Docker Compose)"]
        API["⚙️ Elysia API Backend (:3002)"]
        DB["🐘 PostgreSQL 17 (Queue & Data Store)"]
        MCP["🔌 MCP Streamable Endpoint (/mcp)"]
        Worker["🔄 Background Worker (Schedules & Outbound)"]
    end

    subgraph LocalRunner["3. Đội Ngũ Thực Thi Ngầm Trên Máy (itsaplan-runner)"]
        Runner["🚀 itsaplan-runner Daemon (concurrency: 3)"]
        TriageBot["🏷️ @triage-bot (Sơ tuyển & Lọc rác)"]
        PlannerBot["📋 @planner-bot (Phân rã Tracer Bullets)"]
        DevBot["💻 @dev-bot (Lập trình TDD Red-Green-Refactor)"]
        ReviewBot["🔍 @review-bot (Tidy & Code Review)"]
    end

    Human <-->|Brainstorm / Ra đề bài| Chat
    Human <-->|Xem Kanban / Inbox| WebUI
    Chat <-->|Gọi MCP create_issue / link_issues| MCP
    MCP <--> API <--> DB
    Worker <--> DB
    Runner <-->|Polling 3000ms qua HTTP| API
    Runner -->|Spawn| TriageBot
    Runner -->|Spawn| PlannerBot
    Runner -->|Spawn| DevBot
    Runner -->|Spawn| ReviewBot
```

---

## 2. Đội Ngũ 4 AI Agent & Phân Vai

| # | Agent Name | Username | Trigger Cơ Bản | Nhiệm vụ chính & Skill |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Triage Bot** | `@triage-bot` | Cron Schedule hoặc gán Delegate | **Skill `triage`**: Quét issue mới. Nếu thiếu thông tin $\rightarrow$ gắn `needs-info` + comment hỏi vào Inbox của User. Nếu đủ tin $\rightarrow$ gắn `ready-for-agent` + viết Agent Brief + gán `delegateUserId = dev-bot`. |
| 2 | **Planner Bot** | `@planner-bot` | Lệnh `/to-tickets` trong chat | **Skill `to-tickets`**: Phân rã tính năng lớn thành chuỗi các subtasks độc lập (Tracer Bullets), tạo quan hệ phụ thuộc (`link_issues: blocked_by`), và gán `delegateUserId = dev-bot` cho task đầu tiên. |
| 3 | **Dev Bot** | `@dev-bot` | Gán `delegateUserId = dev-bot` | **Skill `tdd`**: Đổi status sang `In Progress`, viết test (Red) $\rightarrow$ viết code tối giản (Green) $\rightarrow$ Refactor. Pass 100% test thì comment báo cáo và gán `delegateUserId = review-bot` cho Issue cha. |
| 4 | **Review Bot** | `@review-bot` | Gán `delegateUserId = review-bot` | **Skill `code-review` & `tidy`**: Tự động dọn dẹp code thừa (`tidy`) $\rightarrow$ Soi diff 2 trục Standards & Spec $\rightarrow$ Nếu Đạt: báo cáo `APPROVED ✅` & gán lại cho Bạn; Nếu Lỗi: báo `CHANGES REQUESTED ⚠️` & gán lại cho `dev-bot` sửa. |

---

## 3. Quy Trình Phối Hợp Khép Kín (End-to-End Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor You as 🧑‍💻 Bạn (Tech Lead)
    participant Chat as 💬 Chat Antigravity
    participant Plan as 📋 It's a Plan (MCP Server)
    participant Runner as 🚀 itsaplan-runner
    participant Dev as 💻 @dev-bot
    participant Rev as 🔍 @review-bot

    Note over You,Chat: Giai đoạn 1: Brainstorming & Chốt Spec
    You->>Chat: Thảo luận ý tưởng / giải pháp
    Chat-->>You: Trình bày kiến trúc & giải pháp
    You->>Chat: /to-tickets "Làm tính năng X"

    Note over Chat,Plan: Giai đoạn 2: Tự động phân rã & Đẩy Subtasks
    Chat->>Plan: Gọi create_issue (Tạo TP-2 -> TP-6 kèm delegateUserId = dev-bot)
    Chat->>Plan: Gọi link_issues (Thiết lập quan hệ phụ thuộc blocked_by)

    Note over Plan,Dev: Giai đoạn 3: Dev Bot chạy ngầm TDD
    Plan->>Runner: Issue TP-2 gán delegate = dev-bot
    Runner->>Dev: Spawn Dev Bot thực thi
    Dev->>Plan: Chuyển TP-2 sang "In Progress"
    Dev->>Dev: Viết test Red -> Code Green -> Refactor
    Dev->>Plan: Chuyển TP-2 sang "Done"
    Dev->>Dev: Lần lượt hoàn thành TP-3 -> TP-6
    Dev->>Plan: Khi xong 5/5 subtasks -> Gán issue cha TP-1 cho @review-bot

    Note over Plan,Rev: Giai đoạn 4: Review Bot thẩm định tổng thể
    Plan->>Runner: Issue TP-1 gán delegate = review-bot
    Runner->>Rev: Spawn Review Bot thực thi
    Rev->>Rev: 1. Chạy tidy (Dọn dead code, log rác, format)
    Rev->>Rev: 2. Chạy test suite & soi diff 2 trục
    Rev->>Plan: Comment báo cáo "Review Summary: APPROVED ✅"
    Rev->>Plan: Gán lại TP-1 cho Bạn

    Note over You,Plan: Giai đoạn 5: Nghiệm thu
    You->>Plan: Xem báo cáo trên Web / Inbox và bấm Done!
```

---

## 4. Các Cơ Chế Kỹ Thuật Then Chốt

### A. Phân biệt `assigneeUserId` vs `delegateUserId`
* **`assigneeUserId`**: Dành cho **Thành viên con người** (ví dụ `minh`).
* **`delegateUserId`**: Dành cho **AI Agent** (`dev-bot`, `review-bot`). Khi trường này được set, hệ thống mới tự động gọi hàm `enqueueDelegateRun` để đẩy task vào hàng đợi cho runner claim!

### B. Cơ chế Chống Vòng Lặp Vô Tận (Anti-Infinite Loop Guard)
* Mã nguồn `apps/api/src/modules/issues/activity.ts` (dòng 318) chặn không cho comment do Bot viết tự kích hoạt Bot khác qua `@mention`.
* Do đó, các Bot **chuyển giao công việc bằng cách cập nhật trường `delegateUserId` qua tool `update_issue`**.

### C. Cơ chế Concurrency & Khóa Hàng Đợi Nguyên Tử
* PostgreSQL sử dụng lệnh `FOR UPDATE SKIP LOCKED` trong bảng `agent_run`.
* Đảm bảo không bao giờ có 2 tiến trình claim trùng 1 task.
* `itsaplan-runner` cấu hình `concurrency: 3` cho phép chạy song song tối đa 3 task độc lập mà không làm đơ máy.
