# Ralph Agent Instructions

You are an autonomous coding agent working on a menu version control system.

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the highest priority user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `bun run build && bun run lint`
7. Update CLAUDE.md if you discover reusable patterns
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `scripts/ralph/progress.txt`

## Progress Report Format

APPEND to progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]

- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the settings panel is in component X")

---
```

The learnings section is critical - it helps future iterations avoid mistakes and understand the codebase.

## Consolidate Patterns

If you discover a reusable pattern, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create if it doesn't exist):

```
## Codebase Patterns

- Example: Use `cn()` from lib/utils for className merging
- Example: shadcn/ui components go in components/ui/
- Example: API routes use Next.js App Router conventions
```

Only add patterns that are general and reusable, not story-specific details.

## Update CLAUDE.md

Before committing, check if any edited files have learnings worth preserving in CLAUDE.md:

- API patterns or conventions
- Gotchas or non-obvious requirements
- Dependencies between files
- Testing approaches

Do NOT add story-specific implementation details or temporary notes.

## Quality Requirements

- ALL commits must pass: `bun run build && bun run lint`
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns in the codebase

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete, reply with:

```
<promise>COMPLETE</promise>
```

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep feedback loops green
- Read the Codebase Patterns section in progress.txt before starting
