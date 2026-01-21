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
   - If NO: This is a new project → go to PHASE 1 Step 1 to create it

2. **Check `docs/status.md` Pending Actions section**:
   - If items exist → address them before continuing normal flow
   - Feature additions → go to PHASE 1 Steps 3-5 to update Stories/GHERKIN, then resume

3. **If in BUILDING phase or later**: Also read `docs/plan.md` to refresh full context (requirements, GHERKIN scenarios, features, tech stack). This prevents context loss during long builds.

4. **State current phase** at the start of your response:
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
2. BUILDING - Create branch, generate code in src/
3. TESTING - Run tests, fix failures (max 4 attempts)
4. REVIEWING - Code review (skip if tests failed)
5. DOCUMENTING - README, git commit, PR

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

DO NOT generate code until user explicitly says to proceed ("Build this plan", "Approved", etc.)

If user requests changes → update plan → show summary → wait again.

**On approval**:
1. Update `docs/plan.md` Approval Status to "Approved" with timestamp
2. Proceed to PHASE 2

## PHASE 2: BUILDING

### Step 1: Create Branch

Create git branch: `poc-{YYYY-MM-DD}-{project_name}-v{N}`

This branch will be used for all work until final commit.

### Step 2: Prepare

1. **Read**: `docs/plan.md` (required - contains all specs)
2. **Check if exists**: `docs/learnings.md`
   - If exists: Read FIRST, list what to preserve and what to fix
   - Confirm with user before proceeding

### Step 3: Generate Code

1. Generate project structure in `src/`
2. Generate code file by file based on plan
3. Add TODO comments for external APIs that need verification

### Step 4: Environment Setup

1. Create `.env.example` with all required variables (actual env file format, not markdown)
2. If using database with migrations:
   - Generate migration files
   - Apply migrations to development database
   - Document migration commands in plan

### Step 5: Complete

Announce: "Code complete. Moving to testing."

## PHASE 3: TESTING

### Step 1: Generate Tests

Create tests from GHERKIN scenarios (derived from job stories in plan.md).

Include these test types:

**Unit Tests** (REQUIRED - test individual functions/components in isolation)
- One function/component = one test file
- Mock external dependencies

**Integration Tests** (REQUIRED - test multiple parts working together)
- Multiple components/modules together
- API routes + database calls
- Verify data flows correctly through the system

**API Contract Tests** (REQUIRED for apps using external APIs)
- For EACH external API endpoint the app calls:
  - Test with realistic parameters
  - Verify response structure matches code expectations
  - Test error responses (401, 404, rate limit) are handled
- Note: These may require valid API keys in test environment

**API Health Checks** (verify external services respond)
- Ping external APIs used in the app
- Verify response format matches expectations

### Step 2: Run Tests

Run full test suite using plan-specified command.

### Step 3: Handle Failures

On failure:
1. Analyze ALL failing tests
2. Fix source code (not tests, unless test is wrong)
3. For logic/edge-case bugs: Add a test that would have caught it (skip for typos, missing imports)
4. Re-run FULL suite
5. Maximum 4 total attempts for the suite

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

**External API Integration**
- Verify API response shapes match code expectations
- Check that all accessed properties actually exist on response objects
- No hardcoded values when dynamic source of truth exists (e.g., don't hardcode token lists if API provides them)

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

### Step 1: Generate Docs

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

### Step 2: Git Commit

1. Stage all changes
2. Commit with semantic message describing the build

### Step 3: Show Final Status

```
---
BUILD COMPLETE

Status: 🟢 GREEN or 🟡 YELLOW
Branch: poc-{date}-{name}-v{N}

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
- "Looks good" → Merge to main, show deploy instructions, END
- "Needs rework: {feedback}" → Create learnings.md, return to PHASE 2

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
   - Phase: BUILDING
   - Status: IN_PROGRESS
   - Increment iteration to v{N+1}
   - Log: "Rework requested, returning to PHASE 2"
5. **Return to PHASE 2 Step 2** (branch already exists, just continue on it)
6. Read `docs/learnings.md` FIRST before making any changes

### On "Looks good"

1. Merge branch to main
2. Show deployment instructions
3. Update status.md: Phase: COMPLETE, Status: COMPLETE
4. Workflow COMPLETE

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
4. Return to PHASE 2 to implement

This ensures traceability: every feature maps to job stories and GHERKIN scenarios.

---

## Reference: Templates

Templates provide STRUCTURE and GUIDANCE, not rigid forms. Adapt to each project's needs.

| Template | Read At | Creates | Purpose |
|----------|---------|---------|---------|
| `docs/agents/usage-guide.md` | - | - | Template usage instructions (for users) |
| `docs/agents/checklist.md` | PHASE 1 (reference) | - | Formats, examples, detailed guidance |
| `docs/agents/templates/status-template.md` | PHASE 1 Step 1 (if not exists) | `docs/status.md` | Track phase and progress |
| `docs/agents/templates/plan-template.md` | PHASE 1 Step 8 | `docs/plan.md` | Project specification |
| `docs/agents/templates/failure-report-template.md` | PHASE 3 (on failure) | `docs/failure-report.md` | Document test failures |
| `docs/agents/templates/learnings-template.md` | "Needs rework" | `docs/learnings.md` | Feedback for next iteration |

**How to use templates**:
1. Read the template for structure and guidance
2. Include required sections, adapt optional sections
3. Add sections if the project needs them
4. Skip sections that don't apply (no empty sections or N/A)
5. Adapt terminology to project type
6. Save as the target file (without `-template` suffix)