#!/usr/bin/env bun
/**
 * It's a Plan - 4 Autonomous AI Agents Bootstrap Script
 *
 * Tự động kết nối đến It's a Plan (máy chủ hiện tại hoặc máy chủ mới/từ xa),
 * khởi tạo 4 Nhãn (Labels), tạo 4 AI Bot (@triage-bot, @planner-bot, @dev-bot, @review-bot),
 * thu thập API Keys và sinh tự động các file cấu hình `itsaplan-runner.json` và `mcp_config.json`.
 *
 * Cách dùng:
 *   bun scripts/bootstrap-team.ts --url http://localhost:3002 --project TP --token itp_... --cwd /path/to/repo
 * Hoặc thông qua biến môi trường:
 *   ITPLAN_URL=http://localhost:3002 ITPLAN_PROJECT=TP ITPLAN_TOKEN=itp_... bun scripts/bootstrap-team.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// ==========================================
// 1. CẤU HÌNH 4 NHÃN (LABELS) CHUẨN
// ==========================================
const REQUIRED_LABELS = [
  { name: "needs-triage", color: "#3b82f6" },
  { name: "needs-info", color: "#f97316" },
  { name: "ready-for-agent", color: "#8b5cf6" },
  { name: "ready-for-human", color: "#22c55e" },
];

// ==========================================
// 2. CẤU HÌNH 4 AI BOT CHUẨN
// ==========================================
const BOT_DEFINITIONS = [
  {
    name: "Triage Bot",
    username: "triage-bot",
    kind: "external",
    runnerScope: "project",
    triggerOnMention: true,
    triggerOnAssign: true,
    delegationDelaySec: 60,
    instructions: `Bạn là Triage Bot, áp dụng skill triage để tự động rà soát và sơ tuyển issue trên It's a Plan:
1. Quét các issue mới chưa phân loại hoặc có phản hồi mới từ người dùng.
2. Nếu thiếu thông tin/log/bước tái hiện: Gắn nhãn needs-info, gỡ needs-triage, và comment câu hỏi cụ thể để báo vào Inbox cho user.
3. Nếu đủ thông tin: Gắn nhãn ready-for-agent, gỡ needs-triage, viết Agent Brief chuẩn vào comment và gán delegateUserId sang dev-bot để dev-bot tự động lập trình.
4. Nếu không phù hợp: Đổi trạng thái sang canceled kèm giải thích.`,
  },
  {
    name: "Planner Bot",
    username: "planner-bot",
    kind: "external",
    runnerScope: "project",
    triggerOnMention: true,
    triggerOnAssign: true,
    delegationDelaySec: 60,
    instructions: `Bạn là Planner Bot, chuyên gia phân rã tính năng (Spec) thành các issue/subtasks theo kỹ thuật Tracer Bullets (to-tickets):
1. Phân tích yêu cầu lớn thành chuỗi các ticket con độc lập, kiểm thử được ngay.
2. Tạo các subtasks qua tool create_issue (kèm parentIssueId và Acceptance Criteria rõ ràng).
3. Nối quan hệ phụ thuộc qua link_issues (relationType: "blocked_by").
4. Với các subtask độc lập có thể làm ngay: Gắn nhãn ready-for-agent và gán delegateUserId = dev-bot ngay lúc tạo.`,
  },
  {
    name: "Dev Bot",
    username: "dev-bot",
    kind: "external",
    runnerScope: "project",
    triggerOnMention: true,
    triggerOnAssign: true,
    delegationDelaySec: 60,
    instructions: `Bạn là Dev Bot, lập trình viên AI tuân thủ phương pháp Test-Driven Development (TDD) và Systematic Debugging:
1. Khi nhận task: Chuyển trạng thái sang In Progress. Đọc kỹ Acceptance Criteria và Agent Brief.
2. Viết test trước (Red) -> Viết code tối giản để pass test (Green) -> Tối ưu code (Refactor).
3. Đảm bảo chạy test suite thực tế pass 100%. Comment báo cáo kết quả kiểm thử vào issue.
4. Chuyển giao:
   - Với task đơn lẻ: Gán delegateUserId = review-bot để Review Bot thẩm định.
   - Với subtask: Khi subtask cuối cùng của issue cha hoàn thành, tự động gán delegateUserId = review-bot cho Issue cha để Review Bot thẩm định toàn bộ Feature.`,
  },
  {
    name: "Review Bot",
    username: "review-bot",
    kind: "external",
    runnerScope: "project",
    triggerOnMention: true,
    triggerOnAssign: true,
    delegationDelaySec: 60,
    instructions: `Bạn là Review Bot, chuyên gia thẩm định chất lượng mã nguồn (code-review & tidy):
1. Khi nhận task review:
   - Bước 1 (Tidy): Tự động dọn dẹp format, xóa log debug rác, xóa dead code mà không đổi logic.
   - Bước 2 (Review): Chạy toàn bộ test suite và soi diff theo 2 trục: Tiêu chuẩn mã nguồn (Standards) & Tiêu chí nghiệm thu (Spec).
2. Đăng comment báo cáo kết quả review:
   - Nếu ĐẠT (APPROVED): Chuyển issue sang Done (hoặc gán lại cho user nghiệm thu).
   - Nếu CÓ LỖI (CHANGES REQUESTED): Comment chỉ rõ file/dòng lỗi và gán lại delegateUserId = dev-bot để Dev Bot tự động sửa lại.`,
  },
];

// ==========================================
// 3. HÀM PHỤ TRỢ PARSE ARGS & MCP CLIENT
// ==========================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {
    url: process.env.ITPLAN_URL || "http://localhost:3002",
    project: process.env.ITPLAN_PROJECT || "TP",
    token: process.env.ITPLAN_TOKEN || "",
    cwd: process.env.ITPLAN_CWD || process.cwd(),
    outputRunner: process.env.ITPLAN_RUNNER_PATH || "./itsaplan-runner.json",
    outputMcp: process.env.ITPLAN_MCP_PATH || "./mcp_config.json",
    concurrency: process.env.ITPLAN_CONCURRENCY || "3",
    pollIntervalMs: process.env.ITPLAN_POLL_INTERVAL || "3000",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) options.url = args[++i];
    else if (arg === "--project" && args[i + 1]) options.project = args[++i];
    else if (arg === "--token" && args[i + 1]) options.token = args[++i];
    else if (arg === "--cwd" && args[i + 1]) options.cwd = args[++i];
    else if (arg === "--output-runner" && args[i + 1]) options.outputRunner = args[++i];
    else if (arg === "--output-mcp" && args[i + 1]) options.outputMcp = args[++i];
    else if (arg === "--concurrency" && args[i + 1]) options.concurrency = args[++i];
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🚀 It's a Plan - 4 AI Agents Team Bootstrap Tool

Cú pháp:
  bun scripts/bootstrap-team.ts [tuỳ chọn]

Tuỳ chọn:
  --url <url>             URL của API backend It's a Plan (mặc định: http://localhost:3002)
  --project <key>         Mã dự án (projectKey) cần cài đặt (mặc định: TP)
  --token <token>         Bearer token / API key của Admin hoặc Agent có quyền tạo bot
  --cwd <path>            Thư mục làm việc của code repository (mặc định: thư mục hiện tại)
  --output-runner <path>  Đường dẫn lưu file itsaplan-runner.json (mặc định: ./itsaplan-runner.json)
  --output-mcp <path>     Đường dẫn lưu file mcp_config.json (mặc định: ./mcp_config.json)
  --concurrency <num>     Số task chạy đồng thời tối đa của runner (mặc định: 3)
  --help, -h              Hiển thị hướng dẫn này
`);
}

class McpClient {
  private url: string;
  private token: string;
  private reqId = 1;

  constructor(serverUrl: string, token: string) {
    this.url = serverUrl.replace(/\/+$/, "") + "/mcp";
    this.token = token;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const payload = {
      jsonrpc: "2.0",
      id: this.reqId++,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (this.token) {
      headers["Authorization"] = this.token.startsWith("Bearer ")
        ? this.token
        : `Bearer ${this.token}`;
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`);
    }

    const rawText = await response.text();
    let jsonContent: any = null;
    const lines = rawText.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          jsonContent = JSON.parse(line.slice(6));
          break;
        } catch {
          // continue
        }
      }
    }

    if (!jsonContent) {
      try {
        jsonContent = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Không thể parse phản hồi từ MCP Server: ${rawText}`);
      }
    }

    if (jsonContent.error) {
      throw new Error(`MCP Error [${jsonContent.error.code}]: ${jsonContent.error.message}`);
    }

    const contentItem = jsonContent.result?.content?.[0];
    if (contentItem && contentItem.type === "text") {
      try {
        return JSON.parse(contentItem.text);
      } catch {
        return contentItem.text;
      }
    }

    return jsonContent.result;
  }
}

// ==========================================
// 4. TIẾN TRÌNH THỰC THI CHÍNH
// ==========================================
async function main() {
  const options = parseArgs();

  console.log("══════════════════════════════════════════════════════════");
  console.log("🤖 IT'S A PLAN - AUTONOMOUS AI TEAM BOOTSTRAPPER");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`📍 Endpoint API   : ${options.url}`);
  console.log(`🏷️  Project Key    : ${options.project}`);
  console.log(`📁 CWD Workspace  : ${options.cwd}`);
  console.log("──────────────────────────────────────────────────────────");

  const client = new McpClient(options.url, options.token);

  // 1. Kiểm tra kết nối dự án
  console.log("\n🔍 [1/4] Kiểm tra kết nối dự án...");
  let projectInfo: any;
  try {
    projectInfo = await client.callTool("get_project", { projectKey: options.project });
    console.log(`✅ Kết nối thành công tới dự án: "${projectInfo.project?.name || options.project}" (ID: ${projectInfo.project?.id || 1})`);
  } catch (err: any) {
    console.error(`❌ Không thể truy cập dự án "${options.project}": ${err.message}`);
    console.error("👉 Vui lòng kiểm tra lại URL máy chủ, mã Project Key hoặc cung cấp token xác thực qua --token.");
    process.exit(1);
  }

  // 2. Khởi tạo / Kiểm tra các Nhãn (Labels)
  console.log("\n🏷️  [2/4] Kiểm tra & Tạo 4 nhãn phân luồng Triage...");
  const existingLabels = projectInfo.labels || [];
  const existingLabelNames = new Set(existingLabels.map((l: any) => l.name.toLowerCase()));

  for (const label of REQUIRED_LABELS) {
    if (existingLabelNames.has(label.name.toLowerCase())) {
      console.log(`  ✓ Nhãn "${label.name}" đã tồn tại.`);
    } else {
      try {
        await client.callTool("create_label", {
          projectKey: options.project,
          name: label.name,
          color: label.color,
        });
        console.log(`  ➕ Đã tạo nhãn mới: "${label.name}" (${label.color})`);
      } catch (err: any) {
        console.warn(`  ⚠️  Không thể tạo nhãn "${label.name}": ${err.message}`);
      }
    }
  }

  // 3. Kiểm tra & Tạo 4 AI Agents
  console.log("\n🤖 [3/4] Kiểm tra & Tạo 4 AI Agents (@triage-bot, @planner-bot, @dev-bot, @review-bot)...");
  let existingAgents: any[] = [];
  try {
    existingAgents = await client.callTool("list_ai_agents", { projectKey: options.project });
  } catch (err: any) {
    console.warn(`  ⚠️ Không thể lấy danh sách bot hiện tại: ${err.message}`);
  }

  const agentKeys: Record<string, string> = {};
  const createdAgents: any[] = [];

  for (const def of BOT_DEFINITIONS) {
    const existing = Array.isArray(existingAgents)
      ? existingAgents.find((a: any) => a.username.toLowerCase() === def.username.toLowerCase())
      : null;

    if (existing) {
      console.log(`  ✓ Bot "${def.name}" (@${def.username}) đã tồn tại (ID: ${existing.id}).`);
      agentKeys[def.username] = existing.apiKeyStart ? `${existing.apiKeyStart}... (đã có từ trước)` : "EXISTING_KEY";
    } else {
      try {
        const res = await client.callTool("create_ai_agent", {
          projectKey: options.project,
          name: def.name,
          username: def.username,
          kind: def.kind,
          instructions: def.instructions,
          triggerOnMention: def.triggerOnMention,
          triggerOnAssign: def.triggerOnAssign,
          delegationDelaySec: def.delegationDelaySec,
          runnerScope: def.runnerScope,
        });

        const apiKey = res?.apiKey || res?.key || "";
        agentKeys[def.username] = apiKey;
        createdAgents.push({ ...def, apiKey, id: res?.id });
        console.log(`  ✨ Đã tạo thành công "${def.name}" (@${def.username})!`);
        if (apiKey) {
          console.log(`     🔑 API Key: ${apiKey}`);
        }
      } catch (err: any) {
        console.error(`  ❌ Lỗi khi tạo bot "${def.name}": ${err.message}`);
      }
    }
  }

  // 4. Sinh file cấu hình itsaplan-runner.json và mcp_config.json
  console.log("\n📝 [4/4] Xuất các file cấu hình chuẩn...");

  const runnerConfig = {
    url: options.url,
    agent: "antigravity",
    concurrency: parseInt(options.concurrency, 10) || 3,
    pollIntervalMs: parseInt(options.pollIntervalMs, 10) || 3000,
    cwd: resolve(options.cwd),
    agents: [
      {
        name: "Triage Bot",
        apiKey: agentKeys["triage-bot"] || "ENTER_TRIAGE_BOT_API_KEY",
      },
      {
        name: "Dev Bot",
        apiKey: agentKeys["dev-bot"] || "ENTER_DEV_BOT_API_KEY",
      },
      {
        name: "Review Bot",
        apiKey: agentKeys["review-bot"] || "ENTER_REVIEW_BOT_API_KEY",
      },
      {
        name: "Planner Bot",
        apiKey: agentKeys["planner-bot"] || "ENTER_PLANNER_BOT_API_KEY",
      },
    ],
  };

  const mcpConfig = {
    mcpServers: {
      itsaplan: {
        serverUrl: `${options.url.replace(/\/+$/, "")}/mcp`,
        headers: {
          Authorization: `Bearer ${agentKeys["triage-bot"] || "ENTER_TRIAGE_BOT_API_KEY"}`,
        },
      },
    },
  };

  try {
    const runnerPath = resolve(options.outputRunner);
    mkdirSync(dirname(runnerPath), { recursive: true });
    writeFileSync(runnerPath, JSON.stringify(runnerConfig, null, 2), "utf8");
    console.log(`  💾 Đã ghi file Runner: ${runnerPath}`);
  } catch (err: any) {
    console.error(`  ❌ Không thể ghi file runner: ${err.message}`);
  }

  try {
    const mcpPath = resolve(options.outputMcp);
    mkdirSync(dirname(mcpPath), { recursive: true });
    writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2), "utf8");
    console.log(`  💾 Đã ghi file MCP   : ${mcpPath}`);
  } catch (err: any) {
    console.error(`  ❌ Không thể ghi file MCP: ${err.message}`);
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("🎉 KHỞI TẠO HOÀN TẤT!");
  console.log("══════════════════════════════════════════════════════════");
  console.log("Các bước tiếp theo:");
  console.log("1. Chạy `./scripts/install-agent-environment.sh` để nạp skills & rules vào máy.");
  console.log("2. Đảm bảo file `itsaplan-runner.json` có đủ 4 API Keys.");
  console.log("3. Khởi chạy Runner ngầm: `itsaplan-runner &`");
  console.log("4. Kiểm tra trên UI Web để xác nhận cả 4 bot đều hiển thị Online 🟢.");
  console.log("══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n💥 Đã xảy ra lỗi ngoài ý muốn:", err);
  process.exit(1);
});
