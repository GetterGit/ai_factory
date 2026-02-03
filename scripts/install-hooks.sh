#!/bin/bash

# AI Factory - Git Hooks Installer
#
# Installs GitFlow enforcement hooks as a safety net.
# Primary enforcement is via MCP tools.
#
# Usage:
#   ./install-hooks.sh           # Install hooks
#   ./install-hooks.sh --uninstall  # Restore backups

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SOURCE="$SCRIPT_DIR/git-hooks"

# Handle worktrees: --git-common-dir returns the main repo's .git directory
# For regular repos, this is the same as --git-dir
GIT_COMMON_DIR="$(git rev-parse --git-common-dir 2>/dev/null)"

if [ -z "$GIT_COMMON_DIR" ] || [ "$GIT_COMMON_DIR" == "--git-common-dir" ]; then
  # Fallback for older git versions
  GIT_COMMON_DIR="$(git rev-parse --git-dir 2>/dev/null)"
fi

if [ -z "$GIT_COMMON_DIR" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

HOOKS_DEST="$GIT_COMMON_DIR/hooks"

# Verify source files exist
if [ ! -f "$HOOKS_SOURCE/pre-push" ]; then
  echo "❌ Error: $HOOKS_SOURCE/pre-push not found"
  echo "   Run this script from the ai_factory root directory"
  exit 1
fi

if [ ! -f "$HOOKS_SOURCE/pre-merge-commit" ]; then
  echo "❌ Error: $HOOKS_SOURCE/pre-merge-commit not found"
  exit 1
fi

# Handle uninstall
if [[ "$1" == "--uninstall" ]]; then
  echo "Uninstalling AI Factory git hooks..."
  
  # Find most recent backups
  pre_push_backup=$(ls -t "$HOOKS_DEST"/pre-push.backup.* 2>/dev/null | head -1)
  pre_merge_backup=$(ls -t "$HOOKS_DEST"/pre-merge-commit.backup.* 2>/dev/null | head -1)
  
  if [ -n "$pre_push_backup" ]; then
    cp "$pre_push_backup" "$HOOKS_DEST/pre-push"
    echo "✅ Restored pre-push from $pre_push_backup"
  else
    rm -f "$HOOKS_DEST/pre-push"
    echo "✅ Removed pre-push (no backup found)"
  fi
  
  if [ -n "$pre_merge_backup" ]; then
    cp "$pre_merge_backup" "$HOOKS_DEST/pre-merge-commit"
    echo "✅ Restored pre-merge-commit from $pre_merge_backup"
  else
    rm -f "$HOOKS_DEST/pre-merge-commit"
    echo "✅ Removed pre-merge-commit (no backup found)"
  fi
  
  echo ""
  echo "Git hooks uninstalled."
  exit 0
fi

# Install hooks
echo "Installing AI Factory git hooks..."
echo "Hooks directory: $HOOKS_DEST"
echo ""

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DEST"

# Timestamped backups to avoid overwriting
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Install pre-push hook
if [ -f "$HOOKS_DEST/pre-push" ]; then
  # Check if it's already our hook (avoid backing up our own hook)
  if ! grep -q "GitFlow Enforcer" "$HOOKS_DEST/pre-push" 2>/dev/null; then
    cp "$HOOKS_DEST/pre-push" "$HOOKS_DEST/pre-push.backup.$TIMESTAMP"
    echo "⚠️  Backed up existing pre-push to pre-push.backup.$TIMESTAMP"
  fi
fi
cp "$HOOKS_SOURCE/pre-push" "$HOOKS_DEST/pre-push"
chmod +x "$HOOKS_DEST/pre-push"
echo "✅ Installed pre-push hook"

# Install pre-merge-commit hook
if [ -f "$HOOKS_DEST/pre-merge-commit" ]; then
  if ! grep -q "GitFlow Enforcer" "$HOOKS_DEST/pre-merge-commit" 2>/dev/null; then
    cp "$HOOKS_DEST/pre-merge-commit" "$HOOKS_DEST/pre-merge-commit.backup.$TIMESTAMP"
    echo "⚠️  Backed up existing pre-merge-commit to pre-merge-commit.backup.$TIMESTAMP"
  fi
fi
cp "$HOOKS_SOURCE/pre-merge-commit" "$HOOKS_DEST/pre-merge-commit"
chmod +x "$HOOKS_DEST/pre-merge-commit"
echo "✅ Installed pre-merge-commit hook"

echo ""
echo "============================================"
echo "✅ Git hooks installed successfully"
echo "============================================"
echo ""
echo "These hooks enforce GitFlow as a safety net:"
echo "  • pre-push: Blocks direct push to main"
echo "  • pre-merge-commit: Blocks invalid merge targets"
echo ""
echo "Primary enforcement is via MCP tools:"
echo "  • gitflow.merge_task_to_feature"
echo "  • gitflow.merge_feature_to_main"
echo ""
echo "To uninstall and restore backups:"
echo "  $0 --uninstall"
echo ""
echo "To bypass hooks (emergency only):"
echo "  git push --no-verify"
echo "  git merge --no-verify"
echo ""
