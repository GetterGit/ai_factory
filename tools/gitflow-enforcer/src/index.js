#!/usr/bin/env node

/**
 * GitFlow Enforcer MCP Server
 * 
 * Provides proactive validation for git operations in AI Factory.
 * All merge operations must go through these tools to ensure GitFlow compliance.
 * 
 * Note: This server is designed for single-agent usage. Concurrent access
 * from multiple processes could cause race conditions on state.json.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

const Status = {
  TODO: "todo",
  BLOCKED: "blocked",
  IN_PROGRESS: "inprogress",
  IN_REVIEW: "inreview",
  REJECTED: "rejected",
  DONE: "done",
  CANCELLED: "cancelled",
};

const Phase = {
  PLANNING: "PLANNING",
  EXECUTION: "EXECUTION",
  REVIEWING: "REVIEWING",
  DOCUMENTING: "DOCUMENTING",
  COMPLETE: "COMPLETE",
};

// Valid ORCHESTRATOR-DRIVEN transitions only
// Note: Vibe Kanban handles these automatically (not via this tool):
//   - todo → inprogress (when start_workspace_session called)
//   - inprogress → inreview (when worker completes)
// The "rejected" status is internal to state.json - Vibe Kanban doesn't know it.
// When restarting a rejected task, VK just sees "start" → inprogress.
// This tool is for orchestrator ACTIONS, not syncing Vibe Kanban state.
const VALID_TRANSITIONS = {
  [Status.TODO]: [Status.BLOCKED],  // Orchestrator can block a todo task
  [Status.BLOCKED]: [Status.TODO],  // Orchestrator can unblock
  [Status.IN_PROGRESS]: [Status.BLOCKED],  // Orchestrator can block a running task
  [Status.IN_REVIEW]: [Status.REJECTED, Status.IN_PROGRESS], // Reject or send back for more work
  [Status.REJECTED]: [],  // Restart via start_workspace_session → VK moves to inprogress → sync overwrites
  [Status.DONE]: [], // Terminal
  [Status.CANCELLED]: [], // Terminal
};

// Conflict markers in git status --porcelain (all possible conflict states)
const CONFLICT_PATTERN = /^(U.|.U|AA|DD)/m;

// Valid git branch name pattern
const VALID_BRANCH_NAME = /^[a-zA-Z0-9._-]+$/;

// Timeout for git operations (2 minutes for slow networks/large repos)
const GIT_TIMEOUT = 120000;

// ============================================================================
// Workspace Detection
// ============================================================================

function findWorkspaceRoot() {
  let dir = process.cwd();
  while (dir !== "/") {
    if (fs.existsSync(path.join(dir, ".vibe-kanban"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

const WORKSPACE_ROOT = findWorkspaceRoot();
const STATE_FILE = path.join(WORKSPACE_ROOT, ".vibe-kanban", "state.json");

// ============================================================================
// State Management
// ============================================================================

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`state.json not found at ${STATE_FILE}`);
  }
  
  const content = fs.readFileSync(STATE_FILE, "utf-8");
  
  try {
    const state = JSON.parse(content);
    
    // Validate required fields
    if (!state.checkpoint?.phase) {
      throw new Error(
        "state.checkpoint.phase is missing - workflow not initialized properly. " +
        "Ensure state.json has a checkpoint with phase before calling gitflow tools."
      );
    }
    
    return state;
  } catch (parseError) {
    if (parseError.message.includes("state.checkpoint.phase")) {
      throw parseError; // Re-throw our validation error
    }
    throw new Error(
      `state.json is malformed JSON: ${parseError.message}\n` +
      `File location: ${STATE_FILE}`
    );
  }
}

function writeState(state) {
  // Write to temp file first, then rename (atomic operation)
  const tempFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2));
  fs.renameSync(tempFile, STATE_FILE);
}

function updateCheckpoint(state, action) {
  // Phase is validated in readState(), so it should exist here
  state.checkpoint = {
    phase: state.checkpoint.phase,
    last_action: action,
    timestamp: new Date().toISOString(),
  };
  return state;
}

// ============================================================================
// Git Helpers (using execFileSync for security)
// ============================================================================

function git(args, options = {}) {
  // args must be an array to prevent command injection
  if (!Array.isArray(args)) {
    throw new Error("git() requires args as array for security");
  }
  
  try {
    return execFileSync("git", args, {
      cwd: WORKSPACE_ROOT,
      encoding: "utf-8",
      stdio: options.stdio || "pipe",
      timeout: options.timeout || GIT_TIMEOUT,
      // Only set env if custom vars provided; inherit process.env and overlay custom vars
      env: options.env ? { ...process.env, ...options.env } : undefined,
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : "";
    throw new Error(
      `Git command failed: git ${args.join(" ")}\n` +
      `Exit code: ${error.status}\n` +
      `Error: ${stderr || error.message}`
    );
  }
}

function getCurrentBranch() {
  return git(["branch", "--show-current"]);
}

function branchExistsOnRemote(branch) {
  try {
    const result = git(["ls-remote", "--heads", "origin", branch]);
    return result.length > 0;
  } catch {
    return false;
  }
}

function hasUncommittedChanges() {
  const status = git(["status", "--porcelain"]);
  return status.length > 0;
}

/**
 * Check if local branch is strictly behind remote (remote has commits local doesn't).
 * Does NOT fetch - caller should fetch first if needed.
 * 
 * @param {string} branch - Branch name to check
 * @returns {boolean} - True if local is behind remote
 */
function isLocalBehindRemote(branch) {
  try {
    const local = git(["rev-parse", branch]);
    const remote = git(["rev-parse", `origin/${branch}`]);
    
    if (local === remote) {
      return false; // Same commit, not behind
    }
    
    // Check if local is an ancestor of remote (meaning remote has commits local doesn't)
    const mergeBase = git(["merge-base", branch, `origin/${branch}`]);
    return mergeBase === local && local !== remote;
  } catch {
    return false; // If we can't check, assume it's fine
  }
}

function hasConflicts() {
  const status = git(["status", "--porcelain"]);
  return CONFLICT_PATTERN.test(status);
}

/**
 * Fetch from origin with error handling
 * @returns {{ success: boolean, error?: string }}
 */
function fetchOrigin() {
  try {
    git(["fetch", "origin"]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Could not fetch from remote:\n${error.message}\n\n` +
        `Check your network connection and git credentials.`,
    };
  }
}

// ============================================================================
// Input Validation
// ============================================================================

function validateTaskId(taskId) {
  if (typeof taskId !== "string") {
    throw new Error(`taskId must be a string, got ${typeof taskId}`);
  }
  if (taskId.length === 0) {
    throw new Error("taskId cannot be empty");
  }
  if (taskId.length > 100) {
    throw new Error("taskId too long (max 100 characters)");
  }
  // UUID format or alphanumeric with hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(taskId)) {
    throw new Error("taskId contains invalid characters");
  }
}

function validateProjectName(projectName) {
  if (typeof projectName !== "string") {
    throw new Error(`projectName must be a string, got ${typeof projectName}`);
  }
  if (projectName.length === 0) {
    throw new Error("projectName cannot be empty");
  }
  if (projectName.length > 50) {
    throw new Error("projectName too long (max 50 characters)");
  }
  if (!VALID_BRANCH_NAME.test(projectName)) {
    throw new Error(
      `projectName contains invalid characters. ` +
      `Allowed: letters, numbers, dots, underscores, hyphens`
    );
  }
  // Prevent path traversal
  if (projectName.includes("..") || projectName.startsWith("/")) {
    throw new Error("projectName cannot contain path traversal");
  }
}

// ============================================================================
// Validators
// ============================================================================

function validateMergeTaskToFeature(state, taskId) {
  const errors = [];
  const task = state.tasks?.[taskId];

  if (!task) {
    errors.push(`Task "${taskId}" not found in state.json`);
    return { valid: false, errors, task: null };
  }

  if (task.status !== Status.IN_REVIEW) {
    errors.push(
      `Task status is "${task.status}", expected "${Status.IN_REVIEW}". ` +
      `Task must be in review before merging.`
    );
  }

  if (task.agent_reviewed !== true) {
    errors.push(
      `Task has not passed auto-review (agent_reviewed: ${task.agent_reviewed}). ` +
      `Reviewer subagent must approve before human review.`
    );
  }

  for (const depId of task.depends_on || []) {
    const dep = state.tasks?.[depId];
    if (!dep) {
      errors.push(`Dependency "${depId}" not found in state.json`);
    } else if (dep.status !== Status.DONE) {
      errors.push(
        `Dependency "${depId}" (${dep.title}) is "${dep.status}", must be "${Status.DONE}"`
      );
    }
  }

  const currentBranch = getCurrentBranch();
  const expectedBranch = state.feature_branch;
  if (currentBranch !== expectedBranch) {
    errors.push(
      `Must be on feature branch "${expectedBranch}", currently on "${currentBranch}"`
    );
  }

  if (!task.branch) {
    errors.push(`Task has no branch assigned`);
  } else if (!branchExistsOnRemote(task.branch)) {
    errors.push(
      `Task branch "${task.branch}" not found on remote. ` +
      `Worker must push before task can be merged.`
    );
  }

  if (hasUncommittedChanges()) {
    errors.push(
      `Working directory has uncommitted changes. ` +
      `Commit or stash before merging.`
    );
  }

  return { valid: errors.length === 0, errors, task };
}

function validateMergeFeatureToMain(state, alreadyFetched = false) {
  const errors = [];

  const notDone = Object.entries(state.tasks || {})
    .filter(([_, t]) => ![Status.DONE, Status.CANCELLED].includes(t.status))
    .map(([id, t]) => `  - ${t.title}: ${t.status}`);

  if (notDone.length > 0) {
    errors.push(
      `Not all tasks are complete:\n${notDone.join("\n")}\n` +
      `All tasks must be "${Status.DONE}" or "${Status.CANCELLED}" before merging to main.`
    );
  }

  const currentBranch = getCurrentBranch();
  if (!currentBranch.startsWith("feature/")) {
    errors.push(
      `Must be on a feature/* branch, currently on "${currentBranch}"`
    );
  }

  if (state.feature_branch && currentBranch !== state.feature_branch) {
    errors.push(
      `Current branch "${currentBranch}" doesn't match state.json feature_branch "${state.feature_branch}"`
    );
  }

  if (hasUncommittedChanges()) {
    errors.push(
      `Working directory has uncommitted changes. ` +
      `Commit or stash before merging.`
    );
  }

  // Check if local is behind remote (only if already fetched to avoid double fetch)
  if (alreadyFetched && isLocalBehindRemote(currentBranch)) {
    errors.push(
      `Local branch is behind remote. Pull latest changes before merging to main.`
    );
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Tool Implementations
// ============================================================================

function getWorkflowState() {
  const state = readState(); // Throws if phase missing (consistent with updateCheckpoint)
  
  const tasks = state.tasks || {};
  const actionable = {
    ready_to_start: [],
    pending_auto_review: [],
    pending_human_review: [],
    blocked: [],
    in_progress: [],
    rejected: [],
    done: [],
    cancelled: [],
  };

  for (const [id, task] of Object.entries(tasks)) {
    const depsAllDone = (task.depends_on || []).every(
      (depId) => tasks[depId]?.status === Status.DONE
    );

    switch (task.status) {
      case Status.DONE:
        actionable.done.push(id);
        break;
      case Status.CANCELLED:
        actionable.cancelled.push(id);
        break;
      case Status.BLOCKED:
        actionable.blocked.push(id);
        break;
      case Status.TODO:
        if (depsAllDone) {
          actionable.ready_to_start.push(id);
        } else {
          actionable.blocked.push(id);
        }
        break;
      case Status.IN_PROGRESS:
        actionable.in_progress.push(id);
        break;
      case Status.IN_REVIEW:
        if (task.agent_reviewed) {
          actionable.pending_human_review.push(id);
        } else {
          actionable.pending_auto_review.push(id);
        }
        break;
      case Status.REJECTED:
        actionable.rejected.push(id);
        break;
      default:
        // Unknown status - treat as blocked
        actionable.blocked.push(id);
        break;
    }
  }

  return {
    phase: state.checkpoint.phase,
    feature_branch: state.feature_branch,
    current_branch: getCurrentBranch(),
    checkpoint: state.checkpoint,
    task_count: Object.keys(tasks).length,
    actionable,
    tasks: Object.fromEntries(
      Object.entries(tasks).map(([id, t]) => [
        id,
        {
          title: t.title,
          status: t.status,
          agent_reviewed: t.agent_reviewed,
          depends_on: t.depends_on,
          branch: t.branch,
        },
      ])
    ),
  };
}

function mergeTaskToFeature(taskId) {
  try {
    validateTaskId(taskId);
  } catch (validationError) {
    return { success: false, error: `❌ INVALID INPUT\n\n${validationError.message}` };
  }
  
  // Fetch latest
  const fetchResult = fetchOrigin();
  if (!fetchResult.success) {
    return { success: false, error: `❌ FETCH FAILED\n\n${fetchResult.error}` };
  }

  let state;
  try {
    state = readState();
  } catch (stateError) {
    return { success: false, error: `❌ STATE ERROR\n\n${stateError.message}` };
  }

  const validation = validateMergeTaskToFeature(state, taskId);

  if (!validation.valid) {
    return {
      success: false,
      error: `❌ MERGE BLOCKED\n\nValidation failed:\n${validation.errors.map(e => `• ${e}`).join("\n")}`,
    };
  }

  const task = validation.task;
  const featureBranch = state.feature_branch;

  // Execute merge
  try {
    git(["merge", `origin/${task.branch}`, "-m", `Merge: ${task.title}`]);
  } catch (mergeError) {
    // Check if it's a merge conflict
    if (hasConflicts()) {
      git(["merge", "--abort"]);
      return {
        success: false,
        error: `❌ MERGE CONFLICT\n\nConflict detected when merging "${task.branch}".\n\n` +
          `The merge has been aborted.\n\n` +
          `To resolve:\n` +
          `1. Update task description with conflict info\n` +
          `2. Restart worker to resolve conflicts\n` +
          `3. Worker should rebase on feature branch and resolve`,
        conflict: true,
      };
    }
    return { success: false, error: `❌ MERGE FAILED\n\n${mergeError.message}` };
  }

  // Push to remote - with rollback on failure
  try {
    git(["push", "origin", featureBranch]);
  } catch (pushError) {
    // Rollback the local merge
    try {
      git(["reset", "--hard", "HEAD~1"]);
    } catch (resetError) {
      return {
        success: false,
        error: `❌ PUSH FAILED AND ROLLBACK FAILED\n\n` +
          `Push error: ${pushError.message}\n\n` +
          `Rollback error: ${resetError.message}\n\n` +
          `Your local repo may be in an inconsistent state. ` +
          `Manual intervention required: git reset --hard origin/${featureBranch}`,
      };
    }
    return {
      success: false,
      error: `❌ PUSH FAILED\n\n${pushError.message}\n\n` +
        `The local merge has been rolled back. Your branch is unchanged.`,
    };
  }

  // Update state atomically - collect all changes first
  state.tasks[taskId].status = Status.DONE;
  
  // Find and update unblocked tasks
  const unblockedTasks = [];
  for (const [id, t] of Object.entries(state.tasks)) {
    if (id === taskId) continue; // Skip the task we just merged
    
    if (t.status === Status.BLOCKED && t.depends_on?.includes(taskId)) {
      const allDepsDone = t.depends_on.every(
        (depId) => state.tasks[depId]?.status === Status.DONE
      );
      if (allDepsDone) {
        state.tasks[id].status = Status.TODO;
        unblockedTasks.push({ id, title: t.title });
      }
    }
  }

  updateCheckpoint(state, `Merged task ${taskId}: ${task.title}`);
  
  // Single atomic write
  writeState(state);

  return {
    success: true,
    message: `✅ Task "${task.title}" merged successfully to ${featureBranch}`,
    merged_branch: task.branch,
    unblocked_tasks: unblockedTasks,
  };
}

function mergeFeatureToMain() {
  // Fetch latest
  const fetchResult = fetchOrigin();
  if (!fetchResult.success) {
    return { success: false, error: `❌ FETCH FAILED\n\n${fetchResult.error}` };
  }

  let state;
  try {
    state = readState();
  } catch (stateError) {
    return { success: false, error: `❌ STATE ERROR\n\n${stateError.message}` };
  }

  const validation = validateMergeFeatureToMain(state, true); // true = already fetched

  if (!validation.valid) {
    return {
      success: false,
      error: `❌ MERGE TO MAIN BLOCKED\n\nValidation failed:\n${validation.errors.map(e => `• ${e}`).join("\n")}`,
    };
  }

  const featureBranch = state.feature_branch;
  const originalBranch = getCurrentBranch();

  try {
    git(["checkout", "main"]);
  } catch (checkoutError) {
    return {
      success: false,
      error: `❌ CHECKOUT FAILED\n\nCould not checkout main:\n${checkoutError.message}`,
    };
  }

  try {
    git(["pull", "origin", "main"]);
    git(["merge", featureBranch, "-m", `Release: ${featureBranch}`]);
    // Set GITFLOW_MCP_PUSH=1 to signal pre-push hook this is a legitimate push
    git(["push", "origin", "main"], { env: { GITFLOW_MCP_PUSH: "1" } });

    updateCheckpoint(state, `Merged ${featureBranch} to main`);
    state.checkpoint.phase = Phase.COMPLETE;
    writeState(state);

    return {
      success: true,
      message: `✅ Feature branch "${featureBranch}" merged to main successfully`,
    };
  } catch (error) {
    // Try to go back to original branch
    let returnStatus = "";
    try {
      git(["checkout", originalBranch]);
      returnStatus = `Returned to ${originalBranch}`;
    } catch (checkoutError) {
      returnStatus = `WARNING: Could not return to ${originalBranch}. ` +
        `Currently on main. Error: ${checkoutError.message}`;
    }

    return {
      success: false,
      error: `❌ MERGE TO MAIN FAILED\n\n${error.message}\n\n${returnStatus}`,
    };
  }
}

function transitionTaskStatus(taskId, newStatus, reason) {
  try {
    validateTaskId(taskId);
  } catch (validationError) {
    return { success: false, error: validationError.message };
  }

  let state;
  try {
    state = readState();
  } catch (stateError) {
    return { success: false, error: `STATE ERROR: ${stateError.message}` };
  }

  const task = state.tasks?.[taskId];

  if (!task) {
    return {
      success: false,
      error: `Task "${taskId}" not found in state.json`,
    };
  }

  const oldStatus = task.status;

  // Prevent bypass: "done" status can only be set via mergeTaskToFeature
  if (newStatus === Status.DONE) {
    return {
      success: false,
      error: `Cannot transition directly to "${Status.DONE}". ` +
        `Use merge_task_to_feature tool instead - it validates and merges before marking done.`,
    };
  }

  const allowed = VALID_TRANSITIONS[oldStatus] || [];
  if (!allowed.includes(newStatus) && newStatus !== Status.CANCELLED) {
    return {
      success: false,
      error: `Invalid transition: "${oldStatus}" → "${newStatus}". ` +
        `Allowed transitions from "${oldStatus}": ${allowed.join(", ") || "none (terminal state)"}`,
    };
  }

  task.status = newStatus;
  if (reason) {
    task.rejection_feedback = reason;
  }
  if (newStatus === Status.REJECTED) {
    task.feedback_iterations = (task.feedback_iterations || 0) + 1;
    task.agent_reviewed = false;
  }

  updateCheckpoint(state, `Task ${taskId} status: ${oldStatus} → ${newStatus}`);
  writeState(state);

  return {
    success: true,
    message: `Task "${task.title}" status changed: ${oldStatus} → ${newStatus}`,
    previous_status: oldStatus,
    new_status: newStatus,
  };
}

function createFeatureBranch(projectName) {
  try {
    validateProjectName(projectName);
  } catch (validationError) {
    return { success: false, error: validationError.message };
  }
  
  const currentBranch = getCurrentBranch();
  
  if (currentBranch !== "main") {
    return {
      success: false,
      error: `Must be on "main" branch to create feature branch. Currently on "${currentBranch}"`,
    };
  }

  const featureBranch = `feature/${projectName}`;

  // Check if branch already exists locally
  try {
    git(["rev-parse", "--verify", featureBranch]);
    return {
      success: false,
      error: `Feature branch "${featureBranch}" already exists locally`,
    };
  } catch {
    // Branch doesn't exist locally, good
  }

  // Check if branch exists on remote
  if (branchExistsOnRemote(featureBranch)) {
    return {
      success: false,
      error: `Feature branch "${featureBranch}" already exists on remote`,
    };
  }

  try {
    git(["checkout", "-b", featureBranch]);
    git(["push", "-u", "origin", featureBranch]);
  } catch (gitError) {
    // Try to go back to main
    try {
      git(["checkout", "main"]);
    } catch {}
    
    return {
      success: false,
      error: `Failed to create feature branch: ${gitError.message}`,
    };
  }

  return {
    success: true,
    message: `✅ Created feature branch "${featureBranch}"`,
    branch: featureBranch,
  };
}

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new McpServer(
  {
    name: "gitflow-enforcer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.registerTool(
  "get_workflow_state",
  {
    description:
      "Get current workflow state including phase, tasks, and actionable items. " +
      "Use this to understand what tasks are ready to start, pending review, or blocked.",
  },
  () => {
    try {
      const result = getWorkflowState();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
      };
    }
  }
);

server.registerTool(
  "merge_task_to_feature",
  {
    description:
      "Merge a completed task branch to the feature branch. " +
      "VALIDATES: task is in review, agent_reviewed=true, all dependencies done, on correct branch. " +
      "Use this instead of raw git merge for task branches. This is the ONLY way to mark a task as done.",
    inputSchema: z.object({
      task_id: z.string().describe("The task ID to merge (from state.json)"),
    }),
  },
  ({ task_id }) => {
    const result = mergeTaskToFeature(task_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "merge_feature_to_main",
  {
    description:
      "Merge the feature branch to main. ONLY use in Phase 4 (DOCUMENTING). " +
      "VALIDATES: all tasks are done/cancelled, on feature branch, local is up-to-date. " +
      "Use this instead of raw git merge for final release.",
  },
  () => {
    const result = mergeFeatureToMain();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "transition_task_status",
  {
    description:
      "Change a task's status (orchestrator ACTIONS only). " +
      "Valid transitions: todo→blocked, blocked→todo, inprogress→blocked, " +
      "inreview→rejected/inprogress. " +
      "NOTE: Vibe Kanban handles todo→inprogress, inprogress→inreview automatically. " +
      "Cannot set status to 'done' directly - use merge_task_to_feature instead.",
    inputSchema: z.object({
      task_id: z.string().describe("The task ID to update"),
      new_status: z.enum([
        Status.TODO,
        Status.BLOCKED,
        Status.IN_PROGRESS,
        Status.IN_REVIEW,
        Status.REJECTED,
        Status.CANCELLED,
      ]).describe("The new status (cannot be 'done' - use merge tool)"),
      reason: z.string().optional().describe("Reason for transition (required for rejected status)"),
    }),
  },
  ({ task_id, new_status, reason }) => {
    const result = transitionTaskStatus(task_id, new_status, reason);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "create_feature_branch",
  {
    description:
      "Create a new feature branch from main. " +
      "VALIDATES: currently on main branch, branch doesn't exist locally or on remote. " +
      "Use after plan approval to create the project's feature branch.",
    inputSchema: z.object({
      project_name: z.string()
        .min(1)
        .max(50)
        .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dots, underscores, hyphens allowed")
        .describe("Project name (will create feature/{project_name})"),
    }),
  },
  ({ project_name }) => {
    const result = createFeatureBranch(project_name);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitFlow Enforcer MCP server running");
}

main().catch(console.error);
