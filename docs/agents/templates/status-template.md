# Project Status

This file tracks the current state of the PoC development. Updated by the agent after each phase transition.

---

## Current State

**Project**: [project name from requirements]
**Phase**: [PLANNING | BUILDING | TESTING | REVIEWING | DOCUMENTING | COMPLETE]
**Status**: [IN_PROGRESS | BLOCKED | WAITING_FOR_APPROVAL | COMPLETE]
**Branch**: [current branch name]
**Iteration**: v[N]
**Last Updated**: [timestamp]

---

## Phase Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 1. PLANNING | ⬜ Not started / 🔄 In progress / ✅ Complete | |
| 2. BUILDING | ⬜ Not started / 🔄 In progress / ✅ Complete | |
| 3. TESTING | ⬜ Not started / 🔄 In progress / ✅ Complete / ⚠️ Failed | |
| 4. REVIEWING | ⬜ Not started / 🔄 In progress / ✅ Complete / ⏭️ Skipped | |
| 5. DOCUMENTING | ⬜ Not started / 🔄 In progress / ✅ Complete | |

---

## Checkpoints

### PHASE 1: PLANNING
- [ ] Status initialized
- [ ] Requirements gathered
- [ ] Job stories collected
- [ ] GHERKIN scenarios derived
- [ ] Features grouped
- [ ] External APIs identified
- [ ] Tech stack proposed
- [ ] Plan created (docs/plan.md)
- [ ] **User approved**: [waiting / approved]

### PHASE 2: BUILDING
- [ ] Git branch created
- [ ] Plan read
- [ ] Learnings read (if exists)
- [ ] Code generated
- [ ] .env.example created
- [ ] Migrations applied (if database)

### PHASE 3: TESTING
- [ ] Tests generated
- [ ] Tests run
- [ ] Result: [PASS / FAIL after N attempts]

### PHASE 4: REVIEWING
- [ ] Code reviewed
- [ ] Issues fixed
- [ ] Tests re-run after fixes

### PHASE 5: DOCUMENTING
- [ ] README.md created
- [ ] Dockerfile created (if applicable)
- [ ] CI workflow created
- [ ] Git commit made
- [ ] **User approved**: [waiting / approved / needs rework]

---

## Pending Actions

<!-- Agent: Check this section FIRST each message. Address items before normal flow. -->

Items to address before continuing:

- (none)

<!-- Format for pending items:
- [ ] Add feature: {description} → requires updating Stories/GHERKIN
- [ ] Fix: {description} → specific fix needed
- [ ] Clarify: {question} → need user input
-->

---

## Blocking Issues

List anything blocking progress.

---

## History

| Timestamp | Event |
|-----------|-------|
| | Started PHASE 1 |
| | Completed PHASE 1, waiting for approval |
| | User approved, started PHASE 2 |
| | ... |
