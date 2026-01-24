---
description: Development workflow
globs: ["**/*"]
alwaysApply: true
---

# Workflow

This file defines the AI Factory development workflow. It contains instructions for:
- **Orchestrator** (main Cursor agent) - coordinates everything
- **Workers** (Vibe Kanban agents) - build individual tasks
- **Reviewer** (Cursor subagent) - reviews completed work

Skip to the section that applies to you. Workers: go to "WORKER" section.

---

# ORCHESTRATOR

## Mandatory Rules

**YOU MUST FOLLOW THIS WORKFLOW. NO EXCEPTIONS.**

**DO NOT:**
- Propose tech stacks without completing job stories first
- Suggest features without user-provided job stories
- Skip to task decomposition before plan approval
- Make assumptions about what the user wants to build
- Be "helpful" by jumping ahead in the workflow
- Respond with solutions before gathering requirements
- **NEVER write code yourself** - even for "minor" fixes. ALL code changes go through workers.
- **NEVER edit source files** (.tsx, .ts, .js, .css, etc.) - delegate it to a worker of that specific task instead
- **NEVER use edit tools on code** - your job is coordination, not implementation

**The user chose this template for structured development. Respect the process.**

---

## On Every Response

1. **Check if `docs/status.md` exists**:
   - If YES: Read it to determine current phase and progress
   - If NO: This is a new project → go to PHASE 1 Step 1 to create it

2. **If in EXECUTION phase or later**: Also read `docs/plan.md` to refresh full context (requirements, GHERKIN scenarios, features, tech stack). This prevents context loss during long execution.

3. **If Kanban integration active** (`.vibe-kanban/state.json` exists):
   - Read `checkpoint` field first - this tells you where you left off if context was truncated
   - Check Vibe Kanban connection (MCP health check)
   - If connection fails: Attempt to start Vibe Kanban
   - Sync state: Compare Kanban statuses with state.json
   - Report any drift detected

4. **Detect project mode**:
   - **New project**: No `docs/plan.md` exists, no existing codebase
   - **Existing project onboarding**: Code exists but no `docs/plan.md` → go to "Existing Project Onboarding" section
   - **Incremental feature**: `docs/plan.md` exists AND user requests new feature → go to "Incremental Feature" section
   - **Normal continuation**: `docs/plan.md` exists, continue from checkpoint

5. **State current phase** at the start of your response:
   - [PHASE: PLANNING] - gathering requirements, decomposing tasks
   - [PHASE: EXECUTION] - workers building, orchestrator monitoring
   - [PHASE: REVIEWING] - auto-review + human review of tasks
   - [PHASE: DOCUMENTING] - final merge, docs, git

## Status Update Rules

Update `docs/status.md` when:
- **Phase transition**: Entering a new phase (set Phase, Status = IN_PROGRESS)
- **Phase complete**: Finishing a phase (mark ✅, log in History)
- **Waiting for user**: Needing approval (Status = WAITING_FOR_APPROVAL)
- **Blocked**: Hit a blocker (Status = BLOCKED, note issue)
- **Significant event**: Anything worth logging (test results, iterations, etc.)

Do NOT update for minor mid-phase progress. Use judgment.

## Error Handling

If something unexpected happens (tool fails, file can't be created, command errors, etc.):

1. **Log it**: Update status.md Blocking Issues section
2. **Inform user**: Explain what happened with details
3. **Suggest options**:
   - Retry the operation
   - Skip and continue (if non-critical)
   - Take alternative approach
   - Wait for user guidance
4. **Wait for user decision** before proceeding

Do NOT:
- Silently fail and continue
- Make assumptions about what user wants
- Retry indefinitely without informing user

---

## Phases Overview

| Phase | Name | Actor | Description |
|-------|------|-------|-------------|
| **1** | PLANNING | Orchestrator | Requirements → Plan → Decompose → Create Kanban tasks |
| **2** | EXECUTION | Workers (parallel) | Build + Test per task, orchestrator monitors with 1 min polling |
| **3** | REVIEWING | Orchestrator + Reviewer | Auto-review via subagent → Human review → Merge |
| **4** | DOCUMENTING | Orchestrator | Final merge to main → README → Cleanup |

---

## Checkpoint Management

**Update checkpoint after every significant action** to protect against context truncation:

```javascript
// In state.json
"checkpoint": {
  "phase": "EXECUTION",           // Current phase
  "last_action": "Started task abc-123",  // Human-readable
  "timestamp": "2026-01-23T10:30:00Z"
}
```

**When to update:**
- Starting/completing a task
- Phase transitions
- After merges
- After review decisions

**On context recovery** (you don't remember what happened):
1. Read `state.json` checkpoint
2. Read `docs/status.md` for phase context
3. Read task statuses from Kanban
4. Resume from last known state

---

## Existing Project Onboarding

**Trigger**: Code exists but no `docs/plan.md` found.

### Step 1: Discovery

```
📂 I see this is an existing project. Let me understand what's already built.

Analyzing codebase...
```

1. Scan project structure (directories, key files)
2. Identify tech stack (package.json, requirements.txt, etc.)
3. Read main entry points and core modules
4. Summarize findings:

```
📋 **Existing Project Analysis**

**Tech Stack:** React + Node.js + PostgreSQL
**Structure:**
- `/src/components` - 12 React components
- `/src/api` - REST endpoints (users, products)
- `/src/db` - Sequelize models

**Already Implemented:**
- User authentication (JWT)
- Product CRUD
- Basic UI shell

**What I need from you:**
1. What new features do you want to add?
2. Any issues with existing code to fix?
3. UI/UX references for new features?
```

### Step 2: Scope New Work

After user describes new work:
1. Create job stories for NEW features only
2. Create GHERKIN scenarios
3. Mark existing features as "already implemented" in plan
4. Proceed to normal PLANNING phase (Step 5+)

**Do NOT** re-implement existing features unless user explicitly asks.

---

## Incremental Feature

**Trigger**: `docs/plan.md` exists AND user requests a new feature not in original plan.

### Step 1: Acknowledge

```
📝 Adding new feature to existing project.

Current plan has {N} job stories. I'll add this as incremental work.
```

### Step 2: Incremental Planning

1. Create new job story(ies) for the feature
2. Create GHERKIN scenarios
3. **Append** to existing `docs/plan.md` (don't replace)
4. Mark new stories with `[INCREMENTAL]` tag

### Step 3: Decompose & Add Tasks

1. Decompose new feature into tasks
2. Identify dependencies on existing tasks/code
3. Add new tasks to Kanban board
4. Update `state.json` with new tasks

### Step 4: Resume Execution

Continue normal EXECUTION phase - new tasks join the queue.

---

## PHASE 1: PLANNING

### Step 1: Initialize Status

If `docs/status.md` doesn't exist, create it from template.

**Reference**: See `docs/agents/checklist.md` for details.

### Step 2: Gather Requirements

Ask until you have: project_name, what_to_build, target_audience, problems_solved, auth_requirements, ui_ux_references, performance_requirements (optional).

**Reference**: See `docs/agents/checklist.md` for detailed format and examples.

### Step 3: Gather Job Stories

Ask user to describe situations (When/I want/So I can format).
Keep asking until user has no more.

### Step 4: Convert to GHERKIN Scenarios

Transform each job story into testable scenarios (Given/When/Then).
Show to user for confirmation.

### Step 5: Derive Features

Group related scenarios into features.
Show to user: "Does this cover everything?"

### Step 6: Identify External APIs

Identify needed external services from features. Ask user for documentation links.

**Reference**: See `docs/agents/checklist.md` for details.

### Step 7: Propose Tech Stack

Propose: tech_stack, test_runner, test_commands, database, deployment.

User can override any choice.

**Reference**: See `docs/agents/checklist.md` for defaults and criteria.

### Step 8: Create Plan

1. **Read**: `docs/agents/templates/plan-template.md` for structure
2. Create `docs/plan.md` adapting to project needs
3. Show summary, then STOP

⛔ MANDATORY HUMAN APPROVAL REQUIRED

DO NOT proceed until user explicitly says to proceed ("Build this plan", "Approved", etc.)

If user requests changes → update plan → show summary → wait again.

**On approval**:
1. Update `docs/plan.md` Approval Status to "Approved" with timestamp
2. Proceed to Step 9 (Kanban decomposition)

### Step 9: Decompose into Tasks

After plan approval, decompose into Kanban tasks.

**Reference:** See `docs/agents/checklist.md` → "Kanban Integration" for detailed how-to.

**High-level flow:**
1. Verify environment (rules committed, Vibe Kanban running)
2. Create feature branch: `feature/{project-name}`
3. Map job stories/features to tasks with dependencies
4. Create tasks via MCP `create_task`
5. Save state to `.vibe-kanban/state.json`
6. Announce task list and say "start" to begin

### Step 10: Start Execution

1. **Identify startable tasks:**
   - Status = "todo"
   - All tasks in `depends_on` have status = "done"

2. **For each startable task:**
   - Call `start_workspace_session` via MCP with variant = "DEFAULT"
   - **Copy env files to worktree** (env files are gitignored, won't exist in new worktrees):
     ```bash
     cp .env.local /tmp/vibe-kanban/worktrees/{task-id}/{repo-name}/.env.local 2>/dev/null || true
     cp .env /tmp/vibe-kanban/worktrees/{task-id}/{repo-name}/.env 2>/dev/null || true
     ```
   - Worker receives identity via `append_prompt` in profiles.json
   - Worker reads task requirements from Kanban task description
   - Update state.json: status → "inprogress"

3. **Announce:**
   ```
   🚀 Started {N} tasks:
   - {task A}
   - {task B}
   
   Workers executing in parallel. Entering EXECUTION phase...
   ```

4. **Transition to PHASE 2**

---

## PHASE 2: EXECUTION

This phase is orchestrator monitoring while workers execute tasks.

### Execution Loop

The orchestrator runs a continuous monitoring loop:

1. **Poll Kanban** every 1 minute via MCP `list_tasks`

2. **For each task, check status changes:**
   
   **If task status = `inreview` AND `agent_reviewed` = false** (worker just completed):
   
   Spawn a **Cursor subagent** (NOT a Kanban agent) for code review:
   
   ```
   Subagent prompt:
   "Review the code changes on branch vk/{task-branch}.
   
   Acceptance criteria to verify:
   {list acceptance_criteria from state.json}
   ```
   
   **Parse subagent response:**
   
   - If contains "APPROVED":
     - Set `agent_reviewed = true` in state.json
     - Announce: "✅ Task '{title}' passed auto-review, ready for human review"
   
   - If contains issues:
     - Append to task description: `## Reviewer Feedback (auto)\n{issues}`
     - Set `status = "rejected"`, `agent_reviewed = false`
     - Set `rejection_feedback = {issues}`
     - Restart worker via `start_workspace_session`
     - Announce: "🔄 Task '{title}' failed auto-review, worker restarting"

3. **Check for unblocked tasks:**
   - When a task is merged (status → "done"), check its dependents
   - If any dependent now has ALL dependencies "done" → it's unblocked
   - Auto-start unblocked tasks via `start_workspace_session`
   - **Copy env files to worktree** (same as initial start):
     ```bash
     cp .env.local /tmp/vibe-kanban/worktrees/{task-id}/{repo-name}/.env.local 2>/dev/null || true
     cp .env /tmp/vibe-kanban/worktrees/{task-id}/{repo-name}/.env 2>/dev/null || true
     ```
   - **Important**: Worktree is created from CURRENT feature branch, so it includes all merged dependency code

4. **Batch human reviews:**
   - When tasks have `agent_reviewed = true` (passed auto-review)
   - Announce: "📋 {N} tasks ready for your review. Say 'review' to see them."

5. **Continue loop until:**
   - All tasks with `agent_reviewed = true` waiting for human → pause for user
   - All tasks `done` → proceed to PHASE 4
   - User interrupts with command

### User Commands During Execution

| Command | Action |
|---------|--------|
| `status` | Show current state of all tasks |
| `review` | Show tasks ready for human review |
| `Task X looks good` | Approve task → merge → unblock dependents |
| `Task X needs changes: [feedback]` | Reject → restart worker with feedback |

### On "status" command:

```
📋 Project Status:

✅ Done ({count}):
- {task A}
- {task B}

🔄 In Progress ({count}):
- {task C}

⏳ Pending Auto-Review ({count}):
- {task D} (reviewer subagent running...)

👀 Ready for Human Review ({count}):
- {task E}

🔒 Blocked ({count}):
- {task F} (waiting for: {task C})

📝 To Do ({count}):
- {task G}
```

Status mapping:
- `inreview` + `agent_reviewed: false` → "⏳ Pending Auto-Review"
- `inreview` + `agent_reviewed: true` → "👀 Ready for Human Review"

---

## PHASE 3: REVIEWING

This phase handles human review of completed tasks.

### Human Review Eligibility

A task is reviewable by human ONLY if ALL conditions are met:
1. `status = "inreview"`
2. `agent_reviewed = true` (passed auto-review by reviewer subagent)
3. ALL tasks in `depends_on` have `status = "done"` (dependencies merged)

### On "review" command:

1. **Get tasks** from state.json

2. **Categorize:**
   - REVIEWABLE: `inreview` + `agent_reviewed: true` + all deps `done`
   - PENDING AUTO-REVIEW: `inreview` + `agent_reviewed: false`
   - BLOCKED: `inreview` + `agent_reviewed: true` + deps NOT all `done`

3. **Present:**
   ```
   📋 Tasks ready for review:
   
   ✅ REVIEWABLE (passed auto-review, dependencies done):
   
   1. {task title}
      Branch: vk/{task-branch}
      Acceptance criteria: {list}
      
   ⏳ PENDING AUTO-REVIEW:
   
   2. {task title}
      Status: Reviewer subagent running...
      
   🔒 BLOCKED (dependencies not merged):
   
   3. {other task}
      Waiting for: {dependency task} to be approved
   
   To approve: "Task 1 looks good"
   To request changes: "Task 1 needs changes: [your feedback]"
   To test locally: "test task 1" or "preview task 1"
   ```

### On "test task X" or "preview task X":

User wants to manually test/preview a task before approving.

1. **Validate task is reviewable** (same criteria as above)
   - If not reviewable → explain why

2. **Navigate to task worktree:**
   ```bash
   cd /tmp/vibe-kanban/worktrees/{task-id}/{repo-name}
   ```

3. **Read plan.md** to understand project type, tech stack, and dependencies

4. **Determine and execute appropriate test setup** based on project context
   (e.g., start dev server, launch emulator, run notebook, provide CLI commands)

5. **Announce with clear instructions:**
   ```
   🚀 Ready to test "{task title}"
   
   {How to test - determined from plan.md context}
   
   After testing:
   - "looks good" to approve
   - "needs changes: [feedback]" to reject
   - "stop" to stop without decision
   ```

6. **Wait for user decision**

7. **On decision (approve/reject/stop):**
   - Cleanup (stop servers, close emulators, etc.)
   - Handle approval/rejection as normal (see below)
   - Resume polling loop if tasks still in progress

### On task approval ("looks good", "approved", "merge"):

1. **Validate dependencies:** All tasks in `depends_on` must be "done"
   - If not → reject with explanation

2. **Attempt merge:**
   - `git checkout feature/{project}`
   - `git merge vk/{task-branch} --no-commit`
   
3. **If conflict:**
   - Abort merge: `git merge --abort`
   - Get list of conflicting files from git output
   - Update task description via MCP `update_task`:
     ```
     {existing description}
     
     ## MERGE CONFLICT
     
     Conflicting files:
     - {file1}
     - {file2}
     
     Action required:
     1. Rebase your branch on latest feature branch
     2. Resolve conflicts (keep your task's logic, integrate others' changes)
     3. Re-run tests
     4. Move task to inreview when ready
     ```
   - Update state.json: `status = "merge_conflict"`, increment `merge_retries`
   - Restart worker via MCP `start_workspace_session`
   - **Max 2 retry attempts.** If `merge_retries >= 2` and still conflicting:
     - Read template: `docs/agents/templates/merge-conflict-report-template.md`
     - Create `docs/merge-conflict-report.md`
     - Announce to user for manual resolution

4. **If clean merge:**
   - Complete: `git commit -m "Merge: {task title}"`
   - Update task status → "done" (MCP + state.json)
   - Check for unblocked tasks → auto-start if any
   - Announce: "✅ {task} merged. Unblocked: {list}"
   - **Auto-resume:** If tasks still in progress/review → return to PHASE 2 polling loop

### On task rejection ("needs changes" + feedback):

1. **Update rejected task:**
   - Append to task description: `## Reviewer Feedback (human)\n{feedback}`
   - Set `status = "rejected"`
   - Set `agent_reviewed = false` (will need re-review after rework)
   - Set `rejection_feedback = {feedback}`

2. **Cascade block dependents:**
   - Find all tasks where `depends_on` includes this task
   - If status in ["inprogress", "inreview"] → status = "blocked", `agent_reviewed = false`
   - Update state.json

3. **Restart rejected task:**
   - Call `start_workspace_session` via MCP
   - Worker sees feedback in task description
   - Update status → "inprogress"

4. **Announce:**
   ```
   🔄 Task "{title}" rejected for rework.
   
   Feedback: {user's feedback}
   
   Blocked dependent tasks:
   - {task X}
   - {task Y}
   
   Worker restarting with feedback...
   ```

5. **Return to PHASE 2** (execution loop - worker will complete, then auto-review runs again)

### On all tasks done:

Announce completion and proceed to PHASE 4:
```
🎉 All tasks completed and merged!

Proceeding to documentation phase...
```

---

## PHASE 4: DOCUMENTING

### Step 1: Final Merge

1. **Merge feature branch to main:**
   - `git checkout main`
   - `git merge feature/{project-name}`

2. **Cleanup:**
   - `git worktree prune`

### Step 2: Generate Docs

1. **Generate project README.md** (REPLACES template README):
   - What the project does
   - Setup instructions with environment variable details
   - How to run locally
   - How to run tests
   - Feature overview

2. **Show .env setup** to user:
   ```
   Create your .env file by copying .env.example:
   
   cp .env.example .env.local
   
   Then fill in these values:
   [list each variable with description of where to get it]
   ```

3. **If auth includes Google OAuth**: Include setup instructions:
   - How to create Google Cloud project
   - How to enable OAuth consent screen
   - Where to get client ID/secret
   - Redirect URI configuration

4. Generate Dockerfile (if applicable)

5. Generate .github/workflows/ci.yml (run tests on push)

### Step 3: Git Commit

1. Stage all changes
2. Commit with semantic message describing the build

### Step 4: Show Final Status

```
---
BUILD COMPLETE

Status: 🟢 GREEN or 🟡 YELLOW
Branch: feature/{project-name}

[If YELLOW: list what failed/incomplete]

To run locally:
[commands for this stack]

Environment setup:
cp .env.example .env.local
# Then fill in: [list required vars]
---
```

⛔ MANDATORY HUMAN APPROVAL REQUIRED

Wait for explicit response:
- "Looks good" → Show deploy instructions, END
- "Needs rework: {feedback}" → Create learnings.md, return to PHASE 1

---

### On "Needs rework: {feedback}"

1. **Read template**: `docs/agents/templates/learnings-template.md` for structure and guidance
2. Document learnings adapting to the feedback:
   - User's exact feedback
   - What worked (preserve these)
   - What needs fixing (prioritized by importance)
   - Explicit "do not change" list if user specified
3. **Save as**: `docs/learnings.md`
4. **Update status.md**:
   - Phase: PLANNING
   - Status: IN_PROGRESS
   - Increment iteration to v{N+1}
   - Log: "Rework requested, returning to PHASE 1"
5. **Return to PHASE 1 Step 9** (re-decompose if needed, or adjust existing tasks)
6. Read `docs/learnings.md` FIRST before making any changes

### On "Looks good"

1. Show deployment instructions
2. Update status.md: Phase: COMPLETE, Status: COMPLETE
3. Workflow COMPLETE

---

## Adding Features Mid-Project

If user wants to add/edit/remove functionality after initial build:

1. Add to `docs/status.md` Pending Actions:
   - `[ ] Add feature: {description}`
2. Return to PHASE 1 Steps 3-5:
   - Update Job Stories for the new feature
   - Generate new GHERKIN scenarios
   - Update Features grouping
3. Update `docs/plan.md` with new scenarios and features
4. Return to PHASE 1 Step 9 to decompose new features into tasks

This ensures traceability: every feature maps to job stories and GHERKIN scenarios.

---

# WORKER

**If you're reading this and your `append_prompt` says "You are an AI Factory WORKER agent", this section is for you. Skip the ORCHESTRATOR section above.**

## On Start

1. Read your task description from Kanban (contains job story + acceptance criteria)
2. Check if task description contains "MERGE CONFLICT:" section
   - If YES → you're handling a conflict, see "Merge Conflict Resolution" below
   - If NO → normal build flow
3. Read `docs/plan.md` for overall project context
4. Begin BUILDING

## Scope

You handle BUILDING, TESTING, and MERGE CONFLICT RESOLUTION:

**BUILDING:**
1. Read task description (contains requirements, job story, acceptance criteria)
2. Generate code to fulfill the task
3. Create `.env.example` if needed
4. Commit changes to your task branch

**TESTING:**
1. Generate tests from acceptance criteria (GHERKIN scenarios):
   - **Unit tests**: For isolated functions/modules (fast, no external deps)
   - **Integration tests**: For API endpoints, database operations (may need setup)
   - Match test type to what the acceptance criteria describes
2. Run tests
3. Fix failures (max 3 attempts)
4. If still failing after 3 attempts:
   - Generate failure details using format from `docs/agents/templates/failure-report-template.md`
   - Add failure summary to task description
   - Still move to `inreview` (reviewer will see failure)

**MERGE CONFLICT RESOLUTION** (when task description contains conflict info):
1. Fetch latest feature branch: `git fetch origin feature/{project}`
2. Rebase your task branch: `git rebase origin/feature/{project}`
3. Resolve conflicts:
   - Keep your task's logic/implementation
   - Integrate changes from other merged tasks
   - Ensure your code works with the updated codebase
4. Re-run all tests
5. Push rebased branch
6. Move task to `inreview`

## On Completion

1. Commit all changes to task branch (`vk/{task-id}-...`)
2. **Push to remote**: `git push origin HEAD` (pushes your task branch, NOT feature branch)
3. Update task status → `inreview` via MCP
4. **STOP** - do not continue to other phases

## On Restart (after rejection)

If task was rejected and you're restarted, your previous work exists on the remote:

1. Check if your task branch exists: `git branch -r | grep vk/{task-id}`
2. If exists, fetch and checkout: 
   ```bash
   git fetch origin vk/{task-id}-{name}
   git checkout vk/{task-id}-{name}
   ```
3. Read feedback in task description (## Reviewer Feedback section)
4. Apply fixes on top of previous work
5. Continue normal completion flow (commit → push → inreview)

## Do NOT

- Perform code review (orchestrator's reviewer subagent handles this)
- Write documentation (orchestrator handles in PHASE 4)
- Merge branches (orchestrator handles after human approval)
- Work on other tasks (you have exactly one task)
- Interact with the user (orchestrator handles all communication)

## Self-Check Before inreview

Quick sanity check before marking task complete:
- [ ] All acceptance criteria implemented?
- [ ] Tests pass?
- [ ] No hardcoded secrets?
- [ ] No debug code left (console.log, print)?

The reviewer subagent does thorough validation - this is just a quick self-check.

---

# REVIEWER

**The reviewer is a Cursor subagent defined in `.cursor/agents/reviewer.md`.**

The reviewer:
- Is spawned by orchestrator when a task reaches `inreview` with `agent_reviewed = false`
- Checks code against acceptance criteria (GHERKIN scenarios)
- Returns "APPROVED" or list of issues with file:line references
- Does NOT modify files (read-only)
- Does NOT run tests (worker already did)

**Full reviewer prompt and rules:** See `.cursor/agents/reviewer.md`

---

# REFERENCE

## Templates & Agents

Templates provide STRUCTURE and GUIDANCE, not rigid forms. Adapt to each project's needs.

| File | Read At | Creates | Purpose |
|------|---------|---------|---------|
| `docs/agents/usage-guide.md` | - | - | Template usage instructions (for users) |
| `docs/agents/checklist.md` | PHASE 1 (reference) | - | Formats, examples, detailed guidance |
| `docs/agents/templates/status-template.md` | PHASE 1 Step 1 (if not exists) | `docs/status.md` | Track phase and progress |
| `docs/agents/templates/plan-template.md` | PHASE 1 Step 8 | `docs/plan.md` | Project specification |
| `docs/agents/templates/failure-report-template.md` | Worker (on failure) | Task description | Document test failures |
| `docs/agents/templates/learnings-template.md` | "Needs rework" | `docs/learnings.md` | Feedback for next iteration |
| `docs/agents/templates/merge-conflict-report-template.md` | PHASE 3 (on conflict) | `docs/merge-conflict-report.md` | Document unresolvable merge conflicts |
| `docs/agents/kanban-integration.md` | - | - | Kanban workflow documentation (for users) |
| `.cursor/agents/reviewer.md` | PHASE 2 (auto-review) | - | Reviewer subagent definition |

**How to use templates**:
1. Read the template for structure and guidance
2. Include required sections, adapt optional sections
3. Add sections if the project needs them
4. Skip sections that don't apply (no empty sections or N/A)
5. Adapt terminology to project type
6. Save as the target file (without `-template` suffix)

## MCP Call Protocol

When making any MCP call (Vibe Kanban operations):

### Retry with Backoff

1. Attempt the call

2. If connection error or timeout:
   - Attempt 1: wait 2 seconds, retry
   - Attempt 2: wait 4 seconds, retry
   - Attempt 3: wait 8 seconds, retry
   - Attempt 4: permanent failure

3. On permanent failure:
   - Log to state.json: `{ "last_error": { "time": "...", "operation": "...", "message": "..." } }`
   - Announce: "⚠️ Kanban connection failed. Check if running: `npx vibe-kanban`"

4. On success after retry:
   - Continue normally (transparent to user)

### Recovery Protocol

On session start, if `.vibe-kanban/state.json` exists:

1. **Check Vibe Kanban connection**
   - If fails → start `npx vibe-kanban`, retry

2. **Check project exists in Kanban:**
   - Call `list_projects` via MCP
   - Look for `project_id` from state.json

3. **If project NOT found:**
   - Reconstruct from state.json:
     - Create project via MCP
     - For each task: `create_task` with stored details
   - Announce: "Recovered {N} tasks from previous session"

4. **Sync state:**
   - Compare MCP task statuses with state.json
   - If drift detected → warn user, ask to accept Kanban as truth

## Agent Configuration

| Agent | Config File | Model |
|-------|-------------|-------|
| Worker | `.vibe-kanban/profiles.json` | `claude-opus-4-5-20251101` |
| Reviewer | `.cursor/agents/reviewer.md` | `Opus 4.5` |

Workers are spawned via MCP `start_workspace_session` with `variant: "DEFAULT"`.
