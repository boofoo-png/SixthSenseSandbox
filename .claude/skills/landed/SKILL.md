---
name: landed
description: Post-merge verification. Confirms the merged change is passing CI on main, deletes the merged local and remote feature branch, and reports a short confirmation. Use after a PR from /done has been merged.
argument-hint: "[branch-name]"
disable-model-invocation: true
---

# /landed — Post-merge verification

Target branch: `$ARGUMENTS` if given, otherwise the current branch. Call it `<feature>`. If the current branch is already `main`/`master` and no argument was given, ask which branch landed.

Never delete `main`, `master`, `develop`, or any branch that isn't verified as merged.

## Steps

1. **Refresh state**
   ```bash
   git fetch --prune origin
   ```

2. **Verify the merge**
   - Preferred: `gh pr list --head <feature> --state merged --json number,title,mergeCommit,url --limit 1`. Note the PR number, URL, and merge commit SHA.
   - Fallback (no `gh` or no PR): `git branch -r --merged origin/main` / `git merge-base --is-ancestor <feature> origin/main`. Squash merges won't show as ancestors — in that case rely on the PR state, or ask the user to confirm.
   - If the branch is **not** merged, stop and report. Don't delete anything.

3. **Confirm CI on main**
   ```bash
   gh run list --branch main --commit <merge-sha> --limit 5
   ```
   - If runs are in progress, `gh run watch <id> --exit-status`.
   - If any run fails, report the failing job and log excerpt (`gh run view <id> --log-failed`), and stop before deleting branches — the user may need the branch for a fix.
   - If there's no CI configured (no `.github/workflows/`) or no `gh`, say so and continue.

4. **Update local main**
   ```bash
   git switch main
   git pull --ff-only
   ```
   If there are uncommitted changes that block the switch, stop and report them — don't stash or discard.

5. **Delete the feature branch**
   - Local: `git branch -d <feature>`. If git refuses because of a squash merge, use `-D` only after step 2 confirmed the PR is merged, and say so.
   - Remote: if `origin/<feature>` still exists (`git ls-remote --heads origin <feature>`), run `git push origin --delete <feature>`. If it's already gone (auto-deleted by GitHub), note that.

6. **Report**
   ```
   Landed:  PR #12 "feat: ..." → main @ abc1234
   CI:      ✅ passing on main  (or: ⚠ no CI configured)
   Cleanup: deleted local <feature>; remote <feature> deleted (or: already gone)
   Now on:  main, up to date with origin/main
   ```
