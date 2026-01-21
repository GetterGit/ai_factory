# AI Factory

A Cursor-based workflow template for building apps with AI agents.

## What This Is

A structured workflow that guides Cursor's AI agent through planning, building, testing, reviewing, and documenting a proof-of-concept. The agent follows defined phases, asks for human approval at key points, and tracks progress in markdown files.

## Quick Start

1. **Clone/copy this template** into a new project folder
2. **Open in Cursor** (Agent mode)
3. **Describe what you want to build** - the agent handles the rest

```
I want to build [your idea]. 

Job stories:
- When [situation], I want to [action], so I can [outcome]
- When [situation], I want to [action], so I can [outcome]
```

The agent will:
- Create `docs/status.md` to track progress
- Ask clarifying questions
- Derive testable scenarios from your job stories
- Propose tech stack (waits for your approval)
- Generate `docs/plan.md` with full specification
- **Stop and wait for your approval before coding**

## Structure

```
your-project/
├── .cursor/rules/
│   └── workflow.md              # Main workflow (auto-loaded by Cursor)
├── docs/
│   ├── agents/
│   │   ├── checklist.md         # Planning guide for the agent
│   │   ├── usage-guide.md       # Template instructions (this file)
│   │   └── templates/
│   │       ├── plan-template.md
│   │       ├── status-template.md
│   │       ├── learnings-template.md
│   │       └── failure-report-template.md
│   ├── status.md                # Created by agent - tracks current phase
│   └── plan.md                  # Created by agent - project specification
└── README.md                    # Stub (replaced by agent in Phase 5)
```

## Workflow Phases

| Phase | What Happens | Human Input |
|-------|--------------|-------------|
| **1. Planning** | Gather requirements, job stories, derive GHERKIN scenarios, propose stack | Approve plan before coding |
| **2. Building** | Generate code based on plan | - |
| **3. Testing** | Write and run tests (unit, integration, API health) | - |
| **4. Reviewing** | Code review against checklist | Approve or request rework |
| **5. Documenting** | Generate README, Dockerfile, CI config, commit to git | - |

## Human Approval Gates

The agent **stops and waits** at two points:

1. **After Planning** - Review `docs/plan.md` before any code is written
2. **After Review** - Approve the final build or request changes

## Input Formats

### Minimal (Agent Asks Questions)
```
I want to build a crypto portfolio tracker
```

### With Job Stories (Recommended)
```
I want to build a crypto portfolio tracker.

Job stories:
- When I wake up, I want to see my portfolio value immediately, 
  so I know if anything needs attention
- When I add a new wallet, I want it saved locally, 
  so I don't re-enter it every time
```

### Full Spec (Fastest)
```
Project: wallet-tracker
What: Crypto portfolio tracker
Target: Crypto holders wanting quick mobile checks
Auth: None

Job stories:
1. When I wake up, I want to see my portfolio value...
2. When I add a new wallet, I want it saved locally...
```

## Generated Files

During the workflow, the agent creates:

| File | When | Purpose |
|------|------|---------|
| `docs/status.md` | Phase 1 start | Tracks current phase and progress |
| `docs/plan.md` | Phase 1 end | Full project specification |
| `docs/learnings.md` | On rework | Captures feedback for next iteration |
| `docs/failure-report.md` | If tests fail after 4 attempts | Documents issues for manual fix |
| `README.md` | Phase 5 | Replaces stub README with project-specific docs |

## License

MIT
