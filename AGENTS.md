# Agent Instructions

## Coding Standards

**Architecture:**
- Follow **Hexagonal Architecture** (Ports and Adapters pattern)
- Keep business logic pure and isolated from external dependencies
- Use ports (interfaces) to define contracts
- Implement adapters for external integrations

**Design Principles:**
- Follow **SOLID principles**:
  - **S**ingle Responsibility: Each class/module has one reason to change
  - **O**pen/Closed: Open for extension, closed for modification
  - **L**iskov Substitution: Subtypes must be substitutable for base types
  - **I**nterface Segregation: Many specific interfaces over one general interface
  - **D**ependency Inversion: Depend on abstractions, not concretions
- Apply **Clean Code** practices:
  - Meaningful names that reveal intent
  - Functions should be small and do one thing
  - Minimize comments by writing self-documenting code
  - Keep cyclomatic complexity low
- Use **Design Patterns** appropriately to reduce coupling and improve maintainability
- Favor composition over inheritance

## Testing Standards

**DO NOT WRITE UNIT TESTS** unless explicitly requested.

**TDD Workflow (MANDATORY):**
When I ask you to work on a new feature, create a set of tasks that implement the following flow. Use tasks dependencies
to make sure these are implemented in order

1. Create a feature summary named feature-summary.md, put it in a subfolder in docs/features and get it approved
2. Once the feature summary is approved, create acceptance criteria using Gherkin syntax and place this in the feature 
   folder with the name acceptance-criteria.md
3. Get the acceptance criteria reviewed
4. Once the acceptance criteria are approved, create a design overview in the same folder and get it reviewed and approved
5. For EACH acceptance criteria, do this in order:
  5.1. Write **ONE acceptance test** for each acceptance criteria. DO NOT WRITE UNIT TESTS UNLESS REQUESTED
  5.2. Run the test and watch it **FAIL**
  5.3. Write minimal code to make it **PASS**
  5.6. Use /ocr-review command to run a review
  5.7 **REFACTOR** based on feedback from the review, while keeping tests green

**Acceptance Test Requirements:**
- Test at the level of the **public contract**
- Test behavior, not implementation details
- Run in **complete isolation**
- **Stub/Mock all external dependencies**:
  - Third-party services
  - Other services/APIs
  - File systems
  - Databases
  - Network calls
- Focus on business requirements and acceptance criteria

**DO NOT WRITE END-TO-END TESTS** unless explicitly requested.

**Test Code Quality:**
- Follow the same coding standards as production code
- Apply SOLID principles to test code
- Keep tests maintainable and readable
- Use clear arrange-act-assert structure


## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
