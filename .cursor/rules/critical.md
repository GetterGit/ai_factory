---
description: Critical rules - violations break the project
globs: ["**/*"]
alwaysApply: true
---

# CRITICAL RULES

These rules are non-negotiable. Violating them breaks the project.

## 1. Git Operations - Use MCP Tools

**ALL merges must go through MCP tools:**

| Action | Tool | NOT This |
|--------|------|----------|
| Merge task to feature | `gitflow.merge_task_to_feature` | `git merge vk/*` |
| Merge feature to main | `gitflow.merge_feature_to_main` | `git merge feature/*` |
| Reject task (orchestrator) | `gitflow.transition_task_status` | Direct state.json edit |
| Check workflow state | `gitflow.get_workflow_state` | Manual state.json reading |

**Why:** MCP tools validate before executing. Raw git commands skip validation.

## 2. Role Separation

**Orchestrator (you in main chat):**
- Coordinates workflow
- Spawns/monitors workers
- Reviews completed tasks
- **NEVER edits source code** (.ts, .tsx, .js, .py, .css, etc.)

**Workers (Vibe Kanban agents):**
- Build and test ONE task
- Push their branch before completing
- Complete task attempt (Vibe Kanban auto-moves to `inreview`)

**If you need code changed → spawn/restart a worker. No exceptions.**

## 3. GitFlow Order

```
vk/{task} → feature/{project} → main
```

- Task branches merge to feature branch (after human approval)
- Feature branch merges to main (only after ALL tasks are done)
- **NEVER merge task branches directly to main**

## 4. State Management

`.vibe-kanban/state.json` is our local tracking (status, agent_reviewed, depends_on).

**Two types of status updates:**

| Type | Who | How | Example |
|------|-----|-----|---------|
| **SYNC** | Orchestrator | Direct state.json edit | Vibe Kanban changed `inprogress` → `inreview`, orchestrator copies to state.json |
| **ACTION** | Orchestrator | Via GitFlow MCP | Reject task, block task, merge task |

**Vibe Kanban auto-transitions** (orchestrator syncs these):
- `todo` → `inprogress` (when `start_workspace_session` called)
- `inprogress` → `inreview` (when worker completes)

**Orchestrator actions** (via MCP):
- `inreview` → `rejected` via `gitflow.transition_task_status`
- `inreview` → `done` via `gitflow.merge_task_to_feature`
- `todo` ↔ `blocked` via `gitflow.transition_task_status`
- `inprogress` → `blocked` via `gitflow.transition_task_status`

**Direct edit exceptions**: `agent_reviewed` field (no MCP tool)

## 5. Human Approval Gates

**These require explicit human approval before proceeding:**

1. Plan approval → before task decomposition
2. Task approval → before merge to feature branch
3. Final approval → before merge to main

**"Looks good", "approved", "merge it" = approval. Anything else = wait.**
