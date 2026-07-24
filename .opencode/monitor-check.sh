#!/bin/bash
# Agent Monitor Check — Run by Athena to detect Athena-GOD/Athena-MAX activity
# Usage: bash .opencode/monitor-check.sh

cd "$(dirname "$0")/.." || exit 1

LOG=".opencode/improver/agent-monitor.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "=== Agent Monitor Check: $TIMESTAMP ==="
echo ""

# 1. Git status summary
echo "--- Git Status ---"
MODIFIED=$(git diff --name-only | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
TOTAL=$((MODIFIED + UNTRACKED))
echo "Modified: $MODIFIED | Untracked: $UNTRACKED | Total changes: $TOTAL"

# 2. Recent commits (last 5)
echo ""
echo "--- Recent Commits (last 5) ---"
git log --oneline -5

# 3. Current branch
echo ""
echo "--- Branch ---"
git branch --show-current

# 4. Detailed file changes
if [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "--- Changed Files ---"
    git diff --stat
    if [ "$UNTRACKED" -gt 0 ]; then
        echo ""
        echo "--- Untracked Files ---"
        git ls-files --others --exclude-standard
    fi
fi

# 5. Log to monitor file
echo "" >> "$LOG"
echo "[$TIMESTAMP] CHECK: modified=$MODIFIED untracked=$UNTRACKED total=$TOTAL branch=$(git branch --show-current)" >> "$LOG"
if [ "$TOTAL" -gt 0 ]; then
    echo "[$TIMESTAMP] FILES: $(git diff --name-only | tr '\n' ', ')" >> "$LOG"
fi

# 6. Check for new commits since last known
LAST_KNOWN="6bc8678"
NEW_COMMITS=$(git log --oneline "$LAST_KNOWN..HEAD" 2>/dev/null | wc -l)
if [ "$NEW_COMMITS" -gt 0 ]; then
    echo ""
    echo "=== NEW COMMITS DETECTED ($NEW_COMMITS since $LAST_KNOWN) ==="
    git log --oneline "$LAST_KNOWN..HEAD"
    echo "[$TIMESTAMP] NEW_COMMITS: $NEW_COMMITS — $(git log --oneline "$LAST_KNOWN..HEAD" | tr '\n' '; ')" >> "$LOG"
fi

echo ""
echo "=== Check complete ==="
