# Checklist

**Purpose**: Detailed reference for PHASE 1: PLANNING.

This document contains formats, examples, and guidance for gathering requirements. The agent refers to this during planning steps. workflow.md contains the high-level flow.

---

## Step 1: Requirements

Gather these core items:

| Item | Description |
|------|-------------|
| project_name | Short name for the project (used in branch names, docs) |
| what_to_build | 1-2 sentence description of the product/feature |
| target_audience | Who uses this (be specific about context) |
| problems_solved | What pain points does this address |
| auth_requirements | None / Google / Email+Password / Magic link / Metamask / Rainbowkit / Other |
| ui_ux_references | Screenshots, links, descriptions of designs user likes (see below) |

**Tips:**
- Ask follow-up questions if answers are vague
- "Users" is too generic - ask WHO specifically
- Problems should be from user's perspective, not technical

### UI/UX References

**Default assumption: User has references.** Always ask.

Prompt: "Do you have any UI/UX references? Screenshots, links to sites you like, or descriptions of styles that appeal to you?"

**For each reference, gather:**

| Type | Description |
|------|-------------|
| Screenshots | Preferred for visual design — user uploads images |
| Links | Optional — URLs for context or structure reference |
| What they like | Required — specific elements: "clean sidebar", "card layout", "color scheme", "typography" |

**User can say "No refs"** to skip.

**Follow-up for vague refs:**
- "You mentioned Linear — is it the sidebar nav, the card layout, or the color scheme you like?"
- "For that dashboard screenshot — do you want the exact layout or just the general feel?"

**Example format:**

```
UI/UX References:
1. Screenshot: [uploaded image]
   Likes: "The minimal sidebar with monochrome icons, the card-based content area"

2. Link: https://linear.app
   Likes: "The clean typography and muted color palette"

3. Description only:
   "Modern, minimal, lots of whitespace, no clutter"
```

---

## Step 2: Job Stories

### Format

```
When [situation/trigger]
I want to [motivation/action]
So I can [expected outcome]
```

### Examples

```
When I wake up and check my phone
I want to see my portfolio value immediately
So I know if anything needs attention before my day starts
```

```
When I buy crypto on an exchange
I want to quickly log it in my tracker
So I don't forget and lose track of my cost basis
```

```
When tax season comes
I want to export my transaction history
So my accountant can file correctly
```

### Tips

- **Focus on the WHEN** - this reveals the real context/trigger
- **The outcome (so I can) reveals the actual need** - not the feature
- Keep asking: "Any other situations where you'd use this?"
- Look for edge cases: "What about when X happens?"

### Bad vs Good

❌ Bad: "I want to add items to a list"
- No context, no motivation

✅ Good: "When I finish a meeting with action items, I want to quickly capture them so I don't forget before my next meeting"
- Clear trigger, clear motivation, reveals time pressure

---

## Step 3: GHERKIN Scenarios

### Format

```gherkin
Scenario: [descriptive name]
  Given [context/precondition]
  When [action taken]
  Then [expected result]
  And [additional result if needed]
```

### Examples

From the job story:
> When I wake up and check my phone, I want to see my portfolio value immediately...

Derived GHERKIN:

```gherkin
Scenario: View portfolio on app open
  Given I have holdings in my portfolio
  When I open the app
  Then I see total portfolio value within 2 seconds
  And I see percentage change from yesterday

Scenario: Empty portfolio state
  Given I have no holdings
  When I open the app
  Then I see a message "Add your first holding"
  And I see a button to add holdings
```

### Tips

- Include the happy path AND edge cases
- Scenarios should be testable - specific enough to verify
- Use concrete values where helpful ("within 2 seconds", not "quickly")
- Show scenarios to user for confirmation before proceeding

### Mapping

| Job Story | GHERKIN Scenarios |
|-----------|-------------------|
| Wake up, check portfolio | View on open, Empty state |
| Log new purchase | Add holding, Validation errors |
| Export for taxes | Export flow, Date filtering |

---

## Step 4: Derive Features

### Process

1. Look at GHERKIN scenarios
2. Group related scenarios together
3. Name each group as a feature
4. Show user for confirmation

### Example

| Feature | Covers Scenarios |
|---------|------------------|
| Dashboard | View on open, Empty state, Refresh |
| Holdings Management | Add, Edit, Delete, Validation |
| Export | Export flow, Date filtering, Format selection |

### Tips

- Features should be user-facing concepts, not technical
- Adapt terminology to project type (features, pages, commands, endpoints)
- Ask: "Does this cover everything, or should we add more?"

---

## Step 4.5: External APIs

### Process

1. Review features for external dependencies
2. Propose APIs based on project needs
3. Confirm with user before proceeding

### Selection Criteria

When proposing an API, consider:
- Does it have a free tier suitable for PoC?
- Is it well-documented?
- Does it provide the specific data/features needed?
- Is it reliable and actively maintained?

### Confirmation

Always confirm with user before including in plan:

"For [feature], I'll use [API] for [purpose]. OK?"

User may:
- Confirm your choice
- Suggest an alternative they prefer
- Ask for different options

### If User Mentions Unknown API

- Ask them to briefly describe what it does
- Ask for documentation link if available
- Note any specific endpoints or features they need

---

## Step 5: Tech Stack

### Selection Criteria

When proposing tech stack, consider:
- What does the project actually need?
- What's appropriate complexity for the scope?
- What deployment target makes sense?
- What testing approach fits the stack?

### Must Specify

- **Framework/language**: Primary tech
- **Test runner**: Appropriate for the stack
- **Test commands**: Actual commands to run tests
- **Database**: If needed
- **Deployment approach**: How it will be deployed

### Confirmation

Always confirm with user:

"For this project, I propose [stack]. Does this work for you?"

User may:
- Confirm your choice
- Request changes
- Specify preferences they have

Respect user preferences when given.

---

## Step 6: Create Plan

Refer to `docs/agents/templates/plan-template.md` for plan structure.

### Summary Format

```
===================================
PLAN READY

[what_to_build - 1 sentence]
[tech_stack - framework, db, etc.]

Features:
1. [feature]
2. [feature]
3. [feature]

GHERKIN scenarios: [count] testable scenarios
===================================
```

### Human Gate

⛔ **MANDATORY**: Do NOT generate code until user explicitly approves.

Valid approval phrases: "Build this plan", "Approved", "Go ahead", "Let's build"

If user requests changes → update plan → show summary → wait again.
