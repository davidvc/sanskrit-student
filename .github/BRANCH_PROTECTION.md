# Branch Protection Setup

To require the CI tests to pass before merging PRs to `main`:

1. Go to your GitHub repository Settings
2. Navigate to **Branches** in the left sidebar
3. Click **Add branch protection rule**
4. Configure the following settings:

## Branch name pattern
```
main
```

## Protection rules to enable

### Require a pull request before merging
- ✅ Require a pull request before merging
- ✅ Require approvals: 1 (or your preference)

### Require status checks to pass before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- **Status checks that are required:**
  - `test` (this will appear after the first workflow run)

### Additional recommended settings
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

## Verifying the workflow

After creating your first PR, the workflow will run automatically. You should see:
- A "PR Tests" check appear on the PR
- The check must pass (green) before the "Merge" button becomes available

## Workflow Details

The workflow (`pr-tests.yml`) runs on every PR to `main` and performs:
1. Type checking (TypeScript compilation check)
2. All Vitest tests (unit and acceptance)

**Note:** The workflow uses Node.js 20.19.0 to match the project's engine requirements.
