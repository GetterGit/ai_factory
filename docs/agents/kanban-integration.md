# Vibe Kanban Integration

This document describes how AI Factory integrates with [Vibe Kanban](https://www.vibekanban.com/) for task management and parallel execution.

---

## Overview

When you describe what you want to build, the orchestrator:
1. Gathers requirements and creates a plan
2. Decomposes the plan into tasks with dependencies
3. Creates tasks on the Kanban board via MCP
4. Starts worker agents to execute tasks in parallel
5. Auto-reviews completed tasks via reviewer subagent
6. Coordinates human review of approved tasks
7. Merges approved work and generates documentation

---

## Architecture

```
USER
  │
  │ "Build me X"
  ▼
ORCHESTRATOR (Cursor agent in chat)
  │
  ├──── MCP calls ────► VIBE KANBAN (localhost)
  │                           │
  │                           │ spawns via Cursor CLI
  │                           ▼
  │                     WORKERS (Vibe Kanban agents)
  │                           │
  │                           │ task reaches "inreview"
  │                           ▼
  └──── spawns ────────► REVIEWER (Cursor subagent, NOT Kanban agent)
                              │
                              │ approved (agent_reviewed = true)
                              ▼
                        HUMAN REVIEW
                              │
                              │ merged
                              ▼
                        GIT (task branches → feature branch → main)
```

---

## User Commands

These are patterns — the orchestrator understands natural variations.

| Command pattern | What happens |
|-----------------|--------------|
| `status` / `progress` / `check` | Polls Kanban, reports all task statuses |
| `review` | Shows tasks ready for human review (passed auto-review) |
| `Task X looks good` | Approves task, merges branch, unblocks dependents |
| `Task X needs changes: [feedback]` | Rejects task, restarts worker with feedback |
| `start` / `continue` | Starts workers for tasks that are ready to be started 
(status="todo" + all dependencies="done") |

Note: During task execution (Phase 2 below), the orchestrator auto-polls every 1 minute and auto-starts tasks as dependencies complete.

---

## Workflow Phases

### Phase 1: Planning

After plan approval, orchestrator:
1. Verifies `.cursor/rules/` is committed
2. Starts Vibe Kanban if not running
3. Decomposes plan into tasks based on **job stories** from plan.md
4. Identifies dependencies between tasks
5. Creates feature branch: `feature/{project-name}`
6. Creates tasks in Kanban via MCP
7. Saves state to `.vibe-kanban/state.json`
8. Starts task workers via MCP `start_workspace_session` → transitions to Phase 2

### Phase 2: Execution

Orchestrator runs a monitoring loop:

1. **Poll Kanban** every 1 minute via MCP `list_tasks`
2. **On task with `status = inreview` AND `agent_reviewed = false`** (worker just completed):
   - Spawn **Cursor subagent** (not Kanban agent) for code review
   - Subagent checks code against acceptance criteria
   - If issues found:
     - Set `status = "rejected"`, `agent_reviewed = false`
     - Add feedback to task description
     - Restart worker automatically
   - If approved:
     - Set `agent_reviewed = true`
     - Task now ready for human review
3. **Auto-start unblocked tasks:** When a task is merged, check if any blocked tasks now have all dependencies done → start them automatically
4. **Batch human reviews**: Announce when tasks with `agent_reviewed = true` are ready

Loop continues until all tasks need human review or are done.

### Phase 3: Reviewing

Human reviews tasks that passed auto-review.

**Human review eligibility** (ALL must be true):
- `status = "inreview"`
- `agent_reviewed = true` (passed auto-review)
- ALL dependencies have `status = "done"` (merged)

1. User says `review`
2. Orchestrator shows:
   - ✅ REVIEWABLE: passed auto-review + deps done
   - ⏳ PENDING AUTO-REVIEW: `agent_reviewed = false`
   - 🔒 BLOCKED: passed auto-review but deps not done
3. User approves or rejects reviewable tasks

**Approval flow:**
- Validate dependencies
- Merge task branch to feature branch
- Update status → `done`
- Unblock and auto-start dependent tasks

**Rejection flow:**
- Add feedback to task description
- Status → `rejected`, `agent_reviewed = false`
- Cascade block dependent tasks
- Restart worker (will go through auto-review again after completion)

### Phase 4: Documenting

When all tasks are done:
1. Merge feature branch to main
2. Generate README and documentation
3. Cleanup worktrees
4. Show final status

---

## Task Statuses

State.json uses `status` field with extended values, plus `agent_reviewed` flag.

| Status | agent_reviewed | Meaning | Kanban shows |
|--------|----------------|---------|--------------|
| `todo` | - | Not started, ready to begin | `todo` |
| `blocked` | - | Waiting for dependency | `todo` |
| `rejected` | `false` | Failed review, needs rework | `todo` |
| `failed` | - | Worker failed after max retries | `todo` |
| `inprogress` | - | Worker executing | `inprogress` |
| `inreview` | `false` | Worker done, pending AUTO-review | `inreview` |
| `inreview` | `true` | Passed auto-review, ready for HUMAN review | `inreview` |
| `merge_conflict` | `true` | Human approved but merge failed | `inreview` |
| `done` | `true` | Approved and merged | `done` |
| `cancelled` | - | User decided not needed | `cancelled` |

### On Task Cancellation

When user cancels a task:

1. Update Task X status → `cancelled`
2. Check for dependent tasks
3. **Ask user for each dependent:**
   ```
   Task Y depends on cancelled Task X.
   - "Keep Y" → Remove X from Y's dependencies
   - "Cancel Y too" → Cancel recursively
   ```

---

## State Recovery

`state.json` is git-tracked for crash recovery. If session restarts:

1. **Read `state.json`** - contains full metadata (checkpoint, agent_reviewed, rejection_feedback, etc.)
2. **Verify against Kanban** via MCP `list_tasks` - sync any status drift
3. **Resume from checkpoint**
4. Announce: "Recovered {N} tasks from previous session"

---

## Files

| File | Purpose |
|------|---------|
| `.cursor/mcp.json` | MCP server configuration |
| `.cursor/agents/reviewer.md` | Reviewer subagent definition |
| `.vibe-kanban/state.json` | Task state (runtime, git-tracked) |
| `.vibe-kanban/profiles.json` | Worker agent profile configuration |

### State File Format

`.vibe-kanban/state.json` structure:

```json
{
  "project_id": "uuid-from-kanban",
  "feature_branch": "feature/todo-app",
  "last_error": null,
  "checkpoint": {
    "phase": "EXECUTION",
    "last_action": "Started task abc-123",
    "timestamp": "2026-01-23T10:30:00Z"
  },
  "tasks": {
    "abc-123": {
      "title": "Create todo model",
      "description": "Set up Todo data model and CRUD service.\n\nJob Story: When I need to track my tasks, I want to create and store todos, so I can manage my work.",
      "acceptance_criteria": [
        "Given the app needs to store todos, When I create a Todo, Then it has id, title, completed, createdAt fields",
        "Given a Todo exists, When I update it, Then changes are persisted"
      ],
      "status": "rejected",
      "agent_reviewed": false,
      "rejection_feedback": "Missing createdAt field in Todo model",
      "merge_retries": 0,
      "depends_on": ["abc-122"],
      "branch": "vk/abc-123-create-todo-model"
    }
  }
}
```

**Top-level fields:**
- `checkpoint`: Truncation resilience - records last orchestrator action for context recovery
  - `phase`: Current workflow phase
  - `last_action`: Human-readable description of last action
  - `timestamp`: ISO timestamp for debugging

**Task fields:**
- `description`: Full job story text (self-contained)
- `acceptance_criteria`: Full GHERKIN scenarios
- `status`: Extended status enum (see table above)
- `agent_reviewed`: `true` = passed auto-review, `false` = pending or failed auto-review
- `rejection_feedback`: Present when status = rejected (contains reviewer feedback)
- `merge_retries`: Count of merge conflict resolution attempts (max 2, then escalate to human)

---

## Dependency Execution Order

Tasks execute in topological order:
1. Tasks with no dependencies start first
2. When a task completes and is merged, dependents become unblocked
3. Multiple independent tasks run in parallel

### How dependents get parent task code

**Critical**: Dependent tasks must start AFTER their dependencies are merged.

```
1. Task A merged → feature/{project} now contains Task A's code
2. Task B unblocked → orchestrator calls start_workspace_session
3. Vibe Kanban creates worktree from CURRENT feature/{project}
4. Task B's worker sees Task A's code in codebase
```

The orchestrator ensures this by:
- Only calling `start_workspace_session` when ALL dependencies have status = "done"
- Dependencies are merged to feature branch before dependent starts

**If a task is restarted** (after rejection):
- Orchestrator calls `start_workspace_session` again
- Worker continues on existing task branch with rejection feedback
- Any missing code from recently merged tasks is handled at merge time

---

## Error Handling

### MCP Connection Failure
- Retries with exponential backoff (2s, 4s, 8s)
- After 4 attempts, reports failure

### Worker Failure
1. Auto-retry (max 3 total attempts)
2. If still failing:
   - Add failure report to task description
   - Status → `failed`
   - Announce to user
3. User can retry or cancel

### Auto-Review Rejection
- Reviewer subagent finds issues → status = `rejected`, `agent_reviewed = false`
- Feedback appended to task description
- Worker automatically restarts with feedback
- No human intervention needed for code quality issues
- After worker completes again, auto-review runs again (loop until approved or max attempts)

### Merge Conflict
- Auto-resolution attempted (3 strategies)
- If unresolvable: `docs/merge-conflict-report.md`
- Task status → `merge_conflict`

### State Drift
- Orchestrator compares Kanban with state.json on each poll
- Warns user if drift detected

---

## Cost Considerations

- **Multi-agent is cost-efficient**: Each worker has isolated context (doesn't load full codebase)
- **Polling overhead**: ~30K-200K tokens/session depending on task count and duration
