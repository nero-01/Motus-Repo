#!/usr/bin/env bash
# Issue branch checkout that always integrates latest default branch (main) afterward.
# Prevents "reverted" tab bar / shared config when Cursor checks out a stale issue branch.
# Optional: stashes if working tree is dirty.
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

ORIGIN_DEFAULT="origin/${DEFAULT_BRANCH}"

if git show-ref --verify --quiet "refs/heads/${TARGET}"; then
  git checkout "${TARGET}"
elif git show-ref --verify --quiet "refs/remotes/origin/${TARGET}"; then
  git checkout -t "origin/${TARGET}"
else
  echo "Creating ${TARGET} from ${ORIGIN_DEFAULT}..."
  git checkout "${DEFAULT_BRANCH}"
  git pull "origin" "${DEFAULT_BRANCH}"
  git checkout -b "${TARGET}"
fi

CURRENT="$(git branch --show-current)"
echo "Merging ${ORIGIN_DEFAULT} into ${CURRENT} (keeps shared app config current)..."
MERGE_MSG="merge: ${ORIGIN_DEFAULT} into ${CURRENT} (issue workflow)"
if ! git merge "${ORIGIN_DEFAULT}" -m "${MERGE_MSG}"; then
  echo ""
  echo "Merge conflict — resolve files, then:"
  echo "  git add <paths> && git commit"
  exit 1
fi

echo "On branch: ${CURRENT} (includes latest ${DEFAULT_BRANCH})."
echo "If you stashed: git stash list   then   git stash pop (when ready)"
