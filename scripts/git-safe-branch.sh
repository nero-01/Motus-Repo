#!/usr/bin/env bash
# Stash uncommitted + untracked work, then switch to an issue branch (create from main if missing).
# Usage: bash scripts/git-safe-branch.sh nero-01/issue42
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: bash scripts/git-safe-branch.sh <branch-name>"
  echo "Example: bash scripts/git-safe-branch.sh nero-01/issue42"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  MSG="wip before ${TARGET} ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo "Working tree has changes — stashing (includes untracked): ${MSG}"
  git stash push -u -m "${MSG}"
fi

git fetch origin

DEFAULT_BRANCH="main"
if ! git show-ref --verify --quiet "refs/remotes/origin/${DEFAULT_BRANCH}"; then
  DEFAULT_BRANCH="master"
fi

if git show-ref --verify --quiet "refs/heads/${TARGET}"; then
  git checkout "${TARGET}"
elif git show-ref --verify --quiet "refs/remotes/origin/${TARGET}"; then
  git checkout -t "origin/${TARGET}"
else
  echo "Creating ${TARGET} from origin/${DEFAULT_BRANCH}..."
  git checkout "${DEFAULT_BRANCH}"
  git pull "origin" "${DEFAULT_BRANCH}"
  git checkout -b "${TARGET}"
fi

echo "Checked out: $(git branch --show-current)"
echo "If you stashed: git stash list   then   git stash pop (when ready)"
