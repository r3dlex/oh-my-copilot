---
name: omp-plan
description: OMP-aware strategic planning with interview, direct, consensus, and review modes
trigger: "plan:, /plan, /omp:plan, /omp-plan, --consensus"
autoinvoke: false
---

# Skill: OMP-Plan

## Metadata

| Field | Value |
|-------|-------|
| **ID** | `omp-plan` |
| **Keywords** | `plan:`, `/plan`, `/omp:plan`, `/omp-plan`, `--consensus` |
| **Tier** | Execution Mode |
| **Source** | `src/skills/omp-plan.mts` |

## Description

Strategic planning mode with optional interview workflow. Supports four modes: Interview (broad requests), Direct (detailed requests), Consensus (iterative Planner/Architect/Critic loop with RALPLAN-DR structured deliberation), and Review (Critic evaluation of an existing plan). Delays implementation until the plan is approved.

## Interface

```typescript
interface SkillInput {
  trigger: string;
  args: string[];
}

interface SkillOutput {
  status: "ok" | "error";
  message: string;
}

export async function activate(input: SkillInput): Promise<SkillOutput>
export function deactivate(): void
```

## Implementation

Activates the `plan` strategic planning mode by spawning `bin/omp.mjs plan [args]`. No persistent resources are maintained.

---

## Flags

```
omp-plan [--direct|--consensus|--review] [--interactive] [--deliberate] <task description>
```

| Flag | Description |
|------|-------------|
| `--direct` | Skip interview, generate plan immediately |
| `--consensus` | Run Planner → Architect → Critic loop (RALPLAN-DR) |
| `--review` | Critic evaluation of an existing plan |
| `--interactive` | Enable user prompts at draft review and final approval steps (consensus mode) |
| `--deliberate` | Force deliberate RALPLAN-DR mode: adds pre-mortem + expanded test plan |

---

## Mode Selection

| Mode | Trigger | Behavior |
|------|---------|----------|
| Interview | Default for broad requests | Interactive requirements gathering |
| Direct | `--direct`, or detailed request | Skip interview, generate plan directly |
| Consensus | `--consensus`, "ralplan" | Planner → Architect → Critic loop until agreement with RALPLAN-DR structured deliberation (short by default, `--deliberate` for high-risk); add `--interactive` for user prompts at draft and approval steps |
| Review | `--review`, "review this plan" | Critic evaluation of existing plan |

---

## Interview Mode (broad/vague requests)

1. **Classify the request**: Broad (vague verbs, no specific files, touches 3+ areas) triggers interview mode
2. **Ask one focused question** using `AskUserQuestion` for preferences, scope, and constraints
3. **Gather codebase facts first**: Before asking "what patterns does your code use?", explore the codebase to find out, then ask informed follow-up questions
4. **Build on answers**: Each question builds on the previous answer
5. **Consult Analyst** for hidden requirements, edge cases, and risks
6. **Create plan** when the user signals readiness: "create the plan", "I'm ready", "make it a work plan"

**Question Classification**:

| Type | Examples | Action |
|------|----------|--------|
| Codebase Fact | "What patterns exist?", "Where is X?" | Explore first, do not ask user |
| User Preference | "Priority?", "Timeline?" | Ask user via AskUserQuestion |
| Scope Decision | "Include feature Y?" | Ask user |
| Requirement | "Performance constraints?" | Ask user |

---

## Direct Mode (detailed requests)

1. **Quick Analysis**: Optional brief Analyst consultation
2. **Create plan**: Generate comprehensive work plan immediately
3. **Review** (optional): Critic review if requested

---

## Consensus Mode (`--consensus` / "ralplan")

**RALPLAN-DR modes**: **Short** (default, bounded structure) and **Deliberate** (for `--deliberate` or explicit high-risk requests: auth/security, data migration, destructive/irreversible changes, production incident, compliance/PII, public API breakage). Both modes keep the same Planner → Architect → Critic sequence and the same `AskUserQuestion` gates.

**Consensus mode runs fully automated by default**; add `--interactive` to enable user prompts at draft review (step 2) and final approval (step 6).

### Steps

1. **Planner** creates initial plan and a compact **RALPLAN-DR summary** before any Architect review. The summary **MUST** include:
   - **Principles** (3-5)
   - **Decision Drivers** (top 3)
   - **Viable Options** (>=2) with bounded pros/cons for each option
   - If only one viable option remains, an explicit **invalidation rationale** for alternatives that were rejected
   - In **deliberate mode**: a **pre-mortem** (3 failure scenarios) and an **expanded test plan** covering unit / integration / e2e / observability

2. **User feedback** *(--interactive only)*: If running with `--interactive`, **MUST** use `AskUserQuestion` to present the draft plan **plus the RALPLAN-DR Principles / Decision Drivers / Options summary** with these options:
   - **Proceed to review** — send to Architect and Critic for evaluation
   - **Request changes** — return to step 1 with user feedback incorporated
   - **Skip review** — go directly to final approval (step 6)
   If NOT running with `--interactive`, automatically proceed to review (step 3).

3. **Architect** reviews for architectural soundness. Adopt the Architect role and review the plan for:
   - Strongest steelman counterargument (antithesis) against the favored option
   - At least one meaningful tradeoff tension
   - A synthesis path when possible
   - In deliberate mode: explicitly flag principle violations
   
   **Wait for this step to complete before proceeding to step 4. Do NOT run steps 3 and 4 in parallel.**

   > Invoke the architect agent to review the plan. If using a sub-agent: "Adopt the Architect role and review this plan for architectural soundness. Provide the strongest steelman antithesis against the favored option, at least one real tradeoff tension, and a synthesis path where possible."

4. **Critic** evaluates against quality criteria. Run only after step 3 is complete.
   - Verify principle-option consistency
   - Fair alternative exploration
   - Risk mitigation clarity
   - Testable acceptance criteria
   - Concrete verification steps
   - In deliberate mode: **MUST** reject missing/weak pre-mortem or missing/weak expanded test plan

   > Invoke the critic agent to evaluate the plan. If using a sub-agent: "Adopt the Critic role and evaluate this plan. Verify principle-option consistency, fair alternative exploration, risk mitigation clarity, testable acceptance criteria, and concrete verification steps. Reject shallow alternatives, driver contradictions, vague risks, or weak verification."

5. **Re-review loop** (max 5 iterations): If Critic rejects, execute this closed loop:
   a. Collect all rejection feedback from Architect + Critic
   b. Pass feedback to Planner to produce a revised plan
   c. **Return to Step 3** — Architect reviews the revised plan
   d. **Return to Step 4** — Critic evaluates the revised plan
   e. Repeat until Critic approves OR max 5 iterations reached
   f. If max iterations reached without approval, present the best version to user via `AskUserQuestion` with note that expert consensus was not reached

6. **Apply improvements**: When reviewers approve with improvement suggestions, merge all accepted improvements into the plan file before proceeding. Final consensus output **MUST** include an **ADR** section with: Decision, Drivers, Alternatives considered, Why chosen, Consequences, Follow-ups.
   a. Collect all improvement suggestions from Architect and Critic responses
   b. Deduplicate and categorize the suggestions
   c. Update the plan file in `.omp/plans/` with the accepted improvements
   d. Note which improvements were applied in a brief changelog section at the end of the plan

7. On Critic approval *(--interactive only)*: If running with `--interactive`, use `AskUserQuestion` to present the plan with these options:
   - **Approve and implement via team** (Recommended) — proceed to implementation via `omp:team`
   - **Approve and execute via ralph** — proceed to implementation via `omp:ralph`
   - **Clear context and implement** — compact the context window first, then start fresh implementation via `omp:ralph` with the saved plan file
   - **Request changes** — return to step 1 with user feedback
   - **Reject** — discard the plan entirely
   If NOT running with `--interactive`, output the final approved plan and stop. Do NOT auto-execute.

8. *(--interactive only)* User chooses via the structured `AskUserQuestion` UI (never ask for approval in plain text).

9. *(--interactive only)* On user approval:
   - **Approve and implement via team**: Invoke `omp:team` with the approved plan path from `.omp/plans/` as context. Do NOT implement directly.
   - **Approve and execute via ralph**: Invoke `omp:ralph` with the approved plan path from `.omp/plans/` as context. Do NOT implement directly.
   - **Clear context and implement**: Compact the context window first, then invoke `omp:ralph` with the approved plan path.

---

## RALPLAN-DR Short Mode Workflow

Used by default in consensus mode. Bounded structure with four mandatory sections:

1. **Principles** (3-5 guiding constraints for this decision)
2. **Decision Drivers** (top 3 criteria that will determine the best option)
3. **Viable Options** (>=2) — for each option:
   - One-sentence description
   - Pros (2-3 bullets)
   - Cons (2-3 bullets)
4. **Invalidation rationale** (if only one viable option remains after analysis)

---

## RALPLAN-DR Deliberate Mode Workflow

Enabled with `--deliberate` or when the request explicitly signals high risk. Adds to the short mode:

- **Pre-mortem**: 3 specific failure scenarios (what could go wrong, how to detect it)
- **Expanded Test Plan**: unit / integration / e2e / observability layers

---

## Review Mode (`--review`)

1. Read plan file from `.omp/plans/`
2. Adopt the Critic role to evaluate the plan (or invoke critic agent)
3. Return verdict: APPROVED, REVISE (with specific feedback), or REJECT (replanning required)

---

## Plan Output Format

Every plan includes:
- Requirements Summary
- Acceptance Criteria (testable, 90%+ concrete)
- Implementation Steps (with file references, 80%+ claims cite file/line)
- Risks and Mitigations
- Verification Steps
- For consensus/ralplan: **RALPLAN-DR summary** (Principles, Decision Drivers, Options)
- For consensus/ralplan final output: **ADR** (Decision, Drivers, Alternatives considered, Why chosen, Consequences, Follow-ups)
- For deliberate consensus mode: **Pre-mortem (3 scenarios)** and **Expanded Test Plan** (unit/integration/e2e/observability)

Plans are saved to `.omp/plans/`. Drafts go to `.omp/drafts/`.

---

## Execution Policy

- Auto-detect interview vs direct mode based on request specificity
- Ask one question at a time during interviews — never batch multiple questions
- Gather codebase facts via exploration before asking the user about them
- Plans must meet quality standards: 80%+ claims cite file/line, 90%+ criteria are testable
- Consensus mode runs fully automated by default; add `--interactive` to enable user prompts
- Consensus mode uses RALPLAN-DR short mode by default; switch to deliberate mode with `--deliberate` or when the request signals high risk

---

## Final Checklist

- [ ] Plan has testable acceptance criteria (90%+ concrete)
- [ ] Plan references specific files/lines where applicable (80%+ claims)
- [ ] All risks have mitigations identified
- [ ] No vague terms without metrics ("fast" → "p99 < 200ms")
- [ ] Plan saved to `.omp/plans/`
- [ ] In consensus mode: RALPLAN-DR summary includes 3-5 principles, top 3 drivers, and >=2 viable options (or explicit invalidation rationale)
- [ ] In consensus mode final output: ADR section included (Decision / Drivers / Alternatives considered / Why chosen / Consequences / Follow-ups)
- [ ] In deliberate consensus mode: pre-mortem (3 scenarios) + expanded test plan (unit/integration/e2e/observability) included
- [ ] In consensus mode with `--interactive`: user explicitly approved before any execution; without `--interactive`: plan output only, no auto-execution
- [ ] **CRITICAL — Consensus mode agent calls MUST be sequential, never parallel.** Always await Architect review before issuing the Critic evaluation.

---

## Escalation and Stop Conditions

- Stop interviewing when requirements are clear enough to plan — do not over-interview
- In consensus mode, stop after 5 Planner/Architect/Critic iterations and present the best version
- Consensus mode without `--interactive` outputs the final plan and stops; with `--interactive`, requires explicit user approval before any implementation begins
- If the user says "just do it" or "skip planning", transition directly to `omp:ralph` for execution — do NOT implement directly in the planning agent
- Escalate to the user when there are irreconcilable trade-offs that require a business decision
