# Worked examples

These illustrate decisions, not fixed estimates for categories of work. Use the actual project context to choose Day or Week.

## Start with a sentence

**Input:** "We need invoicing."

**First question:** "What is the first useful outcome: producing an invoice for review, sending it, or collecting payment? I recommend starting with producing an invoice for review so we can establish correct billing before adding delivery and payment behavior."

Use `AskUserQuestion` or its available equivalent, following [the interview contract](grill-me.md); otherwise ask directly in conversation. Wait for the answer before exploring the next decision. Do not assume the user accepted the recommendation or add payment collection to the scope without agreement.

## Investigate before asking

**Input:** "Add an account-status filter to the customer list."

The user provides an API specification. Read it before asking whether the backend supports the filter. If relevant code or connector access is available, inspect it too. Use the available web search tool for a public API fact that requires verification, not as a substitute for private project evidence.

If filtering is confirmed, ask the unresolved product question:

"Should the list initially show active customers or all customers? I recommend active customers, with an explicit All option, to prioritize current accounts without hiding access to inactive ones."

If the API capability remains unknown, propose an assumption rather than claiming it is verified. Explain that missing filter support would add backend work and require re-sizing. Do not ask the same question again after the user has answered it.

## A coherent Day ticket

**Outcome:** An administrator can revoke a pending invitation.

**Acceptance:** Authorized administrators can revoke a pending invitation; its link can no longer be used. Accepted invitations are unaffected. Unauthorized requests are rejected.

**Verification:** Exercise the relevant authorization and state transitions with regression tests, human code review, and merge.

**Proposed size:** Day, assuming existing invitation, authorization, UI, and test patterns support this behavior and the engineer accepts the proposed workload.

Keep implementation, tests, and review in one ticket. Generating the endpoint is not completion.

## Keep a coherent Week ticket intact

**Outcome:** An administrator can preview and import a fixed-format customer file with row-specific validation errors.

The agreed scope includes duplicate handling, authorization, and failure behavior. Existing storage and UI patterns are available. Import mapping configuration and scheduling are outside this outcome.

**Proposed size:** Week, if the engineer can credibly complete and verify this bounded workflow under the planned workload. Several reviewed pull requests can deliver it, using one ticket context on each active day. For a full-stack team, keep that outcome intact. A specialist team may instead agree related frontend and backend tickets with clear integration and acceptance boundaries. Keep testing and review within the engineering tickets rather than creating administrative fragments.

## Split beyond Week

**Input:** A request combines customer import, reconciliation, recurring scheduling, and reporting. The engineer does not expect the combined outcome to fit Week.

Propose distinct deliverables with their own acceptance boundaries. Check dependencies before ordering them. Grill and size each resulting ticket; do not assign every child Day automatically or omit requested behavior to fit the window.

## Record a consequential assumption

**Assumption:** Each customer uses one invoice currency.

**Risk:** Multi-currency billing would change the data model, calculations, and verification scope, invalidating the proposed size.

**Next decision:** Recommend confirming this rule before scheduling the affected work. The engineer may instead approve a provisional plan under the explicit assumption. Continue refining unaffected tickets. No confidence rating is needed.

## Review a combined plan

**Input:** One fully allocated engineer proposes a Week ticket plus two Day tickets on Monday.

The combination occupies three contexts. Check whether the Week ticket's planned progress and both Day completions are credible together, including their verification requirements and dependencies. Recommend moving a Day ticket when shared constraints make the grouping unrealistic.

Three concurrent Week tickets are also permitted if the engineer agrees that each completion window is credible under that combined workload. Neither pattern guarantees throughput. Completing a Monday ticket does not free a context that day. A fourth context requires an explicitly agreed capacity change and a credible combined workload; three is the default, not a hard ceiling.

## Correct code, unsettled product intent

**Input:** "The CSV export meets the criteria and passes tests. The agent chose to export only the current page. Our users need to reconcile every matching customer, but the ticket just says 'download filtered results.'"

**Question:** "What would make this the wrong solution even if it met the literal acceptance criteria and passed every automated check? I recommend exporting all matching customers because reconciliation needs the complete set; that changes pagination behavior, possible export limits, and verification scope."

Read the available workflow evidence first, then surface the page-versus-all decision for human agreement. The FDE can settle it if they have the context; involve an FDS or client only for missing product judgment. Record the accepted boundary and tradeoff in the ticket. Passing checks does not settle what users should receive.

## A green test that misses broken behavior

**Input:** "The invitation-revocation test checks that the endpoint returns 200. It still passes when a revoked invitation can be accepted."

**Question:** "What plausible incorrect implementation could still pass these checks? I recommend testing acceptance through the revoked link because a successful revocation response can hide an unchanged authorization path."

Reproduce the acceptance defect. Recommend a regression that creates and revokes an invitation, then attempts acceptance and expects rejection under the agreed contract. Show it fails on the broken behavior and passes with the fix. Check relevant unaffected states as appropriate. A response-code assertion alone cannot establish the behavioral invariant; exhaustive testing is not necessary to expose this defect.

## Understanding across several PRs

**Input:** "One Week import ticket uses three PRs for validation, preview, and commit. Duplicate rows must reject the whole file without writes. Another engineer will maintain it."

**Question:** "What must you be able to explain about this change before considering it complete? I recommend tracing preview through commit, including duplicate handling and the no-partial-writes invariant, because three individually plausible PRs can disagree at their boundaries."

Investigate gaps with the engineer using code, contracts, or supplied documents. Review the evidence for the combined outcome and retain one ticket context; neither three PR approvals nor a generated explanation proves the engineer understands it.

Once that is resolved, ask if needed: "What decision or constraint must the next engineer understand without reconstructing this entire chat? I recommend preserving why duplicates reject the whole file, where commit revalidates the preview, and how verification checks for partial writes, so maintenance preserves the accepted import behavior."

Use the existing import documentation and ticket, or the agreed brief without repository access. Keep this proportional: clarify the material contract rather than adding an essay, oral exam, or management ticket.

## Team model and calendars

**Input:** "We have one frontend engineer, one backend engineer, Matt as our AI engineer, and QA joining later. We use one ticket per specialty. Matt can carry two contexts; QA can carry five. Matt is away July 6 through July 17."

Preserve that ticketing model and record one responsible role per ticket. Relate tickets by feature and investigate actual prerequisites rather than assuming frontend must always wait for backend. Use real names where supplied and role-based placeholders elsewhere. Keep QA capacity separate and add QA tickets only if requested for the plan. Record the joining date and vacation range, then size under that availability.

Show a small dated dependency or capacity diagram before asking the next unresolved judgment question. For a target reduction, distinguish staffing delays from dependency and calendar limits. Do not round a supposed 1.5 tickets: use the agreed integer capacity.

## Final output, not an interview form

After the brief and backlog are agreed, populate the bundled planning template. The user can change a target date, inspect proposed staffing and constraints, open ticket details, export the complete CSV, and save the scenario as a standalone HTML file. Keep interview questions in the assistant conversation. If the user changes a working pattern, identify estimates that need review; saving the file is not human acceptance.
