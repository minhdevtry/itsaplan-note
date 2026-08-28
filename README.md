# It's a Plan & Antigravity AI Team Architecture Note

Kho lưu trữ tài liệu, quy tắc (Rules), kỹ năng (Skills) và mẫu cấu hình cho hệ thống **Đội ngũ 4 AI Agents Tự Chủ (Autonomous AI Team)** phối hợp giữa **It's a Plan** và **Antigravity CLI (`agy`)**.

---

## 📂 Cấu Trúc Kho Lưu Trữ

```
.
├── docs/                      # Tài liệu chi tiết từ A-Z
│   ├── ARCHITECTURE.md        # Kiến trúc 3 tầng, phân vai 4 Bot & Sequence Diagrams
│   ├── SETUP_GUIDE.md         # Hướng dẫn thiết lập hệ thống từng bước
│   ├── CONFIG_REFERENCE.md    # Tham chiếu toàn bộ file cấu hình chuẩn
│   ├── SKILLS_AND_RULES.md    # Chi tiết 4 Skill cốt lõi và quy tắc vận hành
│   └── README.md              # Mục lục tài liệu
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

---

## 🚀 Hướng Dẫn Nhanh Cho AI Agent Khi Setup Máy Mới

Bất kỳ AI Agent nào khi được giao nhiệm vụ thiết lập hệ thống này:
1. Đọc [**docs/SETUP_GUIDE.md**](./docs/SETUP_GUIDE.md) để nắm các bước khởi chạy Docker & Runner.
2. Đọc [**docs/CONFIG_REFERENCE.md**](./docs/CONFIG_REFERENCE.md) để sao chép các file cấu hình vào đúng đường dẫn.
3. Sao chép thư mục `skills/` vào `~/.gemini/config/skills/`.
4. Sao chép `rules/itsaplan.md` vào `~/.gemini/config/rules/itsaplan.md`.
