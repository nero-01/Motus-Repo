# Branching for issue work

Use this so each issue branch includes the latest shared app shell (tabs, root layout, etc.) and you do not see “reverted” configs when switching branches.

## PR-first, then next issue (recommended)

The problem is usually **not** lost uncommitted files — it’s checking out an **old issue branch** that never received what’s already on **`main`**. That branch still has **old tab bar / layout**, so it feels like something “reverted.”

1. **Finish the current issue with a PR merged into `main`** before you treat that work as done. That keeps one **current baseline** on `main`.
2. For the **next** issue, use **`npm run checkout-issue -- nero-01/issueNN`**. The script checks out the branch (or creates it from `main`) and then **always merges `origin/main`** so your branch matches the latest merged workflow — including anything that just landed from the previous PR.
3. **Cursor / VS Code “checkout branch for issue”** does **not** merge `main` for you. After an automatic checkout, run **`git fetch origin && git merge origin/main`** or use **`npm run checkout-issue`** instead.

There is **no repo hook** that can force “PR merged before Cursor checks out”; that ordering is **process** (merge PRs, then switch issues) plus **always merging `main` into the issue branch** when you land on it.

## `npm run checkout-issue -- nero-01/issueNN`

Runs `scripts/git-safe-branch.sh`, which:

- Optionally **stashes** a dirty working tree (including untracked).
- Checks out an existing branch, tracks `origin/<branch>`, or **creates** the branch from updated `main`.
- **Merges `origin/main` (or `origin/master`)** into the current branch so shared config stays aligned with `main`.

If the merge conflicts, resolve and commit.

## Switching issues and uncommitted edits

If you have **uncommitted** changes, **commit** or **stash** before switching, or rely on the script’s auto-stash. Workspace **`.vscode/settings.json`** uses **auto-save on focus change** and discourages **force checkout**.

## Start a **new** issue branch (manual)

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b nero-01/issueNN
```

Replace `main` if your default branch is named differently.

## Continue an **existing** issue branch (manual)

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

## Habits that prevent drift

1. Merge finished issues to **`main` regularly** (small PRs).
2. Always **branch new work from updated `main`**, or run **`checkout-issue`** so **`main` is merged in** after you switch.
3. **Merge `main` into long-lived branches** whenever global UI changes land.
