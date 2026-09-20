---
name: attention-first
description: Refines engineering requests into coherent Day/Week tickets and visual capacity plans while protecting human judgment. Activates for backlog refinement, AI-assisted delivery sizing, developer capacity planning, or Attention-First Engineering.
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
- **Understanding:** Identify what the engineer must understand to own the result: why it exists, how behavior works, relevant interactions and system boundaries, constraints, invariants, failure cases, and acceptance evidence. Help investigate gaps. Keep this proportional to the change; generated explanations, checked boxes, and approval records are aids, not proof of understanding.
- **Verification:** Challenge which plausible incorrect behavior could still pass the proposed checks. Where useful, reproduce the defect, demonstrate a regression test fails on broken behavior, test an invariant, or check an independently specified outcome. Implementation and tests can share a mistaken assumption. Choose proportionate verification that supports human acceptance; automated evidence does not decide desirability.
- **Continuity:** Identify decisions and constraints the next engineer must understand after the session. Preserve material assumptions, tradeoffs, contracts, and verification reasoning in an appropriate existing artifact, updating subsystem documentation alongside behavior changes when useful. Use available project documentation or the brief when repository access is absent.

## Shape and size

Unless told otherwise, assume a fully allocated, AI-native engineer who can learn unfamiliar codebases and use agentic tools effectively. Establish the team's roles and ticketing model: specialist teams may use related frontend, backend, or AI tickets; full-stack teams may own the whole feature in one ticket. Give each ticket one responsible role and use only real dependencies to sequence related tickets.

Within the team's working model, shape each ticket around a coherent outcome with clear verification and integration boundaries. Include implementation, tests, and human review. Merge overlapping requests and split distinct outcomes, avoiding administrative fragments. Several small PRs can deliver one ticket; PR count establishes neither understanding nor productivity.

Size complete engineering execution: code understanding, refinement, guiding agents, appropriate developer testing, human review, and merge. The engineer must understand and stand behind the affected behavior and its evidence, without memorizing the entire codebase. Keep QA capacity separate from engineering completion; QA acceptance and release may happen later.

Use only two sizes:

- **Day:** Engineering completion within one normal working day or less.
- **Week:** Engineering completion within one normal working week or less.

Test Day first, then Week, allowing for iteration and the proposed concurrent workload. Above Week, meaningfully split outcomes or agree a scope reduction. If a material unknown prevents sizing, leave it unsized and identify what would resolve it. Explain each size and boundary. Express uncertainty through specific risks, assumptions, and unresolved questions, without hours, story points, confidence labels, or scores.

## Visualize and plan

Use [small, decision-focused visuals](references/visuals.md) during grilling: text diagrams and tables for CLI use, Mermaid where the host renders it. Keep HTML for the final artifact. Show dependencies, boundaries, before/after scope, or calendars when they help understanding. Keep interview questions in conversation.

Establish the team, dates, and availability when planning is requested. Use names when known and role-based placeholders otherwise. Start each person at project day one unless told otherwise; capture later starts, roll-off dates, working days, holidays, and relevant time off. Each person belongs to exactly one role in this plan. Keep other-project commitments outside this workflow.

Default to **three daily ticket contexts per person**, adjustable upward or downward through the interview. Use whole numbers, such as two for an AI engineer or five for a QA reviewer; no allocation percentages or fractional tickets. This is an agreed planning limit, not a universal scientific limit or completion quota. Count tickets, not PRs, meetings, or review activities. Completing a ticket does not free its context for another ticket that day.

Week tickets can coexist with Day or Week tickets under a credible combined workload. Each occupies one context on its planned active days. Review the combined demands; counts alone do not establish feasibility. Size Day/Week completion under the declared availability, and revisit affected estimates when that working pattern changes.

Product, design, QA, and other roles are customizable and optional. Listing them does not automatically add work. Include their tickets only when useful to the user's plan, and keep their capacity and completion separate from engineering completion.

Compare dates and staffing without shrinking scope or treating more people as a way to compress every ticket. Expose dependency chains, known external dates, calendar conflicts, and unscheduled work. Use supplied dates; otherwise agree an undated sequence or explicitly illustrative calendar.

## Deliver

Provide the clarified brief and agreed backlog, including outcome and accepted scope, material tradeoffs, acceptance and verification expectations, size and rationale, dependencies, and relevant risks, assumptions, and open questions. Include a capacity plan when requested. Keep understanding and durable decisions within these existing artifacts, proportional to the work.

When an accepted decision changes, identify affected tickets and propose revisions. Before handoff, check scope coverage or explicit deferral, meaningful ticket boundaries, and plan feasibility. Obtain the engineer's review of the result using the same interview contract. Implementation or publication must be part of the user's request.

For a final visual plan, use the bundled [standalone HTML template and renderer](references/plan-format.md). Fill accepted data instead of regenerating the interface. Open capacity and timeline first, with a linked backlog and ticket details. Support dated staffing scenarios, person-specific calendars, CSV export, and saving the selected scenario as HTML. Keep the agreed plan visible for comparison; computed scenarios support human review and are not automatic acceptance.

Consult [worked examples](references/examples.md) for adaptive questions, sizing, and scheduling. Use [evaluation scenarios](evals/evals.json) when evaluating the skill; they are not test results.
