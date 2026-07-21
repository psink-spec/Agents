#!/bin/bash
# SubagentStop hook: append "date | agent | done" to the agency run log.
# Must never fail or block — always exit 0.
LOG="${CLAUDE_PROJECT_DIR:-.}/.agency/log.md"
mkdir -p "$(dirname "$LOG")" 2>/dev/null

if command -v jq >/dev/null 2>&1; then
  AGENT_TYPE=$(jq -r '.agent_type // "unknown"' 2>/dev/null)
else
  AGENT_TYPE="unknown"
fi

echo "$(date '+%Y-%m-%d %H:%M') | ${AGENT_TYPE:-unknown} | - | subagent-stop | - | hook: run completed" >> "$LOG" 2>/dev/null
exit 0
