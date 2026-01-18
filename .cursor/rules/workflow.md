---
description: Development workflow
globs: ["**/*"]
alwaysApply: true
---

# Workflow

## CRITICAL: MANDATORY RULES

**YOU MUST FOLLOW THIS WORKFLOW. NO EXCEPTIONS.**

**DO NOT:**
- Propose tech stacks without completing job stories first
- Suggest features without user-provided job stories
- Skip to code generation before plan approval
- Make assumptions about what the user wants to build
- Be "helpful" by jumping ahead in the workflow
- Respond with solutions before gathering requirements

**The user chose this template for structured development. Respect the process.**

---

## On Every Response

1. **Check if `docs/status.md` exists**:
   - If YES: Read it to determine current phase and progress
   - If NO: This is a new project → go to PHASE 1 Step 0 to create it

2. **State current phase** at the start of your response:
   - [PHASE: PLANNING] - gathering requirements and job stories
   - [PHASE: BUILDING] - generating code
   - [PHASE: TESTING] - running/fixing tests
   - [PHASE: REVIEWING] - code review
   - [PHASE: DOCUMENTING] - docs and git

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

## Phases Overview

1. PLANNING - Gather requirements, create docs/plan.md
2. BUILDING - Generate code in src/
3. TESTING - Run tests, fix failures (max 4 attempts)
4. REVIEWING - Code review (skip if tests failed)
5. DOCUMENTING - README, git commit

## PHASE 1: PLANNING

### Step 0: Initialize Status

If `docs/status.md` does NOT exist:
1. **Read template**: `docs/agents/templates/status-template.md`
2. **Create**: `docs/status.md`
3. Set Phase: PLANNING, Status: IN_PROGRESS
4. Log: "Started PHASE 1: PLANNING"

**Reference**: `docs/agents/checklist.md` for detailed formats, examples, and tips.

### Step 1: Gather Requirements

Ask until you have: project_name, what_to_build, target_audience, problems_solved, auth_requirements, ui_ux_references.

**Reference**: See `docs/agents/checklist.md` for detailed format and examples.

### Step 2: Gather Job Stories

Ask user to describe situations (When/I want/So I can format).
Keep asking until user has no more.

### Step 3: Convert to GHERKIN Scenarios

Transform each job story into testable scenarios (Given/When/Then).
Show to user for confirmation.

### Step 4: Derive Features

Group related scenarios into features.
Show to user: "Does this cover everything?"

### Step 4.5: Identify External APIs

Identify needed external services from features.
Confirm each with user before proceeding.

### Step 5: Propose Tech Stack

Propose: tech_stack, test_runner, test_commands, database, deployment.
User can override.

### Step 6: Create Plan

1. **Read**: `docs/agents/templates/plan-template.md` for structure
2. Create `docs/plan.md` adapting to project needs
3. Show summary, then STOP

⛔ MANDATORY HUMAN APPROVAL REQUIRED

DO NOT generate code until user explicitly says to proceed ("Build this plan", "Approved", etc.)

If user requests changes → update plan → show summary → wait again.

## PHASE 2: BUILDING

1. **Read**: `docs/plan.md` (required - contains all specs)
2. **Check if exists**: `docs/learnings.md`
   - If exists: Read FIRST, list what to preserve and what to fix
   - Confirm with user before proceeding
3. Generate project structure in `src/`
4. Generate code file by file based on plan
5. Add TODO comments for external APIs that need verification
6. Create `.env.example` with required variables
7. Announce: "Code complete. Moving to testing."

## PHASE 3: TESTING

### Step 1: Generate Tests

Create tests from GHERKIN scenarios (derived from job stories in plan.md).

Include these test types:

**Unit Tests** (test individual functions/components in isolation)
- One function/component = one test file
- Mock external dependencies

**Integration Tests** (test multiple parts working together)
- Multiple components/modules together
- API routes + database calls

**API Health Checks** (verify external services respond)
- Ping external APIs used in the app
- Verify response format matches expectations

### Step 2: Run Tests

Run full test suite using plan-specified command.

### Step 3: Handle Failures

On failure:
1. Analyze ALL failing tests
2. Fix source code (not tests, unless test is wrong)
3. Re-run FULL suite
4. Maximum 4 total attempts for the suite

### Step 4: Determine Outcome

- ALL PASS → Proceed to PHASE 4
- STILL FAILING after 4 attempts:
  1. **Read template**: `docs/agents/templates/failure-report-template.md` for structure and guidance
  2. Document what works, what failed, and why (adapt detail to complexity)
  3. **Save as**: `docs/failure-report.md`
  4. Skip PHASE 4 (no point reviewing broken code)
  5. Go to PHASE 5 with YELLOW status

## PHASE 4: REVIEWING

Skip this phase if tests failed after max attempts (go directly to PHASE 5 with YELLOW).

### Review Checklist

Review all generated code against these criteria:

**Error Handling**
- Operations that can fail have appropriate error handling
- User-facing errors show friendly messages
- Errors are logged appropriately (not swallowed silently)
- Network/external failures have fallback or retry logic where appropriate

**Security**
- No hardcoded secrets or API keys in code
- All sensitive values read from environment variables
- User input is validated before use
- No obvious injection vulnerabilities

**Completeness**
- All GHERKIN scenarios have corresponding implementation
- All features from plan are present and functional
- Edge cases mentioned in job stories are handled

**Code Quality**
- No debugging code left in production paths
- Proper types/contracts where the language supports them
- No obvious bugs or logic errors
- Code structure matches plan architecture

### Fix Process

For each issue found:
1. Note the file and line
2. Describe the problem
3. Apply the fix

After ALL fixes are applied:
1. Re-run the full test suite
2. If tests break → fix and re-run
3. If tests pass → continue review or complete

### Iteration Limit

Maximum 2 review iterations.

After 2 iterations:
- If all clean → Status: GREEN
- If issues remain → Status: YELLOW, note remaining issues in status.md

## PHASE 5: DOCUMENTING

1. Generate:
   - README.md (setup, features, env vars, usage)
   - Dockerfile (if applicable)
   - .github/workflows/ci.yml (run tests on push)

2. Git:
   - Create branch: poc-{YYYY-MM-DD}-{name}-v{N}
   - Commit with semantic message

3. Show final status then STOP:

---
BUILD COMPLETE

Status: 🟢 GREEN or 🟡 YELLOW
Branch: poc-{date}-{name}-v1

[If YELLOW: list what failed/incomplete]

To run locally:
[commands for this stack]
---

⛔ MANDATORY HUMAN APPROVAL REQUIRED

Wait for explicit response:
- "Looks good" → Merge to main, show deploy instructions, END
- "Needs rework: {feedback}" → Create learnings.md, go to PHASE 2

---

### On "Needs rework: {feedback}"

1. **Read template**: `docs/agents/templates/learnings-template.md` for structure and guidance
2. Document learnings adapting to the feedback:
   - User's exact feedback
   - What worked (preserve these)
   - What needs fixing (prioritized by importance)
   - Explicit "do not change" list if user specified
3. **Save as**: `docs/learnings.md`
4. Create new branch: `poc-{date}-{name}-v{N+1}`
5. Return to PHASE 2
6. Read `docs/learnings.md` FIRST before making any changes

### On "Looks good"

1. Merge to main
2. Show deployment instructions
3. Workflow COMPLETE

---

## Reference: Templates

Templates provide STRUCTURE and GUIDANCE, not rigid forms. Adapt to each project's needs.

| Template | Read At | Creates | Purpose |
|----------|---------|---------|---------|
| `docs/agents/checklist.md` | PHASE 1 (reference) | - | Formats, examples, detailed guidance |
| `docs/agents/templates/status-template.md` | PHASE 1 Step 0 (if not exists) | `docs/status.md` | Track phase and progress |
| `docs/agents/templates/plan-template.md` | PHASE 1 Step 6 | `docs/plan.md` | Project specification |
| `docs/agents/templates/failure-report-template.md` | PHASE 3 (on failure) | `docs/failure-report.md` | Document test failures |
| `docs/agents/templates/learnings-template.md` | "Needs rework" | `docs/learnings.md` | Feedback for next iteration |

**How to use templates**:
1. Read the template for structure and guidance
2. Include required sections, adapt optional sections
3. Add sections if the project needs them
4. Skip sections that don't apply (no empty sections or N/A)
5. Adapt terminology to project type
6. Save as the target file (without `-template` suffix)