---
paths: **/*
---

# AI-Pack Mandatory Gates

All work must follow these quality gates from the ai-pack framework.

## Gate 1: Beads Task Management (BLOCKING)

**BEFORE starting ANY task:**

```bash
# Create Beads task
bd create "Task description" --priority high

# Start the task
bd start <task-id>

# Use formulas for complex workflows
bt --help
bt <formula-name> <args>
```

**Enforcement:** All work must be tracked in Beads.

---

## Gate 2: Execution Strategy (For 3+ Subtasks)

**For tasks with 3+ independent subtasks:**

1. **Analyze parallelization opportunities** BEFORE execution
2. **Track strategy using Beads**:
   - Create subtasks with dependencies: `bd dep add <child> <parent>`
   - Mark which can run in parallel vs sequential
   - Use Beads formulas to coordinate complex workflows
3. **Execute accordingly** - Use Task tool for parallel work

**Enforcement:** Cannot execute without documented strategy in Beads.

**Reference:** `.ai-pack/gates/25-execution-strategy.md`

---

## Gate 3: Code Quality Review (BLOCKING)

**For ALL code changes, MANDATORY validations:**

### Step 1: Tester Validation
```bash
/ai-pack test
```
- TDD process verification
- Coverage validation (80-90% overall, 95%+ critical)
- Test quality assessment
- **Must receive APPROVED verdict**

### Step 2: Reviewer Validation
```bash
/ai-pack review
```
- Code quality verification
- Standards compliance
- Security review
- **Must receive APPROVED verdict**

**Enforcement:** Work status = INCOMPLETE until both approve.

**Reference:** `.ai-pack/gates/35-code-quality-review.md`

---

## Gate 4: Artifact Persistence (For Planning Specialists)

**When specialists used (PM, Architect, Designer, Inspector):**

**MUST persist artifacts to `docs/`:**
- Cartographer → `docs/product/*.md`
- Architect → `docs/architecture/*.md` + `docs/adr/*.md`
- Designer → `docs/design/[feature]/`
- Inspector → `docs/investigations/*.md`

**MUST cross-reference documents:**
- PRD ↔ Architecture
- Architecture ↔ ADRs
- Design ↔ PRD
- Investigation ↔ Architecture

**MUST commit to repository.**

**Enforcement:** Orchestrator BLOCKS implementation until persistence complete.

**Reference:** `.ai-pack/gates/10-persistence.md`

---

## C# Projects: Modern Tooling Gate (BLOCKING)

**Before committing C# code, run:**

```bash
# Step 1: Format
dotnet csharpier .

# Step 2: Build with analyzers
dotnet build /warnaserror

# Step 3: Test
dotnet test

# ALL must pass
```

**Required configuration:**
- `.editorconfig` - Analyzer rules
- `.csharpierrc.json` - Formatter settings
- Modern tooling packages (CSharpier, Roslynator)

**Enforcement:** Reviewer BLOCKS if not followed.

**Reference:** `.ai-pack/quality/clean-code/csharp-modern-tooling.md`

---

## Quick Gate Checklist

Before marking work complete:

- [ ] Beads task created and tracked
- [ ] Execution strategy documented in Beads (if 3+ subtasks)
- [ ] TDD process followed (RED-GREEN-REFACTOR)
- [ ] Tester validated (APPROVED)
- [ ] Reviewer validated (APPROVED)
- [ ] Planning artifacts persisted (if specialists used)
- [ ] C# tooling passed (if C# project)
- [ ] Beads task closed: `bd close <task-id>`

**All gates must pass before work is accepted.**
