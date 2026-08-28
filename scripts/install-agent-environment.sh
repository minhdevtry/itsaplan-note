#!/usr/bin/env bash
set -e

# ==============================================================================
# It's a Plan + Antigravity AI Team - Environment Installer
# Cài đặt toàn bộ Rules & Skills cho AI Agent trên máy trạm
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "══════════════════════════════════════════════════════════"
echo "🛠️  IT'S A PLAN - AI TEAM ENVIRONMENT INSTALLER"
echo "══════════════════════════════════════════════════════════"
echo "Thư mục nguồn : $ROOT_DIR"
echo ""

# 1. Cài đặt Rule Global cho Antigravity
GEMINI_RULES_DIR="$HOME/.gemini/config/rules"
mkdir -p "$GEMINI_RULES_DIR"

if [ -f "$ROOT_DIR/rules/itsaplan.md" ]; then
  cp -f "$ROOT_DIR/rules/itsaplan.md" "$GEMINI_RULES_DIR/itsaplan.md"
  echo "✅ Đã cài đặt Rule: $GEMINI_RULES_DIR/itsaplan.md"
else
  echo "⚠️  Không tìm thấy $ROOT_DIR/rules/itsaplan.md"
fi

# 2. Cài đặt Skills cho Antigravity
GEMINI_SKILLS_DIR="$HOME/.gemini/config/skills"
mkdir -p "$GEMINI_SKILLS_DIR"

if [ -d "$ROOT_DIR/skills" ]; then
  # Copy các subdirectories trong skills
  cp -rn "$ROOT_DIR/skills/"* "$GEMINI_SKILLS_DIR/" 2>/dev/null || cp -r "$ROOT_DIR/skills/"* "$GEMINI_SKILLS_DIR/"
  echo "✅ Đã đồng bộ bộ 37 kỹ năng vào: $GEMINI_SKILLS_DIR"
else
  echo "⚠️  Không tìm thấy thư mục $ROOT_DIR/skills"
fi

# 3. Phân quyền thực thi cho các script
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
chmod +x "$SCRIPT_DIR"/*.ts 2>/dev/null || true

# 4. Kiểm tra binary itsaplan-runner
echo ""
echo "🔍 Kiểm tra binary itsaplan-runner trong hệ thống..."
if command -v itsaplan-runner >/dev/null 2>&1; then
  RUNNER_PATH="$(which itsaplan-runner)"
  echo "✅ itsaplan-runner đã có tại: $RUNNER_PATH"
else
  echo "⚠️  itsaplan-runner chưa nằm trong \$PATH."
  echo "👉 Để build và cài runner từ mã nguồn itsaplan:"
  echo "   cd /path/to/itsaplan/packages/runner"
  echo "   bun run build"
  echo "   mkdir -p ~/.local/bin"
  echo "   ln -sf \$(pwd)/dist/cli.js ~/.local/bin/itsaplan-runner"
  echo "   chmod +x ~/.local/bin/itsaplan-runner"
  echo "   (Đảm bảo ~/.local/bin nằm trong PATH của bạn)"
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "🎉 CÀI ĐẶT MÔI TRƯỜNG HOÀN TẤT!"
echo "══════════════════════════════════════════════════════════"
