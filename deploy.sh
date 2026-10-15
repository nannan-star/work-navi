#!/usr/bin/env bash
# work-navi 本地部署脚本
# 用法:
#   ./deploy.sh              # 生产部署:安装依赖 → 初始化数据库 → 构建 → 后台启动(脱离窗口,仅关机停止)
#   ./deploy.sh --dev        # 开发模式:npm run dev(热更新)
#   ./deploy.sh --seed       # 部署前先重置并写入演示数据(会清空现有数据!)
#   ./deploy.sh --port 3001  # 指定端口(默认 3003)

set -euo pipefail

# 切到脚本所在目录,保证相对路径正确
cd "$(dirname "$0")"

MODE="prod"
SEED=false
PORT=3003

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)   MODE="dev"; shift ;;
    --seed)  SEED=true; shift ;;
    --port)  PORT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "❌ 未知参数: $1" >&2
      echo "   运行 ./deploy.sh --help 查看用法" >&2
      exit 1 ;;
  esac
done

# 颜色
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; N='\033[0m'
info() { echo -e "${G}➜${N} $*"; }
warn() { echo -e "${Y}⚠${N}  $*"; }
err()  { echo -e "${R}✖${N}  $*"; }

# 1. 检查 Node 版本 (Next 15 / Prisma 6 要求 >= 18.18)
if ! command -v node >/dev/null 2>&1; then
  err "未检测到 Node.js,请先安装(Node >= 18.18,建议 20+): https://nodejs.org"
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  err "Node 版本过低($(node -v)),需要 >= 18.18"
  exit 1
fi
info "Node $(node -v) ✓"

# 2. 安装依赖(首次或依赖变更时)
if [[ ! -d node_modules ]]; then
  info "安装依赖..."
  npm install
else
  info "依赖已存在,跳过安装(如需更新请手动 npm install)"
fi

# 3. 初始化数据库(不存在时生成 dev.db;已存在则跳过,不会动数据)
DB_FILE="prisma/dev.db"
if [[ ! -f "$DB_FILE" ]]; then
  info "初始化 SQLite 数据库..."
  npm run prisma:push
  npm run prisma:generate
  FRESH_DB=true
else
  info "数据库已存在,跳过初始化"
  FRESH_DB=false
fi

# 4. 可选:写入演示数据(仅当显式 --seed 时)
if [[ "$SEED" == true ]]; then
  warn "将重置并写入演示数据,现有数据会被清空!"
  read -r -p "确认继续?[y/N] " yn
  if [[ "$yn" =~ ^[Yy]$ ]]; then
    info "写入演示数据..."
    npm run db:seed
  else
    info "已取消"
  fi
elif [[ "$FRESH_DB" == true ]]; then
  warn "数据库为空,如需演示数据可运行: ./deploy.sh --seed"
fi

# 5. 启动
if [[ "$MODE" == "dev" ]]; then
  info "开发模式启动 → http://localhost:${PORT}"
  exec npm run dev -- -p "$PORT"
fi

# --- 生产模式 ---
info "生产构建..."
npm run build

# 端口占用检测:若是本项目的旧实例则自动停掉重启,否则报错退出
PORTS_PID=$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [[ -n "$PORTS_PID" ]]; then
  for P in $PORTS_PID; do
    CMD=$(ps -p "$P" -o command= 2>/dev/null || true)
    if echo "$CMD" | grep -Eq 'next-server|next start|next dev|npm run (start|dev)'; then
      warn "端口 ${PORT} 被旧的 work-navi 实例占用(PID ${P}),自动停掉后重启..."
      kill "$P" 2>/dev/null || true
      sleep 1
    else
      err "端口 ${PORT} 被其它程序占用(PID ${P}): ${CMD}"
      err "请先释放端口,或使用 --port 指定其它端口"
      exit 1
    fi
  done
  # 再次确认端口已释放
  if lsof -t -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    err "端口 ${PORT} 仍被占用,无法启动"
    exit 1
  fi
fi

# 后台脱离启动:关窗口/终端不影响,仅关机才停止
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/work-navi.log"
info "生产模式后台启动 → http://localhost:${PORT}"
info "日志输出到 ${LOG_FILE}(实时查看: tail -f ${LOG_FILE})"
nohup npm run start -- -p "$PORT" >> "$LOG_FILE" 2>&1 &

# 等待服务就绪
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:${PORT}/" 2>/dev/null; then
    info "服务已就绪 ✓ http://localhost:${PORT}"
    exit 0
  fi
  sleep 1
done
warn "服务可能仍在启动中,请查看日志: tail -f ${LOG_FILE}"
