# Engineer GitHub Extension

**Base Role:** `.ai-pack/roles/engineer.md` (immutable, managed by ai-pack)
**Extension Type:** GitHub Integration

## Overview

This extension adds GitHub integration capabilities to the Engineer role,
enabling automatic status updates when working on tasks.

## GitHub Integration Features

### Task Lifecycle Sync

When you start or complete tasks:

```bash
bd start bd-story-123    # → GitHub issue labeled "in-progress"
bd complete bd-story-123 # → GitHub issue marked complete
```

**Auto-triggers** (if enabled):
- Updates issue labels
- Adds status comments
- Updates epic checklists
- Moves cards on Project boards

### Pull Request Integration

Optional automatic draft PR creation when pushing feature branches.

## Configuration

Enable in `${AI_PACK_ROOT}/.github-integration.yml`:

```yaml
features:
  agent_triggers:
    enabled: true
    engineer:
      task_start: true           # Auto-update on bd start
      task_complete: true        # Auto-update on bd complete
      auto_draft_pr: false       # Optional: auto-create draft PRs
```

## Usage

### Typical Engineer Workflow

```bash
# 1. Start task (syncs to GitHub)
bd start bd-story-456

# 2. Implement solution
# ... work on code ...

# 3. Complete task (syncs to GitHub)
bd complete bd-story-456

# GitHub issue automatically updated at each step
```

### Manual Operations

```bash
# Export specific task
${AI_PACK_ROOT}/scripts/github-integration.py export

# Create PR manually
${AI_PACK_ROOT}/scripts/github-integration.py create-pr
```

## References

- [GitHub Integration Setup](../.ai-pack/docs/GITHUB-INTEGRATION-SETUP.md)
- [GitHub Agent Triggers](../.ai-pack/docs/GITHUB-AGENT-TRIGGERS.md)
- [Base Engineer Role](../.ai-pack/roles/engineer.md)
