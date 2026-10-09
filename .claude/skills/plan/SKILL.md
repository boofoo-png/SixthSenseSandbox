---
name: plan
description: Project planning phase. Reads docs/ for context, asks clarifying questions, writes an ordered checkable plan to docs/IMPLEMENTATION_PLAN.md, and appends real architectural decisions to docs/DECISIONS.md. Use when starting or reshaping a feature. This is the project's own planning workflow, separate from any built-in design or plan mode.
argument-hint: "[feature description]"
---

# /plan — Planning phase

The feature to plan is: `$ARGUMENTS`. If empty, ask the user what they want to plan before doing anything else.

This skill produces documents, not code. Do not modify source files.

## Steps

1. **Gather context**
   - List and read every file under `docs/` (Markdown and text). Read `docs/DECISIONS.md` and `docs/IMPLEMENTATION_PLAN.md` first and in full if they exist.
   - Also skim `README.md`, `AGENTS.md`/`CLAUDE.md`, and `package.json` for stack and conventions.
   - This is a Next.js project whose version may differ from your training data: before planning anything framework-specific, check the relevant guide in `node_modules/next/dist/docs/` as `AGENTS.md` instructs.
   - Look at the existing code layout (`app/`, `public/`, etc.) enough to place the feature realistically.
   - If `docs/` does not exist, note that and continue — you will create it.

2. **Clarify**
   - Identify anything ambiguous: scope boundaries, data shape, persistence, auth, UX behavior, edge cases, conflicts with past decisions in `DECISIONS.md`.
   - Ask the user concise questions (batch them, at most ~4, offering options where possible). Wait for answers before writing the plan.
   - If nothing is genuinely ambiguous, say so and proceed.

3. **Write `docs/IMPLEMENTATION_PLAN.md`**
   - If it exists with unrelated in-progress work, ask whether to add a new section or replace it. Never silently discard unchecked items. Keep already-checked items as-is.
   - Use this structure:

     ```markdown
     # Implementation Plan: <Feature name>

     _Last updated: YYYY-MM-DD_

     ## Goal
     One or two sentences on what "done" means.

     ## Out of scope
     - ...

     ## Phase 1 — Data layer
     - [ ] 1.1 Concrete, verifiable step (files touched)
     - [ ] 1.2 ...

     ## Phase 2 — API / server
     - [ ] 2.1 ...

     ## Phase 3 — UI
     - [ ] 3.1 ...

     ## Phase 4 — Tests & polish
     - [ ] 4.1 ...

     ## Open questions
     - ...
     ```
   - Phases are ordered so each one builds on the last. Adapt or drop phase names to fit the feature — don't create empty phases.
   - Each step is small enough to finish and verify in one sitting and names the files or area it touches.
   - Use today's date (absolute, `YYYY-MM-DD`).

4. **Record decisions in `docs/DECISIONS.md`**
   - Only for real architectural decisions made in this session (e.g. choosing a data store, an auth approach, rendering strategy, a library, an API shape). Not for routine implementation details.
   - **Append only.** Never rewrite, reorder, or delete existing entries. If a new decision supersedes an old one, add a new entry that says "Supersedes: <old entry title/date>".
   - Create the file with a `# Architecture Decisions` heading if it doesn't exist.
   - Entry format:

     ```markdown
     ## YYYY-MM-DD — <Short decision title>

     **Context**
     What problem or constraint prompted this.

     **Decision**
     What was chosen.

     **Alternatives considered**
     - Option A — why not
     - Option B — why not
     ```
   - If no architectural decision was made, don't add an entry; say so in the report.

5. **Report**
   - Path(s) written, the number of phases and steps, decisions recorded (titles), and any open questions left.
   - Suggest the first step to start on. Do not commit — that happens in `/done`.
