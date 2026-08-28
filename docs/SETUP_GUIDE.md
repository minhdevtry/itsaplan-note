# Hướng Dẫn Thiết Lập Hệ Thống Từ A Đến Z (Setup Guide)

Tài liệu này hướng dẫn chi tiết từng bước để cài đặt và kích hoạt hệ thống **It's a Plan + Antigravity Multi-Agent Runner** trên một máy tính mới hoặc kết nối tới một máy chủ It's a Plan khác.

---

## 🚀 Cách 1: Tự Động Hóa 100% (Khuyên dùng cho AI Agent / Dev)

Nếu bạn vừa clone repository này sang máy mới:

```bash
# 1. Cài đặt toàn bộ Rules & Skills vào cấu hình máy trạm
./scripts/install-agent-environment.sh

# 2. Khởi tạo 4 Nhãn + 4 AI Bots trên máy chủ It's a Plan (tự động xuất itsaplan-runner.json)
# Thay đổi URL và PROJECT_KEY tùy theo server của bạn:
bun scripts/bootstrap-team.ts \
  --url http://localhost:3002 \
  --project TP \
  --cwd /path/to/source-code-repo

# 3. Khởi chạy tiến trình Runner ngầm
itsaplan-runner > ~/.itsaplan-runner.log 2>&1 &
```

---

## 🛠️ Cách 2: Thiết Lập Thủ Công Từng Bước (Manual Step-by-Step)

### Bước 1: Khởi Chạy Máy Chủ It's a Plan (Docker Compose)

*(Bỏ qua bước này nếu bạn đang kết nối tới một máy chủ It's a Plan có sẵn trên mạng nội bộ / cloud)*

1. Clone repo mã nguồn It's a Plan:
   ```bash
   git clone https://github.com/croffasia/itsaplan.git
   cd itsaplan
   ```

2. Tạo file `.env`:
   ```bash
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

4. Mở trình duyệt [http://localhost:3001](http://localhost:3001), đăng ký tài khoản đầu tiên (tự động nhận quyền `god`/owner), tạo một dự án (ví dụ mã `TP` - Test Project) và bật tính năng **MCP Server** trong Project Settings.

---

### Bước 2: Tạo 4 Nhãn Phân Luồng (Triage Labels)

Vào Web UI (**Project Settings $\rightarrow$ Labels**) hoặc chạy tool MCP `create_label` để tạo 4 nhãn:
* `needs-triage` (Màu: `#3b82f6`)
* `needs-info` (Màu: `#f97316`)
* `ready-for-agent` (Màu: `#8b5cf6`)
* `ready-for-human` (Màu: `#22c55e`)

---

### Bước 3: Tạo 4 AI Agents Trên Hệ Thống

Vào Web UI (**Project Settings $\rightarrow$ AI Agents**) hoặc chạy `bun scripts/bootstrap-team.ts` để tạo 4 bot:
1. **`triage-bot`** (Triage Bot, `kind: external`, `runnerScope: project`)
2. **`planner-bot`** (Planner Bot, `kind: external`, `runnerScope: project`)
3. **`dev-bot`** (Dev Bot, `kind: external`, `runnerScope: project`)
4. **`review-bot`** (Review Bot, `kind: external`, `runnerScope: project`)

*(Lưu lại 4 API Keys `itp_...` vừa tạo để điền vào file Runner)*

---

### Bước 4: Cài Đặt & Cấu Hình Runner (`itsaplan-runner`)

1. Build gói runner từ mã nguồn:
   ```bash
   cd packages/runner
   bun run build
   # Tạo symlink vào PATH
   ln -sf $(pwd)/dist/cli.js ~/.local/bin/itsaplan-runner
   chmod +x ~/.local/bin/itsaplan-runner
   ```

2. Tạo file `itsaplan-runner.json` tại thư mục làm việc của repo code:
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

### Bước 5: Cài Đặt Bộ Rule & Skills Global

1. Sao chép `rules/itsaplan.md` vào `~/.gemini/config/rules/itsaplan.md`.
2. Sao chép toàn bộ thư mục `skills/` vào `~/.gemini/config/skills/`.

---

### Bước 6: Khởi Chạy Runner Ngầm (Daemon)

Chạy tiến trình runner ngầm:
```bash
itsaplan-runner > ~/.itsaplan-runner.log 2>&1 &
```

Kiểm tra trên trang **[http://localhost:3001/project/TP/ai-agents](http://localhost:3001/project/TP/ai-agents)**: Cả 4 Bot đều hiển thị **Online 🟢**.

---

## 🌐 Thiết Lập Kết Nối Đến Server Khác / Remote Server

Khi bạn chuyển sang làm việc với một server It's a Plan khác (ví dụ `https://plan.company.internal`):
1. Lấy mã dự án (`projectKey`) và Token xác thực trên server đó.
2. Chạy lệnh:
   ```bash
   bun scripts/bootstrap-team.ts \
     --url https://plan.company.internal \
     --project PROJ \
     --token <YOUR_TOKEN> \
     --cwd /path/to/project-repo
   ```
3. Khởi động lại `itsaplan-runner`.
