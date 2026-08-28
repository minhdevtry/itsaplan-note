# Hướng Dẫn Thiết Lập Hệ Thống Từ A Đến Z (Setup Guide)

Tài liệu này hướng dẫn chi tiết từng bước để cài đặt và kích hoạt hệ thống **It's a Plan + Antigravity Multi-Agent Runner** trên một máy tính mới từ đầu.

---

## 🛠️ Bước 1: Khởi Chạy Máy Chủ It's a Plan (Docker Compose)

1. Clone repo mã nguồn:
   ```bash
   git clone https://github.com/croffasia/itsaplan.git
   cd itsaplan
   ```

2. Tạo file `.env` (lưu ý đổi port nếu port 3000 bị trùng):
   ```bash
   # Tạo các secret 32-byte
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)
   APP_ENCRYPTION_KEY=$(openssl rand -hex 32)
   WORKER_INTERNAL_TOKEN=$(openssl rand -hex 32)
   S3_SECRET=$(openssl rand -hex 16)

   cat <<EOF > .env
   API_PORT=3002
   WEB_PORT=3001
   API_URL=http://localhost:3002
   APP_URL=http://localhost:3001
   DATABASE_URL=postgres://itsaplan:itsaplan_sec_password@postgres:5432/itsaplan
   BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
   APP_ENCRYPTION_KEY=${APP_ENCRYPTION_KEY}
   WORKER_INTERNAL_TOKEN=${WORKER_INTERNAL_TOKEN}
   S3_ENDPOINT=http://minio:9000
   S3_ACCESS_KEY_ID=itsaplan
   S3_SECRET_ACCESS_KEY=${S3_SECRET}
   S3_BUCKET=itsaplan
   EOF
   ```

3. Khởi chạy toàn bộ stack:
   ```bash
   docker compose pull
   docker compose up -d
   ```
   * Web UI: [http://localhost:3001](http://localhost:3001)
   * API Backend: [http://localhost:3002](http://localhost:3002)

4. Mở trình duyệt [http://localhost:3001](http://localhost:3001), đăng ký tài khoản đầu tiên (tự động nhận quyền `god`/owner), và tạo một dự án (ví dụ mã dự án `TP` - Test Project). Bật tính năng **MCP Server** trong Project Settings.

---

## 🤖 Bước 2: Tạo 4 AI Agents Trên Hệ Thống

Chạy lệnh hoặc script để tạo 4 AI Bot vào bảng `ai_agent` của dự án (`projectId: 1`):
1. **`triage-bot`** (Triage Bot)
2. **`planner-bot`** (Planner Bot)
3. **`dev-bot`** (Dev Bot)
4. **`review-bot`** (Review Bot)

Lưu lại 4 mã API Key (`itp_...`) được cấp cho 4 Bot.

---

## 🏷️ Bước 3: Khởi Tạo 4 Nhãn Triage Trên Dự Án

Thêm 4 nhãn cần thiết vào bảng `label` của dự án:
```sql
INSERT INTO label (project_id, name, color) VALUES 
(1, 'needs-triage', '#3b82f6'),
(1, 'needs-info', '#f97316'),
(1, 'ready-for-agent', '#8b5cf6'),
(1, 'ready-for-human', '#22c55e');
```

---

## 🚀 Bước 4: Cài Đặt & Cấu Hình Runner (`itsaplan-runner`)

1. Build gói runner từ mã nguồn:
   ```bash
   cd packages/runner
   bun run build
   # Tạo symlink vào PATH
   ln -sf $(pwd)/dist/cli.js ~/.local/bin/itsaplan-runner
   chmod +x ~/.local/bin/itsaplan-runner
   ```

2. Tạo file `itsaplan-runner.json` tại thư mục làm việc (điền 4 API Key của 4 bot):
   ```json
   {
     "url": "http://localhost:3002",
     "agent": "antigravity",
     "concurrency": 3,
     "pollIntervalMs": 3000,
     "cwd": "/path/to/source-code-repo",
     "agents": [
       { "name": "Triage Bot", "apiKey": "itp_Key1..." },
       { "name": "Dev Bot", "apiKey": "itp_Key2..." },
       { "name": "Review Bot", "apiKey": "itp_Key3..." },
       { "name": "Planner Bot", "apiKey": "itp_Key4..." }
     ]
   }
   ```

3. Cấu hình MCP Server cho Antigravity CLI tại `~/.gemini/config/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "itsaplan": {
         "serverUrl": "http://localhost:3002/mcp",
         "headers": {
           "Authorization": "Bearer itp_Key1..."
         }
       }
     }
   }
   ```

---

## 📜 Bước 5: Cài Đặt Bộ Rule & Skills Global

1. Tạo file Rule Global tại `~/.gemini/config/rules/itsaplan.md` (xem nội dung trong `CONFIG_REFERENCE.md`).
2. Đồng bộ thư mục skills vào `~/.gemini/config/skills/` (gồm `triage`, `to-tickets`, `tdd`, `code-review`, `diagnosing-bugs`...).

---

## ⚡ Bước 6: Khởi Chạy Runner Ngầm (Daemon)

Chạy tiến trình runner ngầm:
```bash
itsaplan-runner > ~/.itsaplan-runner.log 2>&1 &
```

Kiểm tra trên trang **[http://localhost:3001/project/TP/ai-agents](http://localhost:3001/project/TP/ai-agents)**: Cả 4 Bot đều hiển thị **Online 🟢**.

---

🎉 **Hệ thống đã sẵn sàng 100% để tự động nhận việc, phân rã, lập trình TDD và thẩm định chất lượng!**
