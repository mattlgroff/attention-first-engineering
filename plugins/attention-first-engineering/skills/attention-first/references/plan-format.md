# Planning artifact

Use this only after refinement has established the scope, team, estimates, and material assumptions. The artifact is the final planning output, not an interview form.

## Generate without rewriting the UI

The [example plan](../assets/example-plan.json) is illustrative and must not be presented as the user's plan. Create a JSON file with their accepted data, then run from this skill directory:

```sh
node scripts/render-plan.mjs /path/to/plan.json /path/to/plan.html
```

Node.js 22 or newer is sufficient; no package installation is required. The renderer combines [the HTML template](../assets/plan-template.html), [calculation code](../assets/planner-core.js), [UI code](../assets/planner-ui.js), and data into one offline HTML file. Open it with the host's file/browser tool. Export CSV includes the complete backlog and the selected scenario, regardless of visible filters. Save HTML preserves both the original plan and the current scenario. Neither action changes an external tracker or publishes a website.

## Input

```json
{
  "title": "Customer search",
  "startDate": "2026-10-05",
  "targetDate": "2026-10-30",
  "calendar": {
    "workingDays": [1, 2, 3, 4, 5],
    "holidays": ["2026-10-12"]
  },
  "roles": [{
    "id": "ai",
    "name": "AI engineer",
    "kind": "engineering",
    "defaultCapacity": 3,
    "people": [{
      "id": "ai-1",
      "name": "AI engineer 1",
      "capacity": 2,
      "workingDays": [1, 2, 3, 4, 5],
      "availableFrom": "2026-10-05",
      "availableUntil": "2026-11-06",
      "daysOff": [],
      "timeOff": [{"start": "2026-10-19", "end": "2026-10-23"}]
    }]
  }],
  "tickets": [{
    "id": "AI-101",
    "title": "Rank customer results",
    "feature": "Ranked search",
    "roleId": "ai",
    "size": "Week",
    "sizeRationale": "Includes ranking investigation, implementation, behavioral checks, review, and merge under the agreed workload.",
    "dependsOn": [],
    "outcome": "The agreed customer search returns ranked results.",
    "scope": ["Use the agreed ranking criteria."],
    "acceptance": ["Results follow the independently specified examples."],
    "verification": ["Check examples that would expose an incorrect ranking."],
    "understanding": "Explain ranking behavior and its failure cases.",
    "decisions": ["Preserve why these ranking criteria were chosen."],
    "risks": []
  }],
  "assumptions": ["Sizes include engineering understanding, testing, review, and merge."]
}
```

- Use ISO dates and weekday numbers 0 (Sunday) through 6 (Saturday). Dates have no time-of-day or timezone conversion. Confirm the calendar used for a distributed team.
- Every ticket has one responsible `roleId`; each scheduled ticket is assigned to one person in that role. Relate specialist tickets using `feature`, and add only actual prerequisites to `dependsOn`. Array order supplies scheduling priority among otherwise eligible tickets.
- `size` is `Day`, `Week`, or `null` while unresolved. Unsized tickets and their dependents stay visible as unscheduled. Keep unresolved scope in the brief and artifact.
- `earliestStart` on a ticket is optional for a known external availability date. It is not an invented engineering dependency.
- Roles are customizable. `kind: "support"` keeps optional product, design, QA, and similar work separate from engineering completion. Listing someone in the team does not create tickets for them.
- People have unique IDs. Use real names when supplied, otherwise a role-based placeholder. Do not represent the same person twice to create fictitious capacity. If they cover several specialties, agree an appropriate combined role/ticketing model rather than duplicating them.
- `capacity` is a positive integer. Three is the default, adjustable in either direction. `defaultCapacity` controls new people suggested for a role; per-person values can differ. There are no allocation percentages or fractional tickets.
- Omitted `availableFrom` means project start; `availableUntil` is an inclusive roll-off date. Working days, individual days off, and inclusive time-off ranges limit availability. New people initially inherit project working days; show and review that assumption.
- `sourceUrl` is optional and must be an HTTP(S) source the user can access. Size rationale (`sizeRationale`), scope, acceptance, verification, understanding, decisions, risks, and assumptions are supplied from refinement, not invented by the template.

## What the calculations mean

Day and Week remain engineering completion windows sized under the working pattern and concurrent workload agreed during refinement. The template uses one or five **project working days** as planning spans. It reserves a context on the assigned person's active days within that span, including its completion day. It does not interpret a Week as five attendance days spread across several calendar weeks.

Dependencies are finish-to-start. Extra people can move independent tickets earlier but do not shrink their size windows. Holidays advance the dated schedule. An unavailable completion day can extend a window, which is flagged for estimate review. Changing working patterns or time off also requests review of affected estimates. A calculated fit remains conditional on those assumptions and the engineer's judgment.

The dependency-chain bound ignores staffing limits. When even that bound exceeds the target, adding headcount alone cannot meet the date under the supplied estimates. The staffing suggestion uses a bounded heuristic, not a proof of the smallest possible team. Failure to find a team does not establish impossibility. Start/roll-off dates and unscheduled scope remain visible; the scheduler never splits one ticket between people to hide a conflict.

A scenario preserves the original plan for comparison. Reset restores it. Save HTML saves the selected proposal alongside it; saving is not acceptance. The artifact does not claim that an approval record or generated explanation proves understanding.

## Verify a generated plan

Check at least one dependency chain, a role constraint, a changed target, and the declared calendars against the user's facts. Inspect the browser, ticket details, CSV contents, and saved HTML after reopening. Report calculation/browser checks separately from live-model interview evaluations. If dates are not yet known, agree a clearly labeled illustrative calendar before producing a dated scenario rather than inventing a project commitment.
