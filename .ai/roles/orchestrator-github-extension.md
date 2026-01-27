# Orchestrator GitHub Extension

**Base Role:** `.ai-pack/roles/orchestrator.md` (immutable, managed by ai-pack)
**Extension Type:** GitHub Integration

## Overview

This extension adds GitHub integration capabilities to the Orchestrator role,
enabling automatic synchronization between Beads tasks and GitHub Issues.

## GitHub Integration Features

### Automatic Epic Creation

When you create an epic in Beads with the Orchestrator role:

```bash
bd create "Epic: User Authentication System" --assignee Orchestrator
```

**Auto-triggers** (if enabled in configuration):
- Creates GitHub Epic Issue with label `epic`
- Creates Story Issues for all dependent tasks
- Links stories in epic checklist
- Bidirectional references (Beads ↔ GitHub)

### Work Breakdown Sync

When breaking down epics into stories:
- Story creation automatically syncs to GitHub
- Issues labeled with `story`
- Linked to parent epic
- Task packets created if configured

## Configuration

Enable in `${AI_PACK_ROOT}/.github-integration.yml`:

```yaml
features:
  agent_triggers:
    enabled: true
    orchestrator:
      epic_creation: true      # Auto-create epics
      work_breakdown: true     # Auto-sync stories
```

## Usage

### Manual Sync

```bash
# Initialize integration
${AI_PACK_ROOT}/scripts/github-integration.py init

# Create epic (manual sync)
${AI_PACK_ROOT}/scripts/github-integration.py create-epic <beads-task-id>

# Full sync
${AI_PACK_ROOT}/scripts/github-integration.py sync
```

### Automatic Sync (Recommended)

With agent triggers enabled, GitHub updates happen automatically when
you create epics or break down work. No manual commands needed.

## References

- [GitHub Integration Setup](../.ai-pack/docs/GITHUB-INTEGRATION-SETUP.md)
- [GitHub Agent Triggers](../.ai-pack/docs/GITHUB-AGENT-TRIGGERS.md)
- [Work Item Patterns](../.ai-pack/docs/WORK-ITEM-PATTERNS.md)
- [Base Orchestrator Role](../.ai-pack/roles/orchestrator.md)
