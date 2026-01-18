# Plan Template

This template provides STRUCTURE and GUIDANCE. Adapt sections as needed for the project type.

---

## Required Sections

Include these in every plan.

### Overview

Describe what we're building, who it's for, and what problems it solves.

Keep it concise - 2-3 sentences for each:
- **What**: The product/feature in plain language
- **Who**: Target users and their context
- **Why**: Pain points this addresses

### Job Stories

The original user input describing situations and motivations.

Format:
> When [situation/trigger]
> I want to [motivation/action]
> So I can [expected outcome]

Include all job stories gathered from the user. These capture the CONTEXT and WHY.

### GHERKIN Scenarios

Testable scenarios derived from job stories.

Format:
```gherkin
Scenario: [descriptive name]
  Given [context/precondition]
  When [action taken]
  Then [expected result]
  And [additional result if needed]
```

GHERKIN scenarios become the basis for tests.

### Features

Group related GHERKIN scenarios into features.

Adapt terminology to your project's domain. Use whatever language makes sense for the type of thing you're building.

Note which scenarios each feature covers.

### Tech Stack

Document technical decisions with rationale.

Minimum:
- Primary framework/language
- Test runner and commands
- Database (if any)
- Deployment approach

Add more as relevant (styling, auth provider, external services, etc.)

---

## Optional Sections

Include if relevant to the project.

### Authentication

If auth is needed, document:
- Auth method (Google, email, wallet, etc.)
- User roles (if any)
- Protected routes/resources

### External APIs

If the project uses external services:
- API name and purpose
- Rate limits or pricing concerns
- Fallback behavior if unavailable

### UI/UX References

If the user provided visual references:
- URLs or descriptions
- Key design patterns to follow
- Color/typography preferences

### Out of Scope

Explicit exclusions to prevent scope creep.

List things that might seem related but are NOT part of this PoC.

### Technical Constraints

If there are specific requirements:
- Browser/device support
- Performance targets
- Accessibility requirements
- Existing systems to integrate with

---

## Guidelines for Agent

1. **Adapt to project type** - Not all sections apply to all projects
2. **Add sections if needed** - If the project has unique aspects, create sections for them
3. **Remove irrelevant sections** - Don't include empty sections or N/A entries
4. **Use appropriate terminology** - Match the domain (endpoints vs screens vs commands)
5. **Keep it actionable** - Everything in the plan should inform implementation

---

## Approval Status

Mark the plan status:
- [ ] Draft - still gathering requirements
- [ ] Ready for review - complete, awaiting user approval
- [ ] Approved - user said "Build this plan"
