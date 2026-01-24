# Merge Conflict Report Template

This document is created when merge conflicts cannot be auto-resolved after maximum attempts (3). It documents the conflict details and guides manual resolution.

---

## Required Sections

### Status Summary

Quick overview of the merge state.

Include:
- Overall status: 🟡 YELLOW
- Task being merged
- Source branch → target branch
- Resolution attempts made (should be 3/3)

### Conflicting Files

List all files with conflicts.

For each file:
- File path
- Lines/sections in conflict
- Brief description of what each side changed

### Conflict Details

For each conflicting file, show:

**Feature branch version:**
- What exists in the target branch
- Why it's there (context)

**Task branch version:**
- What the task changed
- Why it was changed

**Why auto-resolution failed:**
- Explain the incompatibility
- Note if both changes are valid and need merging

### Resolution Attempts

Document what was tried:

**Attempt 1: [Strategy name]**
- What was tried
- Result (tests failed, still conflicted, etc.)

**Attempt 2: [Strategy name]**
- What was tried
- Result

**Attempt 3: [Strategy name]**
- What was tried
- Result

### Suggested Manual Resolution

Provide actionable guidance:
- Which changes to keep from each side
- How to merge them correctly
- What to test after resolution

---

## Optional Sections

### Related Tasks

If the conflict involves work from multiple tasks, list them and explain the interaction.

### Risk Assessment

If incorrect resolution could cause issues:
- What could break
- What to verify after resolution

---

## Guidelines for Agent

1. **Be specific** - Show actual code snippets, not just descriptions
2. **Explain context** - Why each side made their changes
3. **Be actionable** - Suggestions should be things someone can actually do
4. **Don't guess** - If you're not sure about the right resolution, say so

---

## Next Steps for User

Options:

- **"Resolve manually"**
  Agent guides you through resolving conflicts in each file, then completes merge.

- **"Skip task"**
  Task moves to backlog. Agent continues with other tasks. You can revisit this task later.

- **"Rebase and retry"**
  Agent rebases the task branch onto latest feature branch with your guidance:
  1. `git checkout vk/{task-branch}`
  2. `git rebase feature/{project}` 
  3. For each conflict: agent shows both versions, you decide which to keep
  4. After clean rebase: merge attempt restarts (fresh 3 attempts)
