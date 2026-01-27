# Security GitHub Extension

**Base Role:** `.ai-pack/roles/security.md` (not yet defined in base)
**Extension Type:** GitHub Integration

## Overview

This extension defines GitHub integration for Security role, enabling
automatic creation of private security issues for investigations.

## GitHub Integration Features

### SEC Issue Creation

When Security role creates investigation tasks:

```bash
bd create "SEC: SQL injection in user search" --assignee Security
```

**Auto-triggers** (if enabled):
- Creates private GitHub issue (org repos only)
- Labels: `security`, `needs-review`
- Assigns to security team
- Tracks investigation progress

### Security Investigation Workflow

1. Security discovers vulnerability
2. Creates SEC task in Beads
3. GitHub issue auto-created (private)
4. Investigation tracked in both systems
5. Resolution synced back

## Configuration

Enable in `${AI_PACK_ROOT}/.github-integration.yml`:

```yaml
features:
  agent_triggers:
    enabled: true
    security:
      sec_issue_creation: true    # Auto-create SEC issues
      sec_labels:
        - "security"
        - "needs-review"
        - "vulnerability"
      sec_private: true             # Private visibility (org only)
      sec_assignees:
        - "security-team"
```

## Usage

### Creating Security Issue

```bash
# In Beads
bd create "SEC: Investigation - XSS in comment form" \
  --assignee Security \
  --priority critical

# Automatically creates private GitHub issue
```

### Manual Operations

```bash
# Create security issue manually
${AI_PACK_ROOT}/scripts/github-integration.py create-security-issue <task-id>
```

## Security Considerations

- **Private issues**: Only available in organization repositories
- **Access control**: Limit who can see security issues
- **Sync patterns**: Optionally exclude SEC tasks from public sync
- **Audit trail**: Maintain investigation history

## References

- [GitHub Integration Setup](../.ai-pack/docs/GITHUB-INTEGRATION-SETUP.md)
- [GitHub Agent Triggers](../.ai-pack/docs/GITHUB-AGENT-TRIGGERS.md)
