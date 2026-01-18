# Failure Report Template

This document is created when tests fail after maximum retry attempts (4). It documents what works, what doesn't, and guides next steps.

---

## Required Sections

### Status Summary

Quick overview of the build state.

Include:
- Overall status: 🟡 YELLOW
- How many features/scenarios working vs failed
- Branch name
- Test attempts made (should be 4/4)

### What Works

List features/components that passed all tests.

Be specific - this helps the user understand what's usable in the current state.

### What Failed

For each failing test or feature, document:

**The Error**
- Which test failed
- The actual error message
- File locations (both source code and test file)

**Fix Attempts**
- What was tried (briefly)
- Why it didn't work (if known)

**Suggested Next Steps**
- What a developer should investigate
- Possible root causes
- Any hunches based on the error pattern

Adapt detail level to complexity - simple failures need less explanation than mysterious ones.

### Test Results Summary

Aggregate view of test outcomes.

Break down by test type if helpful:
- Unit tests: X passed, Y failed
- Integration tests: X passed, Y failed
- API health checks: X passed, Y failed

---

## Optional Sections

### Partial Functionality

If some features work but with limitations, document them.

Example: "Login works but session doesn't persist after refresh"

### Environment Issues

If failures might be environment-related:
- Missing dependencies
- API keys not configured
- Network issues during test

### Workarounds

If there are temporary workarounds the user could apply:
- Manual steps to make it work
- Config changes
- Feature flags to disable broken parts

---

## Guidelines for Agent

1. **Be honest** - Don't minimize failures or oversell what works
2. **Be specific** - Vague reports don't help anyone
3. **Be actionable** - Suggestions should be things someone can actually try
4. **Include error output** - The actual error messages are valuable
5. **Don't blame** - Focus on facts, not excuses

---

## Next Steps for User

At PHASE 5 gate, user will choose:
- **"Looks good"** - Accept partial functionality, merge as-is
- **"Needs rework: {feedback}"** - Create learnings.md, iterate

This report helps the user make that decision.
