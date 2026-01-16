#!/bin/bash
# Human-in-the-loop Ralph - run once, watch, iterate
# Usage: ./scripts/ralph/ralph-once.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════"
echo " Ralph Single Iteration (HITL Mode)"
echo "═══════════════════════════════════════════════════════"

cat "$SCRIPT_DIR/prompt.md" | claude --dangerously-skip-permissions
