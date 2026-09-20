# Interview contract

Use the `/grill-me` behavior in [SKILL.md](../SKILL.md): interview relentlessly toward shared understanding, resolve design dependencies one by one, ask one question at a time, and recommend an answer with its consequence. Check available evidence first and preserve settled answers. End the interview when material branches are resolved or explicitly deferred with their implications.

Use `AskUserQuestion` when available. In Codex, use a permitted `request_user_input` or `request_user_input_async` equivalent. If no question tool is available, ask directly in conversation and wait for the user's reply. For `WebSearch`, use the available web search equivalent, such as `web.run` or `web__run`. A missing search tool does not turn an assumption into inspected evidence.

When using async Q&A, keep the turn open while the answer is pending. If `clock.sleep` is available, call it immediately with `duration_ms: 60000` or a shorter runtime limit. It wakes on user input. On timeout, repeat the wait without commentary or investigation. Do not imitate it with shell sleep or polling.

If async Q&A lacks an interruptible wait, ask directly in conversation so the user can reply on the next turn. While awaiting an answer, do not investigate, edit, or proceed on assumptions. Resume substantive work when the user answers, redirects, cancels, or explicitly defers the decision. A timeout, dismissal, or empty response does not accept the recommendation.
