# Show the decision

Adapted from [HumanLayer's show-me](https://github.com/humanlayer/skills/tree/main/plugins/show-me), used under its [MIT license](humanlayer-show-me-license.txt).

Use the smallest visual that helps the user understand the current decision. Keep the explanation beside it and brief. Use available facts; label illustrative data. Visuals assist judgment and do not establish acceptance.

## During the interview

Keep questions in the conversation, one at a time. Use plain-text diagrams and tables in a CLI; Mermaid is useful when the host renders it. Reserve HTML for the final planning artifact. Choose the view for the decision rather than generating every view:

- A small dependency tree to distinguish parallel work from necessary sequencing.
- A before/after diff to show how scope or an accepted decision changes.
- A role-and-person table to distinguish headcount from daily context limits.
- A dated strip to show holidays, availability, and a handoff delay.
- A boundary or data-flow diagram to close an engineer's understanding gap.

```text
One coherent feature, specialist team
Search API [Backend] ──→ Search UI [Frontend]
                           ↑
Ranking [AI engineer] ──────┘
```

The interview must establish whether these dependencies exist. A shared feature or different roles alone does not imply sequential work. For a full-stack team, one ticket may encompass the outcome.

```text
Person          Role          Daily contexts    Available
Engineer 1      AI engineer          2           From Oct 5
Engineer 2      Backend              3           Oct 5 to Nov 6
Reviewer 1      QA                   5           From Oct 26
```

Counts are integers and represent distinct ticket contexts, including tickets completed that day. They are not promised completions. QA work remains separate from engineering completion.

## At handoff

Use the bundled [planning format and renderer](plan-format.md) to create the final standalone HTML. Reuse the template; fill its data instead of rewriting its layout or scheduler. Capacity and timeline open first; backlog and ticket details provide the accepted scope and reasoning. Interview questions do not belong in the artifact.

Open the generated file using the host's file/browser capability. If no HTML renderer is available, deliver the file and a concise text view. A hosted copy is optional when requested; the standalone HTML remains usable without a server, network access, or a separate show-me installation.
