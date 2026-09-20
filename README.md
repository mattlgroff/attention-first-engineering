# Attention-First Engineering

**Build fast without undermining human judgment.**

Matthew Groff's method for refining engineering work and planning human attention when agents do much of the implementation. Start with any material, even a sentence, inside the assistant you already use. Solo use is sufficient; pairing is optional.

Agents can implement, investigate, review, challenge decisions, and prepare evidence. The accountable human still owns product intent, tradeoffs, understanding, and acceptance. Passing checks and generated reviews support that judgment; they cannot establish it.

The method shapes **Day** and **Week** tickets covering complete engineering execution, including code understanding, refinement, testing, human review, and merge. Establish how the team works: related tickets per specialty or full-stack outcomes. Each ticket has one responsible role, and each person belongs to one role.

Default to **three daily ticket contexts per person**, adjustable in either direction during refinement. Use integer capacities, named people or role-based placeholders, working days, holidays, start and roll-off dates, and time off. Three is a starting assumption, not a scientific limit or productivity quota. QA and other optional support work stay separate from engineering completion. Other-project commitments are outside the plan.

Read [the blogpost](https://groff.dev/blog/how-should-we-estimate-work-when-agents-write-the-code) for the reasoning and initial forecasting proposal.

## Install in Codex

```sh
codex plugin marketplace add mattlgroff/attention-first-engineering --ref main
codex plugin add attention-first-engineering@attention-first-engineering
```

Start a new task, then invoke `$attention-first-engineering:attention-first` or ask naturally to use Attention-First Engineering.

## Install in Claude Code

```sh
claude plugin marketplace add mattlgroff/attention-first-engineering
claude plugin install attention-first-engineering@attention-first-engineering
```

Start a new session, then invoke `/attention-first-engineering:attention-first` or ask naturally to use Attention-First Engineering.

Both plugins load the same [canonical skill](plugins/attention-first-engineering/skills/attention-first/SKILL.md), [interview contract](plugins/attention-first-engineering/skills/attention-first/references/grill-me.md), and [worked examples](plugins/attention-first-engineering/skills/attention-first/references/examples.md). The interview uses `AskUserQuestion` and `WebSearch` or the host's available equivalents, with direct conversation as the question fallback.

If you previously installed a standalone `attention-first` or `attention-first-engineering` skill, replace that copy when switching to the plugin to avoid loading two versions. For a standalone installation, copy the entire `plugins/attention-first-engineering/skills/attention-first` folder into your host's skills directory, preserving its supporting files.

See the official [Codex plugin documentation](https://developers.openai.com/plugins/build/plugins), [Codex skill documentation](https://developers.openai.com/codex/skills), [Claude Code marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces), and [Claude Code skill documentation](https://code.claude.com/docs/en/skills).

## Visual refinement and final planning artifact

During the interview, use small text diagrams, tables, or Mermaid to clarify dependencies and engineering boundaries. Questions stay in conversation. This guidance adapts [HumanLayer's show-me](https://github.com/humanlayer/skills/tree/main/plugins/show-me) under its [MIT license](plugins/attention-first-engineering/skills/attention-first/references/humanlayer-show-me-license.txt).

The final output can be a standalone HTML planning artifact using the bundled template. It opens with capacity and a dated timeline, with a linked backlog and ticket-detail view. Explore target dates and staffing, inspect dependency constraints, edit names and individual calendars, export CSV, and save the selected scenario as HTML. Everything runs locally in the file, with no server or external dependencies.

Generate the illustrative example with Node.js 22 or newer:

```sh
node plugins/attention-first-engineering/skills/attention-first/scripts/render-plan.mjs \
  plugins/attention-first-engineering/skills/attention-first/assets/example-plan.json \
  /tmp/attention-first-example.html
```

Open that HTML file in a browser. For a real plan, supply the accepted data using the [planning format](plugins/attention-first-engineering/skills/attention-first/references/plan-format.md). Reuse the template instead of regenerating the UI.

Day and Week remain completion windows under the availability agreed during refinement. Scenario calculations do not automatically shorten individual tickets when people are added. They expose staffing, dependency, and calendar constraints, and flag estimates affected by changed availability. Staffing suggestions are a bounded heuristic, not a proof of the smallest possible team or a delivery guarantee. Saving a proposal does not accept it on the user's behalf.

## Evaluate and contribute

[Evaluation scenarios](plugins/attention-first-engineering/skills/attention-first/evals/evals.json) cover interview behavior, sizing and capacity, unresolved product intent despite passing checks, misleading green tests, coherent tickets across PRs, specialist teams, person calendars, and visual handoff. These scenarios have not been run against a live model.

Run the deterministic scheduling and export checks:

```sh
node --test tests/*.test.cjs
```

Validate both plugin manifests and skill frontmatter, check reference links, and verify the generated HTML in a browser. Exercise target changes, staffing, names and capacity, joining/roll-off dates, time off, backlog details, CSV downloads, and saved HTML after reopening. Report those checks separately from live-model interview evaluations.

Keep changes focused in the shared skill and its supporting files. Both host manifests and the Claude marketplace use one release version. Publish updates through GitHub; the blog links here instead of maintaining downloadable skill copies.
