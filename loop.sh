#!/bin/bash

# =================================================================
# Agentic Workflow Orchestrator (Unchained Version - 2026)
# =================================================================

TASKS_MD="tasks.md"
AGENT_DIR=".agent"
PROJECT_NAME="Phoenix-Project"

# 内部状态
REVIEW_FEEDBACK_FILE="$AGENT_DIR/review_feedback.md"
AGENT_A_LOG="$AGENT_DIR/agent_a.log"

# 颜色
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

log() { printf "${GREEN}[$(date +'%H:%M:%S')]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; }

# 环境自检
init_env() {
    mkdir -p "$AGENT_DIR"
    # 必须检查是否是 git 仓库，否则轮询会死循环
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        error "当前目录不是 Git 仓库，请先运行 'git init' 并完成首次 commit。"
        exit 1
    fi
    # 检查是否有 CLAUDE.md 或 AGENT.md
    if [ ! -f "CLAUDE.md" ] && [ ! -f "AGENT.md" ]; then
        warn "未检测到 CLAUDE.md 或 AGENT.md，Agent 可能会失去约束。"
    fi
}

mark_task_done() {
    local task_content=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/- \[ \] $task_content/- [x] $task_content/" "$TASKS_MD"
    else
        sed -i "s/- \[ \] $task_content/- [x] $task_content/" "$TASKS_MD"
    fi
    log "✅ 任务 [$task_content] 已标记为完成。"
}

execute_task() {
    local task_desc=$1
    local redo_count=0
    local max_redo=3
    local last_commit=$(git rev-parse HEAD)

    while [ $redo_count -lt $max_redo ]; do
        log "🛠️ Agent A 启动 (尝试 $((redo_count+1))/$max_redo)..."
        
        # 组装指令
        local a_prompt="任务: $task_desc"
        [ -f "$REVIEW_FEEDBACK_FILE" ] && a_prompt="$a_prompt \n\n请参考反馈进行修复: $(cat $REVIEW_FEEDBACK_FILE)"

        # 启动 Agent A (异步)
        claude -p "$a_prompt" --yes > "$AGENT_A_LOG" 2>&1 &
        local agent_a_pid=$!

        # 信号轮询：监听 Git Commit
        while true; do
            local current_commit=$(git rev-parse HEAD)
            if [ "$current_commit" != "$last_commit" ]; then
                log "🎊 检测到 Agent A 提交代码。"
                kill -15 $agent_a_pid 2>/dev/null
                break
            fi
            if ! kill -0 $agent_a_pid 2>/dev/null; then 
                log "Agent A 会话结束。"
                break 
            fi
            sleep 4
        done

        # 阶段 B: Agent B 评审
        log "🔍 Agent B 评审中..."
        local b_prompt="作为架构师，评审最新提交。必须在最后一行返回 JSON: {\"verdict\": \"APPROVE\"|\"REDO\", \"reason\": \"...\"}"
        
        local review_output=$(claude -p "$b_prompt" --yes 2>/dev/null)
        local json_part=$(echo "$review_output" | grep -o '{.*}' | tail -n 1)
        local verdict=$(echo "$json_part" | jq -r '.verdict' 2>/dev/null)
        local reason=$(echo "$json_part" | jq -r '.reason' 2>/dev/null)

        if [ "$verdict" == "APPROVE" ]; then
            mark_task_done "$task_desc"
            rm -f "$REVIEW_FEEDBACK_FILE"
            return 0
        else
            warn "❌ 评审未通过。原因: ${reason:-'不符合规范'}"
            echo "$reason" > "$REVIEW_FEEDBACK_FILE"
            redo_count=$((redo_count + 1))
            last_commit=$(git rev-parse HEAD)
        fi
    done
    return 1
}

main() {
    init_env
    log "🌟 启动全自动编码工作流: $PROJECT_NAME"
    
    while true; do
        current_task=$(grep "^- \[ \][[:space:]]" "$TASKS_MD" | head -n 1 | sed 's/^- \[ \][[:space:]]*//')

        if [ -z "$current_task" ]; then
            log "🏁 所有任务已完成！"
            break
        fi

        log "📍 当前处理任务: [$current_task]"
        if ! execute_task "$current_task"; then
            error "任务失败，停止运行。"
            exit 1
        fi
        sleep 2
    done
}

main
