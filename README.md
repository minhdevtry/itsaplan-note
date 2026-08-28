# It's a Plan & Antigravity AI Team Architecture Note

Kho lưu trữ tài liệu, quy tắc (Rules), kỹ năng (Skills), công cụ tự động hóa (Scripts) và mẫu cấu hình cho hệ thống **Đội ngũ 4 AI Agents Tự Chủ (Autonomous AI Team)** phối hợp giữa **It's a Plan** và **Antigravity CLI (`agy`)**.

---

## ⚡ Bắt Đầu Nhanh (Dành Cho AI Agent hoặc Setup Máy Mới)

Nếu bạn là AI Agent (hoặc Developer dựng môi trường mới):
1. **Đọc tài liệu điều phối:** Xem [**`AGENTS.md`**](./AGENTS.md) để nắm quy trình tự động hóa 100%.
2. **Cài đặt Rules & Skills vào máy trạm:**
   ```bash
   ./scripts/install-agent-environment.sh
   ```
3. **Tự động tạo 4 Bot & 4 Nhãn trên Server (Cục bộ hoặc Từ xa):**
   ```bash
   bun scripts/bootstrap-team.ts --url http://localhost:3002 --project TP --cwd /path/to/your/code-repo
   ```
4. **Khởi chạy Runner ngầm:**
   ```bash
   itsaplan-runner > ~/.itsaplan-runner.log 2>&1 &
   ```

---

## 📂 Cấu Trúc Kho Lưu Trữ

```
.
├── AGENTS.md                  # Hướng dẫn tự động thiết lập từ A-Z cho AI Agent
├── README.md                  # Giới thiệu tổng quan
├── docs/                      # Tài liệu chi tiết từ A-Z
│   ├── ARCHITECTURE.md        # Kiến trúc 3 tầng, phân vai 4 Bot & Sequence Diagrams
│   ├── SETUP_GUIDE.md         # Hướng dẫn thiết lập hệ thống chi tiết
│   ├── CONFIG_REFERENCE.md    # Tham chiếu toàn bộ file cấu hình chuẩn & API Keys
│   ├── SKILLS_AND_RULES.md    # Chi tiết 4 Skill cốt lõi và quy tắc vận hành
│   └── README.md              # Mục lục tài liệu
│
├── scripts/                   # Bộ công cụ tự động hóa cài đặt
│   ├── bootstrap-team.ts      # Script tự động tạo 4 Bot, 4 Nhãn, và sinh file config
│   └── install-agent-environment.sh # Script sao chép skills và rules vào Antigravity
│
├── rules/                     # Rule Global nạp cho Agent CLI
│   └── itsaplan.md            # Quy tắc giao tiếp MCP, phân định Assignee/Delegate
│
├── skills/                    # Bộ 37 Kỹ năng AI (Matt Pocock + Tối ưu hóa cho It's a Plan)
│   ├── engineering/           # triage, to-tickets, tdd, code-review, diagnosing-bugs...
│   ├── productivity/          # grill-me, grilling, handoff, writing-for-agents...
│   └── misc/                  # git-guardrails, setup-pre-commit...
│
└── templates/                 # Mẫu cấu hình nhanh
    ├── itsaplan-runner.example.json # Mẫu file runner cho 4 Bot
    ├── mcp_config.example.json      # Mẫu file MCP server
    └── .env.example                 # Mẫu biến môi trường Docker Compose
```

---

## 🤖 Đội Ngũ 4 AI Agent

| Bot | Username | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Triage Bot** | `@triage-bot` | Quét & phân loại issue. Thiếu tin $\rightarrow$ comment hỏi vào Inbox; Đủ tin $\rightarrow$ gắn `ready-for-agent` + gán `delegate = dev-bot`. |
| **Planner Bot** | `@planner-bot` | Phân rã tính năng lớn thành subtask (Tracer Bullets), nối `blocked_by` và gán `delegate = dev-bot`. |
| **Dev Bot** | `@dev-bot` | Lập trình theo chuẩn TDD (Red $\rightarrow$ Green $\rightarrow$ Refactor), pass 100% test $\rightarrow$ gán `delegate = review-bot`. |
| **Review Bot** | `@review-bot` | Tự động dọn dẹp code (`tidy`) $\rightarrow$ Thẩm định 2 trục (Standards & Spec) $\rightarrow$ Báo cáo `APPROVED` / `CHANGES REQUESTED`. |
