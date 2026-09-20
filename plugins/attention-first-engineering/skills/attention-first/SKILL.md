---
name: attention-first
description: Refines engineering requests into coherent Day/Week tickets and capacity plans while protecting human judgment. Activates for backlog refinement, AI-assisted delivery sizing, developer capacity planning, or Attention-First Engineering.
---

# Attention-First Engineering

**Build fast without undermining human judgment.**

Work inside the user's existing assistant or agentic harness. Solo use is sufficient; pairing is optional. Agents can implement, investigate, run checks, review code, challenge decisions, and prepare evidence. The accountable human owns product intent, tradeoffs, and acceptance. Passing tests, clean security scans, approval status, or a persuasive generated review summary do not establish human understanding or a sound product decision.

## Interview

Interview the user relentlessly until reaching shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one.

Use `AskUserQuestion`. Ask one question at a time so each answer informs the next. For each question, provide your recommended answer grounded in available context and explain what it changes. Before asking, check conversation history, accessible files and documents, available connectors, and `WebSearch`. Ask only questions requiring human judgment, context the user holds, or a design decision. Use an available equivalent when a named tool is unavailable; otherwise ask directly in conversation. Distinguish inspected evidence from assumptions.

Read [the interview contract](references/grill-me.md) before the first question for tool equivalents and waiting behavior. A separate `/grill-me` installation is not required.

Start from any material, even a sentence; documentation and repository access are optional. Resolve material branches or explicitly defer them with their implications. For unknowns, recommend clarification, investigation, or an assumption for human agreement. Continue unaffected work after the answer or deferral. Reuse settled answers across tickets and stop at shared understanding; do not reopen settled questions or manufacture more.

Adapt the grilling to the decisions that matter for this work:

- **Product intent:** Establish the useful outcome, accepted scope, material tradeoffs, and who can resolve unsettled decisions. Surface workflow, usability, scope, and business behavior choices. An FDE with the context can supply product and technical judgment; involve an FDS or client when their input is needed. Obtain human agreement for additional features or changed behavior.
- **Understanding:** Identify what the engineer must understand to own the result: why it exists, how behavior works, relevant interactions and system boundaries, constraints, invariants, failure cases, and acceptance evidence. Help investigate gaps. Keep this proportional to the change; generated explanations and approval records are aids, not proof of understanding.
- **Verification:** Challenge which plausible incorrect behavior could still pass the proposed checks. Where useful, reproduce the defect, demonstrate a regression test fails on broken behavior, test an invariant, or check an independently specified outcome. Implementation and tests can share a mistaken assumption. Choose proportionate verification that supports human acceptance; automated evidence does not decide desirability.
- **Continuity:** Identify decisions and constraints the next engineer must understand after the session. Preserve material assumptions, tradeoffs, contracts, and verification reasoning in an appropriate existing artifact, updating subsystem documentation alongside behavior changes when useful. Use available project documentation or the brief when repository access is absent.

## Shape and size

Unless told otherwise, assume a fully allocated, AI-native full-stack engineer who can learn unfamiliar codebases and use agentic tools effectively.

Shape each ticket around one coherent outcome that can be independently verified and safely integrated. Include implementation, tests, and human review. Merge overlapping requests and split distinct outcomes, avoiding administrative fragments. Several small PRs can deliver one ticket; PR count establishes neither understanding nor productivity.

Size complete engineering execution: code understanding, refinement, guiding agents, appropriate developer testing, human review, and merge. The engineer must understand and stand behind the affected behavior and its evidence, without memorizing the entire codebase. Keep QA capacity separate from engineering completion; QA acceptance and release may happen later.

Use only two sizes:

- **Day:** Engineering completion within one normal working day or less.
- **Week:** Engineering completion within one normal working week or less.

Test Day first, then Week, allowing for iteration and the proposed concurrent workload. Above Week, meaningfully split outcomes or agree a scope reduction. If a material unknown prevents sizing, leave it unsized and identify what would resolve it. Explain each size and boundary. Express uncertainty through specific risks, assumptions, and unresolved questions, without hours, story points, confidence labels, or scores.

## Plan when requested

Plan at most three ticket contexts per fully allocated developer per working day. This is a planning ceiling, not a scientifically established universal limit or completion quota. Count ticket contexts, not PRs, meetings, or review activities.

Week tickets can coexist with Day or other Week tickets, occupying one context on each planned active day. Check dependencies and combined demands with the engineer; the count alone does not establish feasibility. A ticket completed today still counts toward today's ceiling.

Use supplied working dates and availability. Without dates, offer an undated sequence or illustrative week. Keep unresolved and overflow work visible rather than shrinking scope to fit.

## Deliver

Provide the clarified brief and agreed backlog, including outcome and accepted scope, material tradeoffs, acceptance and verification expectations, size and rationale, dependencies, and relevant risks, assumptions, and open questions. Include a capacity plan when requested. Keep understanding and durable decisions within these existing artifacts, proportional to the work.

When an accepted decision changes, identify affected tickets and propose revisions. Before handoff, check scope coverage or explicit deferral, meaningful ticket boundaries, and plan feasibility. Obtain the engineer's review of the result using the same interview contract. Implementation or publication must be part of the user's request.

Consult [worked examples](references/examples.md) for adaptive questions, sizing, and scheduling. Use [evaluation scenarios](evals/evals.json) when evaluating the skill; they are not test results.
