# AI Factory

A Cursor-based multi-agent workflow for building proof-of-concept apps with parallel task execution.

## What This Is

A structured workflow that orchestrates multiple AI agents through planning, execution, reviewing, and documenting. The orchestrator decomposes your request into tasks, manages them on a Kanban board, spawns parallel workers to build each task, and coordinates reviews before merging.

## Quick Start

1. **Clone/copy this template** into a new project folder
2. **Open in Cursor** (Agent mode)
3. **Describe what you want to build**

```
I want to build [your idea]. 

Job stories:
- When [situation], I want to [action], so I can [outcome]
- When [situation], I want to [action], so I can [outcome]
```

The orchestrator will:
- Create `docs/status.md` to track progress
- Ask clarifying questions
- Derive testable GHERKIN scenarios from your job stories
- Propose tech stack (waits for your approval)
- Generate `docs/plan.md` with full specification
- **Stop and wait for your approval before execution**
- Decompose plan into tasks on Kanban board
- Spawn workers to build tasks in parallel
- Auto-review completed tasks
- Present tasks for your human review

## Structure

```
your-project/
├── .cursor/
│   ├── rules/
│   │   └── workflow.md              # Main workflow (auto-loaded)
│   ├── agents/
│   │   └── reviewer.md              # Reviewer subagent definition
│   └── mcp.json                     # Vibe Kanban MCP config
├── .vibe-kanban/
│   ├── profiles.json                # Worker agent configuration
│   └── state.json                   # Task state (created at runtime)
├── docs/
│   ├── agents/
│   │   ├── checklist.md             # Planning guide
│   │   ├── usage-guide.md           # This file
│   │   ├── kanban-integration.md    # Kanban reference docs
│   │   └── templates/
│   │       ├── plan-template.md
│   │       ├── status-template.md
│   │       ├── learnings-template.md
│   │       ├── failure-report-template.md
│   │       └── merge-conflict-report-template.md
│   ├── status.md                    # Created by agent - tracks phase
│   └── plan.md                      # Created by agent - specification
└── README.md                        # Replaced by agent in Phase 4
```

## Workflow Phases

| Phase | Name | Actor | What Happens | Human Input |
|-------|------|-------|--------------|-------------|
| **1** | PLANNING | Orchestrator | Gather requirements, job stories, GHERKIN scenarios, propose stack, decompose into tasks | Approve plan |
| **2** | EXECUTION | Workers (parallel) | Build + test each task, orchestrator monitors with 1 min polling | - |
| **3** | REVIEWING | Orchestrator + Reviewer | Auto-review by subagent → Human review → Merge | Approve or reject tasks |
| **4** | DOCUMENTING | Orchestrator | Final merge to main, generate README, cleanup | - |

## Agent Architecture

| Agent | Role | Where Defined |
|-------|------|---------------|
| **Orchestrator** | Manages workflow, spawns workers, coordinates reviews. **NEVER writes code** - delegates all coding to workers. | Main Cursor chat |
| **Workers** | Build + test individual tasks in parallel. Push code before completing. | `.vibe-kanban/profiles.json` |
| **Reviewer** | Auto-reviews code against acceptance criteria | `.cursor/agents/reviewer.md` |

## Human Approval Gates

The orchestrator **stops and waits** at:

1. **After Planning** - Review `docs/plan.md` before execution starts
2. **During Review** - Approve/reject each completed task

## Git Flow

```
main
  │
  └── feature/{project-name}     ← All task branches merge here
        │
        ├── vk/task-1-...        ← Worker 1's branch
        ├── vk/task-2-...        ← Worker 2's branch
        └── vk/task-3-...        ← Worker 3's branch

After all tasks approved:
  feature/{project-name} → main
```

## Task Review Flow

When tasks reach "In Review":

```
Worker completes task (pushes code first) → Auto-review by reviewer subagent
    ↓
If issues → Feedback appended (#1, #2...), worker restarts
    ↓
If approved → Ready for human review
    ↓
You review: "approve" or "needs changes: [feedback]"
    ↓
Approved → Merged to feature branch → pushed → status = done
Rejected → Feedback appended (preserved as history), worker restarts
```

**Note:** All feedback is preserved as numbered history (#1, #2, #3...) - never overwritten.

## User Commands

During execution, you can:
- `status` - See current task progress
- `review` - See tasks ready for review
- `test task X` - Start dev server to test task locally
- `approve task X` - Approve a reviewed task
- `task X needs changes: [feedback]` - Reject with feedback

## Project Modes

### New Project (Default)
Start fresh with your requirements.

### Existing Project
If you add AI Factory to an existing codebase, the orchestrator will:
1. Analyze existing code and tech stack
2. Ask what NEW features you want
3. Plan only the new work

### Incremental Feature
If project is complete but you want to add a feature:
1. Describe the new feature
2. Orchestrator creates incremental job stories
3. Adds new tasks to existing Kanban board

## Generated Files

| File | When | Purpose |
|------|------|---------|
| `docs/status.md` | Phase 1 start | Tracks current phase |
| `docs/plan.md` | Phase 1 end | Full specification |
| `.vibe-kanban/state.json` | Phase 1 end | Task state and checkpoints |
| `docs/learnings.md` | On rework | Captures feedback |
| `docs/failure-report.md` | If task fails after retries | Documents issues |
| `README.md` | Phase 4 | Project documentation |

## Requirements

- **Cursor** with Agent mode
- **Claude API access** (Opus 4.5 recommended)

## License

MIT
