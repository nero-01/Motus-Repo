# Branching for issue work

Use this so each issue branch includes the latest shared app shell (tabs, root layout, etc.) and you do not see “reverted” configs when switching branches.

## Switching issues without losing your work

**Cursor / VS Code “checkout branch for issue”** replaces files on disk with the target branch. If you have **uncommitted** or **unsaved** changes, they can appear to “revert” or vanish.

1. **Save everything** before switching branches (this repo enables **auto-save on focus change** in `.vscode/settings.json`).
2. **Commit** your work, or **stash** first:  
   `git stash push -u -m "wip before next issue"`  
   Then after checkout: `git stash list` / `git stash pop`.
3. **Easier:** from repo root run  
   `npm run checkout-issue -- nero-01/issueNN`  
   which runs `scripts/git-safe-branch.sh` (auto-stash if the tree is dirty, then creates or checks out the branch from `main`).

**Force checkout** is discouraged: `.vscode/settings.json` sets `git.allowForceCheckout` to **false** so the UI is less likely to wipe your tree without a deliberate override.

## Start a **new** issue branch

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b nero-01/issueNN
```

Replace `main` if your default branch is named differently.

## Continue an **existing** issue branch (before you code)

Merge the latest default branch in:

```bash
git fetch origin
git checkout nero-01/issueNN
git merge origin/main
# resolve conflicts if any, then commit
```

Use `git rebase origin/main` instead of merge if your team standard is rebase (only if you are comfortable resolving conflicts and the branch is not heavily shared).

## After another PR merged to `main`

Any time **tabs**, **`app/_layout.tsx`**, or other global files changed on `main`, update your open issue branch:

```bash
git fetch origin
git merge origin/main
```

## Optional checks

See what `main` has that you do not:

```bash
git fetch origin
git log HEAD..origin/main --oneline
```

## Habit that prevents drift

1. Merge finished issues to **`main` regularly** (small PRs).
2. Always **branch new work from updated `main`**.
3. **Merge `main` into long-lived branches** weekly or whenever global UI changes land.
