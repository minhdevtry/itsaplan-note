# Hướng Dẫn Kiến Trúc & Thiết Lập Đội Ngũ AI Agent Tự Chủ (It's a Plan + Antigravity CLI)

Tài liệu này lưu trữ toàn bộ kiến trúc, quy trình làm việc, cấu hình và hướng dẫn thiết lập hệ thống **Đội ngũ 4 AI Agents tự chủ (Autonomous AI Team)** kết hợp giữa **It's a Plan** (Issue Tracker) và **Antigravity CLI (`agy`)** qua **`itsaplan-runner`** và **MCP**.

Tài liệu được thiết kế để bất kỳ AI Agent hoặc kỹ sư nào khi đọc qua đều có thể hiểu và tái lập toàn bộ hệ thống từ đầu một cách chuẩn xác 100%.

---

## 📑 Mục Lục Tài Liệu

1. [**ARCHITECTURE.md**](./ARCHITECTURE.md): Kiến trúc hệ thống, phân vai 4 Bot và vòng lặp làm việc tự động (Autonomous Pipeline).
2. [**SETUP_GUIDE.md**](./SETUP_GUIDE.md): Hướng dẫn từng bước từ cài đặt Docker, build Runner, nạp Skill đến khởi chạy hệ thống.
3. [**CONFIG_REFERENCE.md**](./CONFIG_REFERENCE.md): Mẫu toàn bộ file cấu hình (`itsaplan-runner.json`, `mcp_config.json`, `rules/itsaplan.md`, `.env`).
4. [**SKILLS_AND_RULES.md**](./SKILLS_AND_RULES.md): Chi tiết 4 kỹ năng cốt lõi (`triage`, `to-tickets`, `tdd`, `code-review`) và quy tắc chống lỗi vòng lặp.

---

## 🌟 Tóm Tắt Giá Trị Cốt Lõi

* **Tự chủ & Khép kín (End-to-End Autonomous):** Bạn chỉ cần ngồi trong Chat brainstorm ý tưởng $\rightarrow$ Gõ `/to-tickets` $\rightarrow$ Đội ngũ Bot tự động tạo subtasks, code TDD, chạy test, review chất lượng và nghiệm thu.
* **Không tốn công kéo thả:** 100% thao tác được điều khiển qua MCP Tool và cơ chế `delegateUserId`.
* **An toàn cho máy tính:** Kiểm soát luồng (`concurrency: 3`), chống xung đột Git, chống vòng lặp vô tận (Loop Guard).
* **Inbox thông minh:** Chỉ làm phiền người dùng khi thực sự thiếu thông tin (`needs-info`), còn lại tự động chạy ngầm 24/7.
