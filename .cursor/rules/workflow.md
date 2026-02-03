---
description: Development workflow
globs: ["**/*"]
alwaysApply: true
---

# Workflow

> **Read `.cursor/rules/critical.md` first. Those rules override everything here.**

This file defines the AI Factory workflow for:
- **Orchestrator** (main Cursor agent) - coordinates everything
- **Workers** (Vibe Kanban agents) - build individual tasks
- **Reviewer** (Cursor subagent) - reviews completed work

Workers: skip to "WORKER" section.

---

# ORCHESTRATOR

## On Every Response

1. **Read `docs/status.md`** (if exists) to determine current phase
2. **If Phase 2 or later**: Also read `docs/plan.md` for context
3. **If `.vibe-kanban/state.json` exists**: Check workflow state via MCP:
   ```
   Call: gitflow.get_workflow_state
   ```
4. **State current phase**: [PHASE: PLANNING], [PHASE: EXECUTION], [PHASE: REVIEWING], or [PHASE: DOCUMENTING]

## Phases Overview

| Phase | Name | Actor | Description |
|-------|------|-------|-------------|
| 1 | PLANNING | Orchestrator | Requirements → Plan → Decompose → Create tasks |
| 2 | EXECUTION | Workers | Build + Test per task, orchestrator monitors |
| 3 | REVIEWING | Orchestrator | Auto-review → Human review → Merge via MCP |
| 4 | DOCUMENTING | Orchestrator | Final merge to main via MCP → README |

---

## Phase 1: PLANNING

### Pre-setup (first run only)

If `.vibe-kanban/state.json` does NOT exist (fresh project):

```bash
# Install GitFlow Enforcer dependencies
cd tools/gitflow-enforcer && npm install && cd ../..

# Install git hooks (safety net)
./scripts/install-hooks.sh
```

**If pre-setup fails:**
- npm install fails → Check Node.js 18+ installed, check network
- install-hooks.sh fails → Check script permissions (`chmod +x`)
- Inform user with error details before proceeding

Skip pre-setup if `.vibe-kanban/state.json` already exists.

### Pre-check: Rework iteration?

If `docs/learnings.md` exists, this is a rework iteration:
- **Read learnings.md FIRST** before any planning
- Preserve "What Worked" and "Do NOT Change" sections
- Focus on "What Needs Fixing" items by priority
- Confirm planned approach with user before proceeding

### Steps 1-8: Requirements to Plan

**Reference:** See `docs/agents/checklist.md` for detailed formats and examples.

1. **Initialize** `docs/status.md` from template (skip if rework - already exists)
2. **Gather requirements**: project_name, what_to_build, target_audience, problems_solved, auth, UI/UX refs
3. **Gather job stories** (When/I want/So I can)
4. **Convert to GHERKIN scenarios** (Given/When/Then)
5. **Derive features** from scenarios
6. **Identify external APIs**
7. **Propose tech stack**
8. **Create `docs/plan.md`**, show summary, **STOP for approval**

⛔ **MANDATORY HUMAN APPROVAL** - Wait for "Approved", "Build this", etc.

### Step 9: Local Environment Setup

If database in tech stack, set up local development environment.

**Reference:** See `docs/agents/checklist.md` → "Local Environment Setup"

### Step 10: Decompose into Tasks

1. Create feature branch via MCP:
   ```
   Call: gitflow.create_feature_branch
   Args: { project_name: "{name}" }
   ```
2. Map job stories to tasks with dependencies
3. Create tasks via `vibe_kanban.create_task`
4. Create `.vibe-kanban/state.json` with matching task entries (status, depends_on, agent_reviewed)

### Step 11: Start Execution

1. Identify startable tasks (status=todo + all deps done)
2. For each startable task:
   ```
   Call: vibe_kanban.start_workspace_session
   Args: { task_id: "{id}", executor: "CURSOR_AGENT", repos: [...] }
   ```
   *(Vibe Kanban automatically moves task to `inprogress`)*
3. Copy `.env.local` to worktrees:
   ```bash
   cp .env.local /tmp/vibe-kanban/worktrees/{task-id}/{repo}/.env.local 2>/dev/null || true
   ```
4. Update `docs/status.md`: Phase → EXECUTION
5. Transition to Phase 2

---

## Phase 2: EXECUTION

Orchestrator monitors while workers build.

### Execution Loop

1. **Poll** via `vibe_kanban.list_tasks` every 1 minute

2. **Sync status from Vibe Kanban to state.json** (direct edit, not MCP):
   - Compare each task's status in Vibe Kanban vs state.json
   - If different, update state.json to match Vibe Kanban
   - *(This is SYNC, not ACTION - just copying what Vibe Kanban already changed)*

3. **On task in `pending_auto_review`** (status=`inreview`, `agent_reviewed=false`):
   - Spawn Cursor subagent (reviewer) to check code against acceptance criteria
   - If reviewer returns APPROVED:
     - Edit state.json: set task's `agent_reviewed = true` *(exception: no MCP tool for this)*
     - Task moves to `pending_human_review` category
   - If reviewer returns issues:
     - Follow same rejection procedure as Phase 3 (append feedback, set rejected, restart worker)

4. **Announce** when `pending_human_review` is non-empty:
   ```
   📋 {N} tasks ready for human review. Say "review" to see them.
   ```

5. **Start any `ready_to_start` tasks** (deps done, status=todo):
   - Call `vibe_kanban.start_workspace_session` for each
   - *(Vibe Kanban automatically moves them to `inprogress`)*

6. **Continue loop** until no tasks remain in `in_progress` AND no tasks in `pending_auto_review`

### Phase 2 ↔ Phase 3 (Overlap)

Phases 2 and 3 run **concurrently** in practice:
- Workers build tasks (Phase 2 activity)
- Human reviews completed tasks (Phase 3 activity)

When first task reaches `pending_human_review`:
- Update `docs/status.md`: Phase → REVIEWING
- Continue the execution loop (poll, sync, start new workers, auto-review)
- Handle human review commands as they come

### User Commands (available during Phase 2 and 3)

| Command | Action |
|---------|--------|
| `status` | Show all task states |
| `review` | Show tasks ready for human review |
| `Task X looks good` | Approve → merge via MCP |
| `Task X needs changes: [feedback]` | Reject → restart worker |

---

## Phase 3: REVIEWING

### On "review" command

Use MCP to get current state:
```
Call: gitflow.get_workflow_state
```

Present tasks by category (from `get_workflow_state` response):
- **pending_human_review**: Ready for your review
- **pending_auto_review**: Awaiting auto-review by subagent
- **in_progress**: Workers currently building
- **ready_to_start**: Deps done, can be started
- **blocked**: Dependencies not done or explicitly blocked
- **rejected**: Awaiting worker restart
- **done**: Already merged to feature branch
- **cancelled**: Intentionally skipped

### On task approval ("looks good", "approved", "merge")

**Use MCP tool - do not run raw git commands:**

```
Call: gitflow.merge_task_to_feature
Args: { task_id: "{id}" }
```

The tool handles:
- Validation (status, agent_reviewed, dependencies, branch)
- Merge execution
- Conflict detection (returns error if conflict)
- State update (status → done) in `.vibe-kanban/state.json`
- Finding unblocked tasks

**If tool returns success:**
- Task is done
- Check for newly unblocked tasks, start them (return to Phase 2 loop)

**If tool returns error:**
- **Validation error** → address the issue (missing review, dependencies, etc.)
- **Merge conflict** → inform user, options:
  1. "Resolve manually" - guide through resolution
  2. "Restart worker" - worker rebases and resolves
  3. "Skip task" - move to backlog, continue with others
  
  If 3 resolution attempts fail, create merge conflict report using template.

### On task rejection ("needs changes: [feedback]")

1. Append feedback to task description via `vibe_kanban.update_task`:
   ```
   {KEEP ENTIRE ORIGINAL DESCRIPTION - job story, acceptance criteria, everything}
   
   {KEEP ALL PREVIOUS FEEDBACK SECTIONS - they are history}
   
   ---
   
   ## Reviewer Feedback #{N} (human)
   
   {feedback}
   ```

2. Update task status via MCP:
   ```
   Call: gitflow.transition_task_status
   Args: { task_id: "{id}", new_status: "rejected" }
   ```
   Tool also resets `agent_reviewed = false` in `.vibe-kanban/state.json`

3. Restart worker via `vibe_kanban.start_workspace_session`
   - Vibe Kanban sees "start task" → moves to `inprogress`
   - Next poll cycle syncs `inprogress` to state.json (overwrites `rejected`)

4. Continue execution loop (handles both building workers and human reviews)

### On all tasks done

Before transitioning to Phase 4, verify:

1. **Check via MCP:**
   ```
   Call: gitflow.get_workflow_state
   ```
   Confirm all tasks finished:
   - `done` + `cancelled` = all tasks
   - No tasks with status: `todo`, `blocked`, `inprogress`, `inreview`, `rejected`

2. **Announce completion:**
   ```
   ✅ All {N} tasks completed and merged to feature branch.
   Ready to merge to main and generate documentation.
   Proceeding to Phase 4...
   ```

3. Update `docs/status.md`: Phase → DOCUMENTING

4. Transition to Phase 4

---

## Phase 4: DOCUMENTING

### Step 1: Final Merge

**Use MCP tool - do not run raw git commands:**

```
Call: gitflow.merge_feature_to_main
```

The tool validates all tasks are done before merging.

### Step 2: Generate Docs

1. Generate README.md (replaces template)
2. Show .env setup instructions
3. Generate Dockerfile (if applicable)
4. Generate CI workflow

### Step 3: Show Final Status

```
BUILD COMPLETE
Status: 🟢 GREEN
Branch: main

To run locally: [commands]
Environment: cp .env.example .env.local
```

⛔ **MANDATORY HUMAN APPROVAL**

- "Looks good" → Show deploy instructions, END
- "Needs rework" → Follow rework procedure below

### Rework Procedure

When user requests rework:

1. **Create `docs/learnings.md`** from `docs/agents/templates/learnings-template.md`
2. **Fill required sections:**
   - **User Feedback**: Quote exact feedback
   - **What Worked**: List things to PRESERVE (prevent breaking working code)
   - **What Needs Fixing**: Location, problem, expected behavior, priority
   - **Do NOT Change**: Explicit protection list from user preferences
3. **Update `docs/status.md`**: Set phase back to PLANNING, note rework reason
4. **Return to Phase 1** - the Pre-check will detect learnings.md

---

## Error Handling

If something fails:
1. Log to `docs/status.md`
2. Inform user with details
3. Suggest options (retry, skip, alternative)
4. Wait for user decision

---

## Existing Project / Incremental Feature

**Existing project** (code exists, no plan.md):
1. Analyze codebase
2. Ask what NEW features to add
3. Create job stories for new work only
4. Proceed to normal planning

**Incremental feature** (plan.md exists, user wants more):
1. Create new job stories
2. Append to plan.md with [INCREMENTAL] tag
3. Decompose and add tasks
4. Resume execution

---

# WORKER

**If your `append_prompt` says "You are an AI Factory WORKER agent", this section is for you.**

## On Start

1. Read task description from Kanban (job story + acceptance criteria)
2. Read `docs/plan.md` for project context
3. Begin building

## Scope

**BUILDING:**
- Read requirements from task description
- Generate code to fulfill the task
- Commit changes to your task branch

**TESTING:**
- Generate tests from acceptance criteria
- Run tests, fix failures (max 3 attempts)
- If still failing: document in task description, complete anyway (Vibe Kanban auto-moves to `inreview`)

**MERGE CONFLICT** (if task description contains conflict info):
- Fetch and rebase on feature branch
- Resolve conflicts keeping your logic
- Re-run tests
- Push and complete (Vibe Kanban auto-moves to `inreview`)

## On Completion

1. Commit all changes
2. **Push to remote**: `git push origin HEAD`
3. Complete task attempt (Vibe Kanban auto-moves to `inreview`)
4. **STOP**

## Do NOT

- Perform code review aside from tests
- Write documentation
- Merge branches
- Work on other tasks
- Interact with user

---

# REVIEWER

The reviewer is a Cursor subagent defined in `.cursor/agents/reviewer.md`.

- Spawned when task reaches `inreview` with `agent_reviewed = false`
- Checks code against acceptance criteria
- Returns "APPROVED" or issues list
- Does NOT modify files or run tests

---

# REFERENCE

## Task Statuses

### Who Changes What

| Transition | Who Does It | How |
|------------|-------------|-----|
| `todo` → `inprogress` | **Vibe Kanban** | Auto when `start_workspace_session` called |
| `inprogress` → `inreview` | **Vibe Kanban** | Auto when worker completes |
| `rejected` → `inprogress` | **Orchestrator sync** | After `start_workspace_session`, sync overwrites `rejected` |
| `inreview` → `rejected` | **Orchestrator** | `gitflow.transition_task_status` |
| `inreview` → `done` | **Orchestrator** | `gitflow.merge_task_to_feature` |
| `todo` ↔ `blocked` | **Orchestrator** | `gitflow.transition_task_status` |
| `inprogress` → `blocked` | **Orchestrator** | `gitflow.transition_task_status` |
| Any → `cancelled` | **Orchestrator** | `gitflow.transition_task_status` |

### Sync vs Action

- **SYNC**: Orchestrator polls Vibe Kanban, updates state.json to match (direct edit)
- **ACTION**: Orchestrator makes a decision, uses MCP tool (validates before executing)

### Rejection Flow

```
inreview → rejected → inprogress → inreview → ...
    ↑          ↑           ↑
    │     Orchestrator     └── Orchestrator sync (VK sees "start" → inprogress)
    │     (MCP action)
```

1. Orchestrator sets `rejected` via `gitflow.transition_task_status` (state.json only)
2. Orchestrator restarts worker via `vibe_kanban.start_workspace_session`
3. Vibe Kanban moves to `inprogress` (it doesn't know about `rejected`)
4. Orchestrator syncs `inprogress` to state.json (overwrites `rejected`)

### `get_workflow_state` Categories

The MCP tool groups tasks into actionable categories:

| Category | Condition |
|----------|-----------|
| `ready_to_start` | status=`todo` AND all dependencies `done` |
| `blocked` | status=`blocked` OR (status=`todo` AND deps not done) |
| `in_progress` | status=`inprogress` |
| `pending_auto_review` | status=`inreview` AND `agent_reviewed=false` |
| `pending_human_review` | status=`inreview` AND `agent_reviewed=true` |
| `rejected` | status=`rejected` |
| `done` | status=`done` |
| `cancelled` | status=`cancelled` |

## MCP Tools

### GitFlow Enforcer (`gitflow.*`)

For orchestrator ACTIONS (not syncing). Updates `.vibe-kanban/state.json` atomically.

| Tool | When to Use |
|------|-------------|
| `get_workflow_state` | Check current state, actionable tasks |
| `create_feature_branch` | After plan approval (Step 10) |
| `merge_task_to_feature` | Human approves a task → `done` |
| `merge_feature_to_main` | Phase 4, all tasks done |
| `transition_task_status` | Reject (`inreview`→`rejected`), block (`todo`/`inprogress`↔`blocked`) |

### Vibe Kanban (`vibe_kanban.*`)

| Tool | When to Use |
|------|-------------|
| `list_tasks` | Poll task statuses |
| `create_task` | Decompose plan into tasks |
| `update_task` | Add feedback to task description |
| `start_workspace_session` | Start/restart worker |

## Templates

All templates are in `docs/agents/templates/`.

| Template | Creates | When |
|----------|---------|------|
| `status-template.md` | `docs/status.md` | Phase 1 Step 1 |
| `plan-template.md` | `docs/plan.md` | Phase 1 Step 8 |
| `failure-report-template.md` | Task description | Worker test failure |
| `learnings-template.md` | `docs/learnings.md` | Rework requested |
| `merge-conflict-report-template.md` | Task description | Merge conflict after 3 attempts |

## Agent Configuration

| Agent | Config | Model |
|-------|--------|-------|
| Worker | `.vibe-kanban/profiles.json` | claude-opus-4-5-20251101 |
| Reviewer | `.cursor/agents/reviewer.md` | Opus 4.5 |
