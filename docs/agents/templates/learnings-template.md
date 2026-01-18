# Learnings Template

This document captures feedback from a rework request. Use it to guide the next iteration.

---

## Required Sections

### User Feedback

Quote the user's exact feedback that triggered the rework.

> [paste user's "Needs rework: ..." message here]

### What Worked

List things that should be PRESERVED in the next iteration.

Be specific - reference files, components, or behaviors that the user was happy with or that work correctly.

Purpose: Prevent the agent from "fixing" things that aren't broken.

### What Needs Fixing

List issues that need to be addressed, with enough detail to act on.

For each issue:
- **Location**: Where is the problem (file, component, function)
- **Problem**: What's wrong
- **Expected**: What it should do instead
- **Priority**: High / Medium / Low

Order by priority - tackle High items first.

### Do NOT Change

Explicit protection list.

Things the user specifically wants preserved exactly as-is, even if the agent thinks they could be "improved."

Purpose: Respect user preferences and prevent over-engineering.

---

## Optional Sections

### New Requirements

Things discovered during review that weren't in the original plan.

If the user's feedback implies new features or changes to scope, document them here.

### Technical Notes

Context that might help with fixes:
- Debugging information
- API quirks discovered
- Environment-specific issues

### Root Cause Analysis

If multiple issues share a root cause, note it here to fix systematically rather than symptom-by-symptom.

---

## Guidelines for Agent

1. **Read this file FIRST** before making any changes in the next iteration
2. **Preserve "What Worked"** - don't touch these unless fixing something else breaks them
3. **Respect "Do NOT Change"** - these are explicit user preferences
4. **Fix High priority first** - don't get distracted by Medium/Low until High is done
5. **Verify fixes** - after changes, re-run tests to ensure nothing broke
6. **Confirm before proceeding** - list planned changes and get user confirmation

---

## Iteration Tracking

- Previous branch: [branch name]
- New branch: [new branch name]
- Iteration: v[N] → v[N+1]
