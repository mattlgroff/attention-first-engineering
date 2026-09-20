# Attention-First Engineering

**Build fast without undermining human judgment.**

Matthew Groff's method for refining engineering work and planning human attention when agents do much of the implementation. Start with any material, even a sentence, inside the assistant you already use. Solo use is sufficient; pairing is optional.

Agents can implement, investigate, review, challenge decisions, and prepare evidence. The accountable human still owns product intent, tradeoffs, understanding, and acceptance. Passing checks and generated reviews support that judgment; they cannot establish it.

The method shapes coherent **Day** and **Week** tickets covering complete engineering execution, including code understanding, refinement, testing, human review, and merge. Plan at most three ticket contexts per fully allocated engineer per working day, checking the combined workload and dependencies. Several PRs can deliver one ticket. Three is a starting planning ceiling, not a scientifically established universal limit or productivity quota. QA capacity stays separate.

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

## Evaluate and contribute

[Evaluation scenarios](plugins/attention-first-engineering/skills/attention-first/evals/evals.json) cover interview behavior, sizing and capacity, unresolved product intent despite passing checks, a green test that misses broken behavior, and one outcome delivered through several PRs.

These scenarios have not been run against a live model. Frontmatter, manifest, reference, and installation checks establish package integrity, not interview quality. To evaluate behavior, run a scenario in a fresh session, provide its stated evidence and follow-up answers, and inspect the actual interaction against its expected behavior. Report the host, observed behavior, and verification limits separately from static checks.

Keep changes focused in the shared skill and its supporting files. Update relevant examples and scenarios, validate both plugin manifests, and check referenced paths. Both host manifests and the Claude marketplace use one release version. Publish updates through GitHub; the blog links here instead of maintaining downloadable skill copies.
