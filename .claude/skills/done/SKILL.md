---
name: done
description: Validation gate for finishing work. Auto-detects scope (quick, standard, or project) from the branch, diff size, and implementation plan, then always runs tests/lint before committing, pushing or opening a PR, checking CI, and updating changelog/plan docs as the scope requires.
argument-hint: "[quick|standard|project] [commit message hint]"
disable-model-invocation: true
---

# /done — Validation gate

Arguments: `$ARGUMENTS`. If the first word is `quick`, `standard`, or `project`, use that scope instead of auto-detecting. Any remaining text is a hint for the commit message.

**Never skip test/lint validation, in any scope.** If validation fails, stop, report the failures, and do not commit or push.

## 1. Detect scope

Gather signals:

```bash
git branch --show-current
git diff --stat HEAD            # tracked changes, staged + unstaged
git status --porcelain=v1       # include untracked files in the count
git rev-list --count @{u}..HEAD 2>/dev/null   # unpushed commits
```

Also check whether `docs/IMPLEMENTATION_PLAN.md` exists and contains unchecked items (`- [ ]`).

Count changed lines from the `--stat` summary (insertions + deletions) plus the number of untracked files.

Pick the scope:

| Scope | When |
|---|---|
| **Project** | `docs/IMPLEMENTATION_PLAN.md` exists with unchecked items (takes priority) |
| **Quick** | On `main`/`master` **and** small diff (≤ ~50 changed lines and ≤ ~5 files) |
| **Standard** | Everything else — a feature branch, or a medium/large diff |

If on `main` with a diff larger than Quick allows, recommend creating a feature branch (`git switch -c <type>/<short-name>`) and continuing as Standard. Ask before creating it.

If there is nothing to commit and nothing unpushed, say so and stop.

State the chosen scope and the signals behind it in one line before continuing.

## 2. Validate (all scopes — mandatory)

Run what the project defines in `package.json`. For this project:

```bash
npm run lint
npx tsc --noEmit
```

Also run, if present in `package.json` scripts: `test` (`npm test -- --watchAll=false` or equivalent non-watch form), `typecheck`, and `format:check`. Run `npm run build` too for Standard and Project scope.

- If there is no test script, say "no tests configured" in the report — do not treat that as a pass for lint/types.
- On any failure: show the relevant errors, fix them only if the fix is clearly within the current change and the user agrees, then re-run. Never disable rules, add `// eslint-disable`, `@ts-ignore`, or `--no-verify` to get green.

## 3. Commit

- Review `git status` and the diff. Stage relevant files explicitly by path — do not stage secrets (`.env*`), build output (`.next/`), or unrelated files. Ask if unsure whether a file belongs.
- Write a Conventional Commits message (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`) summarizing the *why*. Use the argument hint if given.
- Commit. If a pre-commit hook fails, fix the cause and make a new commit — don't amend or bypass.

## 4. Scope-specific steps

### Quick
1. `git push` (set upstream with `git push -u origin <branch>` if needed). If there is no remote, say so and stop after committing.
2. Confirm CI: `gh run list --branch <branch> --limit 1`, then `gh run watch <id> --exit-status`. If the repo has no workflows (`.github/workflows/` missing) or `gh` is unavailable, report "no CI configured" instead.

### Standard
1. **Changelog**: add an entry under `## [Unreleased]` in `CHANGELOG.md` (create the file in Keep a Changelog format if missing), under the right heading (Added / Changed / Fixed / Removed). Commit it with the change or as a follow-up `docs: changelog` commit.
2. Push with upstream: `git push -u origin <branch>`.
3. **Open a PR** with `gh pr create --base main`. If a PR already exists for this branch (`gh pr view`), update it instead of creating another. Title = commit summary; body = what changed, why, how it was validated (the commands from step 2 and their results).
4. **Wait on CI**: `gh pr checks --watch`. Report pass/fail per check. On failure, show the failing log excerpt (`gh run view <id> --log-failed`) and stop.
5. **Prompt for code review**: ask the user whether to run `/code-review` on the diff now, and/or request reviewers (`gh pr edit --add-reviewer <user>`). Don't merge.

### Project
Do everything in **Standard**, plus:
1. **Update `docs/IMPLEMENTATION_PLAN.md`**: check off (`- [x]`) only the items actually completed by the committed work — verify each against the diff. Update the `_Last updated_` date. Don't delete or reword items; add a note under "Open questions" if something was descoped.
2. **Handoff note**: append to `docs/HANDOFF.md` (create if missing) a dated entry:

   ```markdown
   ## YYYY-MM-DD — <branch>

   **Done:** what was completed (plan item numbers).
   **Validation:** commands run and results; CI status; PR link.
   **Next:** the next unchecked plan items.
   **Notes / risks:** anything the next person should know.
   ```
   Include the same summary in the PR body.
3. Commit these doc updates (`docs: update plan and handoff`) and push so they land in the PR.

## 5. Report

A short summary: scope (and why), validation results per command, commit SHA(s), push/PR link, CI status, docs updated, and anything left for the user to do (review, merge, then `/landed`).
