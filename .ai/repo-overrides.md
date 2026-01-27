# Project-Specific Overrides

This file contains project-specific rules that override or extend the ai-pack framework defaults.

## Language/Technology

- Language: TypeScript
- Framework: GraphQL

## Coding Standards

[Any project-specific coding standards that differ from .ai-pack/quality/]

## Testing Requirements

In this project DO NOT WRITE UNIT TESTS. Instead, focus on acceptance tests
that exercies the full system behavior. These tests should map one-to-one
to acceptance criteria defined in the work items.

CRITICAL: OVERRIDE TESTING PYRAMID REQUIREMENTS IN .ai-pack/quality/testing-requirements.md and in .ai-pack/workflows/feature.md

## Build/Deploy

[Project-specific build or deployment considerations]

## Notes

[Any other project-specific guidance for AI assistants]


## GitHub Integration

This project uses GitHub integration for automated Beads ↔ GitHub synchronization.

### Role Extensions

This project extends the following roles with GitHub integration:
- **Orchestrator**: See [.ai/roles/orchestrator-github-extension.md](.ai/roles/orchestrator-github-extension.md)
- **Engineer**: See [.ai/roles/engineer-github-extension.md](.ai/roles/engineer-github-extension.md)
- **Security**: See [.ai/roles/security-github-extension.md](.ai/roles/security-github-extension.md)

### Setup Required

To complete GitHub integration setup:

1. **Initialize integration:**
   ```bash
   ${AI_PACK_ROOT}/scripts/github-integration.py init
   ```

2. **Configure** `${AI_PACK_ROOT}/.github-integration.yml`:
   - Set repository: `your-org/your-repo`
   - Enable agent triggers
   - Configure role-specific options

3. **Authenticate:**
   ```bash
   gh auth login
   # OR
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

4. **Test:**
   ```bash
   ${AI_PACK_ROOT}/scripts/github-integration.py status
   ```

### Documentation

- [Setup Guide](../.ai-pack/docs/GITHUB-INTEGRATION-SETUP.md)
- [Agent Triggers](../.ai-pack/docs/GITHUB-AGENT-TRIGGERS.md)
- [Work Item Patterns](../.ai-pack/docs/WORK-ITEM-PATTERNS.md)
