# Chi Tiết 4 Skill Cốt Lõi & Quy Tắc Vận Hành (Skills & Rules)

Tài liệu này giải thích chi tiết cơ chế hoạt động bên trong của 4 kỹ năng chủ lực được tinh chỉnh từ bộ kỹ năng của **Matt Pocock** để tương thích hoàn toàn với **It's a Plan**.

---

## 1. Skill `triage` (`skills/engineering/triage/SKILL.md`)

* **Mục đích:** Sơ tuyển, phân loại issue, viết Agent Brief chuẩn và chuyển giao tự động cho `dev-bot`.
* **Cơ chế 2 chế độ:**
  1. **Chế độ Tự chủ (Autonomous Mode):** `@triage-bot` tự quét các issue mới.
     * Nếu thiếu thông tin/log/bước tái hiện $\rightarrow$ Gắn nhãn `needs-info`, gỡ `needs-triage`, và comment câu hỏi cụ thể $\rightarrow$ Tự động đẩy thông báo vào **Inbox** của người dùng.
     * Nếu đủ thông tin $\rightarrow$ Gắn nhãn `ready-for-agent`, gỡ `needs-triage`, viết **Agent Brief** chuẩn vào comment, và gọi `update_issue` gán `delegateUserId = dev-bot` để kích hoạt Dev Bot.
     * Nếu không phù hợp $\rightarrow$ Đổi trạng thái sang `canceled` kèm giải thích.
  2. **Chế độ Tương tác (Interactive Mode):** Người dùng gõ `/triage` trong cửa sổ chat để cùng AI rà soát nhanh backlog.

---

## 2. Skill `to-tickets` (`skills/engineering/to-tickets/SKILL.md`)

* **Mục đích:** Phân rã một tính năng lớn (Spec) thành các lát cắt dọc độc lập (**Tracer Bullets** / **Vertical Slices**).
* **Quy tắc phân rã:**
  * Mỗi ticket con phải cắt qua đủ các tầng (schema, API, UI, tests).
  * Kích thước vừa vặn trong 1 context window của AI.
  * Tự động gọi MCP `create_issue` tạo subtask với `parentId` trỏ về Issue cha.
  * Tự động gọi MCP `link_issues` thiết lập quan hệ phụ thuộc (`relationType: "blocked_by"`).
  * Với các subtask độc lập đầu tiên: Tự động gán nhãn `ready-for-agent` và gán **`delegateUserId = dev-bot`** để kích hoạt Dev Bot làm việc ngay.

---

## 3. Skill `tdd` (`skills/engineering/tdd/SKILL.md`)

* **Mục đích:** Hướng dẫn `@dev-bot` lập trình theo phương pháp Test-Driven Development chuẩn kỹ thuật.
* **Vòng lặp TDD (Red $\rightarrow$ Green $\rightarrow$ Refactor):**
  1. **Nhận việc:** Kéo issue sang trạng thái `In Progress`. Đọc Acceptance Criteria trong Agent Brief.
  2. **Red (Test đỏ):** Chọn điểm biên công khai (Public seam), viết bài test kiểm thử hành vi mong muốn và chạy thử để thấy test fail.
  3. **Green (Code xanh):** Viết mã nguồn tối giản nhất chỉ vừa đủ để pass bài test. Chạy test kiểm tra xanh.
  4. **Refactor / Tidy:** Tối ưu hóa mã nguồn, tuân thủ nghiêm ngặt nguyên tắc KISS & YAGNI.
  5. **Nghiệm thu:** Chạy toàn bộ test suite pass 100%, comment báo cáo kết quả và:
     * Với task đơn lẻ: Gán `delegateUserId = review-bot`.
     * Với subtask: Khi subtask cuối cùng của Issue cha hoàn thành $\rightarrow$ Tự động gán `delegateUserId = review-bot` cho Issue cha.

---

## 4. Skill `code-review` & `tidy` (`skills/engineering/code-review/SKILL.md`)

* **Mục đích:** Thẩm định chất lượng toàn diện và dọn dẹp mã nguồn trước khi bàn giao cho người dùng.
* **Quy trình 3 bước của `@review-bot`:**
  1. **Bước 1 — Tự động Dọn dẹp (`tidy`):** Tự động format, xóa dead code, xóa các câu lệnh debug rác mà không làm thay đổi logic nghiệp vụ.
  2. **Bước 2 — Thẩm định 2 trục (`code-review`):**
     * **Trục Tiêu chuẩn (Standards):** Soi kỹ các lỗi "bốc mùi" (Code smells), độ sâu của module, bảo mật và quy ước repo.
     * **Trục Nghiệp vụ (Spec):** Đối chiếu xem toàn bộ Acceptance Criteria trong ticket đã có test case pass hay chưa.
  3. **Bước 3 — Kết luận & Bàn giao:**
     * **Nếu ĐẠT (`APPROVED ✅`):** Đăng báo cáo thẩm định vào comment, chuyển issue sang `Done` (hoặc gán lại cho Bạn duyệt).
     * **Nếu CÓ LỖI (`CHANGES REQUESTED ⚠️`):** Chỉ rõ file, dòng lỗi, tiêu chí bị thiếu trong comment và **gán lại `delegateUserId = dev-bot`** để Dev Bot tự động nhận lệnh sửa lại.

---

## 5. Quy Tắc Bất Di Bất Dịch (Golden Rules)

1. **Không Bot nào được tự tag Bot khác qua comment:** Luôn chuyển giao công việc bằng cách cập nhật trường **`delegateUserId`** qua tool `update_issue`.
2. **Luôn giải quyết ID động:** Luôn gọi `get_project(projectKey)` để lấy `columnId` (theo `stateType`), `labelIds` và `userId` của agent. Tuyệt đối không đoán mò ID.
3. **Bằng chứng trước kết luận (Evidence before assertions):** Luôn chạy lệnh kiểm thử thật và trích xuất kết quả thực tế vào comment trước khi đánh dấu hoàn thành.
