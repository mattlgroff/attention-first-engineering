(function () {
  'use strict';
  const P = AttentionPlanner,
    $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[c])
    );
  const colors = [
    '#3177ec',
    '#269e95',
    '#8054dd',
    '#ca8531',
    '#aa5797',
    '#587895',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmt = (date, options = {}) =>
    date
      ? new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
          ...options,
        })
      : 'Unscheduled';
  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const payload = JSON.parse($('plan-data').textContent);
  const baseline = P.clone(payload.plan || payload);
  let scenario = P.clone(payload.scenario || baseline),
    result,
    baseResult,
    selected = null,
    suggestion = null,
    dates = [];
  let view = 'capacity';
  const roleColor = (id) =>
    colors[
      Math.max(
        0,
        scenario.roles.findIndex((r) => r.id === id)
      ) % colors.length
    ];
  const rowFor = (id) => result.entries.find((e) => e.id === id);
  const ticketFor = (id) => scenario.tickets.find((t) => t.id === id);
  const roleFor = (id) => scenario.roles.find((r) => r.id === id);
  const button = (label, action, attrs = '') =>
    `<button type="button" data-action="${action}" ${attrs}>${label}</button>`;
  function update(next) {
    try {
      P.validate(next);
      scenario = next;
      suggestion = null;
      render();
    } catch (error) {
      $('targetDate').value = scenario.targetDate;
      $('notice').textContent = error.message;
    }
  }
  function range() {
    const start = scenario.startDate;
    const latest = [scenario.targetDate, result.end || start].sort().at(-1);
    const end = P.addDays(
      latest,
      (7 - new Date(P.parseDate(latest)).getUTCDay()) % 7
    );
    const count =
      Math.round((P.parseDate(end) - P.parseDate(start)) / 86400000) + 1;
    dates = Array.from({ length: Math.min(count, 3660) }, (_, i) =>
      P.addDays(start, i)
    );
  }
  function renderTeam() {
    let out =
      '<h2>Team by role</h2><p class="helper">People and daily context limits</p>';
    for (const kind of ['engineering', 'support']) {
      const roles = scenario.roles.filter((r) => r.kind === kind);
      if (!roles.length) continue;
      if (kind === 'support')
        out +=
          '<div class="team-section"><h3>Other team members</h3><p class="helper">Separate from engineering capacity. Work is scheduled only when included in the backlog.</p></div>';
      for (const role of roles) {
        const old =
          baseline.roles.find((r) => r.id === role.id)?.people.length || 0;
        out += `<div class="role-block" style="--role:${roleColor(
          role.id
        )}"><div class="role-controls"><span class="role-title"><span class="dot"></span>${esc(
          role.name
        )}</span><span class="stepper">${button(
          '−',
          'remove-person',
          `data-role="${esc(role.id)}" aria-label="Remove one ${esc(
            role.name
          )}" ${role.people.length ? '' : 'disabled'}`
        )}<output>${role.people.length}</output>${button(
          '+',
          'add-person',
          `data-role="${esc(role.id)}" aria-label="Add one ${esc(role.name)}"`
        )}</span></div>`;
        if (old !== role.people.length)
          out += `<p class="small muted">Agreed team: ${old}</p>`;
        out += role.people
          .map(
            (p) =>
              `<div class="person-line"><span>${esc(
                p.name
              )}</span><span title="Daily ticket context limit">${
                p.capacity
              } contexts</span></div>${
                p.availableFrom && p.availableFrom > scenario.startDate
                  ? `<div class="small muted">Starts ${fmt(
                      p.availableFrom
                    )}</div>`
                  : ''
              }${
                p.availableUntil
                  ? `<div class="small muted">Through ${fmt(
                      p.availableUntil
                    )}</div>`
                  : ''
              }`
          )
          .join('');
        out += '</div>';
      }
    }
    out += button('Edit team & calendar', 'edit-team', 'class="quiet"');
    $('teamPanel').innerHTML = out;
  }
  function renderTimeline() {
    range();
    const timeline = $('timeline');
    timeline.style.setProperty('--days', dates.length);
    let out =
      '<div class="grid-row week-head"><span class="row-label">Role / person</span>';
    let i = 0;
    while (i < dates.length) {
      let span = 1;
      while (
        i + span < dates.length &&
        new Date(P.parseDate(dates[i + span])).getUTCDay() !== 1
      )
        span++;
      out += `<span class="week" style="grid-column:${
        i + 2
      }/span ${span}">${fmt(dates[i])} - ${fmt(dates[i + span - 1])}</span>`;
      i += span;
    }
    out += '</div>';
    const bound = P.dependencyBound(scenario);
    for (const role of scenario.roles) {
      const roleRows = result.entries.filter(
        (e) => e.end && ticketFor(e.id).roleId === role.id
      );
      if (!roleRows.length) continue;
      out += `<div class="role-heading" style="--role:${roleColor(
        role.id
      )}"><span class="dot"></span> ${esc(role.name)}${
        role.kind === 'support'
          ? ' <span class="small muted">Separate support work</span>'
          : ''
      }</div>`;
      for (const person of role.people) {
        const rows = roleRows
          .filter((e) => e.personId === person.id)
          .sort((a, b) => a.start.localeCompare(b.start));
        if (!rows.length) continue;
        const lanes = [];
        const bars = rows.map((e) => {
          let lane = lanes.findIndex((end) => end < e.start);
          if (lane < 0) {
            lane = lanes.length;
            lanes.push(e.end);
          } else lanes[lane] = e.end;
          return { e, lane };
        });
        out += `<div class="grid-row person-row" style="--lanes:${
          lanes.length
        };--height:${Math.max(
          40,
          lanes.length * 37
        )}px;grid-template-rows:repeat(${
          lanes.length
        },37px)"><div class="person-label">${esc(
          person.name
        )}<br><span class="small">${
          person.capacity
        } daily contexts</span></div>`;
        for (const { e, lane } of bars) {
          const t = ticketFor(e.id),
            start = dates.indexOf(e.start),
            end = dates.indexOf(e.end);
          if (start < 0 || end < 0) continue;
          out += `<button type="button" class="bar ${
            bound.chain.includes(e.id) ? 'critical' : ''
          }" style="--role:${roleColor(role.id)};grid-column:${
            start + 2
          }/span ${end - start + 1};grid-row:${lane + 1}" data-ticket="${esc(
            e.id
          )}" title="${esc(
            `${e.id}: ${t.title} | ${t.size} | ${person.name} | ${fmt(
              e.start
            )} to ${fmt(e.end)}`
          )}"><strong>${esc(e.id)}</strong>${esc(t.title)} · ${esc(
            t.size
          )}</button>`;
        }
        out += '</div>';
      }
    }
    if (!result.entries.some((e) => e.end))
      out +=
        '<div class="empty">No tickets can be placed yet. Review unresolved estimates and team availability.</div>';
    out +=
      '<svg class="dependencies" id="dependencyLines" aria-hidden="true"></svg><div class="target-line" id="targetLine"><span>Target ' +
      fmt(scenario.targetDate) +
      '</span></div>';
    timeline.innerHTML = out;
    $('calendarNote').textContent = `${
      (scenario.calendar.holidays || []).length
    } shared holidays`;
    let heat =
      '<div class="heat-grid" style="--days:' +
      dates.length +
      '"><div class="heat-label">Person / limit</div>';
    for (const d of dates)
      heat += `<div class="heat-cell heat-date" title="${d}">${new Date(
        P.parseDate(d)
      ).getUTCDate()}</div>`;
    for (const role of scenario.roles)
      for (const person of role.people) {
        if (
          role.kind === 'support' &&
          !scenario.tickets.some((t) => t.roleId === role.id)
        )
          continue;
        heat += `<div class="heat-label">${esc(
          person.name
        )} <span class="muted">/ ${person.capacity}</span></div>`;
        for (const d of dates) {
          const count = result.usage[person.id]?.[d] || 0,
            on = P.available(d, person, scenario.calendar);
          heat += `<div class="heat-cell ${on ? '' : 'heat-off'}" ${
            on
              ? `style="background:rgba(111,77,225,${
                  count
                    ? Math.min(0.08 + (count / person.capacity) * 0.14, 0.3)
                    : 0.02
                })"`
              : ''
          } title="${esc(person.name)}: ${d}, ${
            on ? count + ' of ' + person.capacity + ' contexts' : 'unavailable'
          }">${on ? count : '·'}</div>`;
        }
      }
    $('heatmap').innerHTML = heat + '</div>';
    requestAnimationFrame(drawDependencies);
  }
  function drawDependencies() {
    const timeline = $('timeline'),
      svg = $('dependencyLines');
    if (!svg) return;
    const box = timeline.getBoundingClientRect(),
      w = timeline.scrollWidth,
      h = timeline.scrollHeight;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const bars = new Map(
      [...timeline.querySelectorAll('[data-ticket]')].map((el) => [
        el.dataset.ticket,
        el,
      ])
    );
    let paths =
      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#8d95aa"/></marker></defs>';
    if ($('showDependencies').checked)
      for (const t of scenario.tickets)
        for (const dep of t.dependsOn) {
          if (!bars.has(t.id) || !bars.has(dep)) continue;
          const from = bars.get(dep).getBoundingClientRect(),
            to = bars.get(t.id).getBoundingClientRect();
          const x1 = from.right - box.left,
            y1 = from.top - box.top + from.height / 2,
            x2 = to.left - box.left,
            y2 = to.top - box.top + to.height / 2,
            mid = (x1 + x2) / 2;
          paths += `<path d="M${x1} ${y1} C${mid} ${y1},${mid} ${y2},${x2} ${y2}" fill="none" stroke="#9fa7bb" stroke-width="1.15" marker-end="url(#arrow)"/>`;
        }
    svg.innerHTML = paths;
    const idx = dates.indexOf(scenario.targetDate);
    $('targetLine').style.left = `${
      165 + ((idx + 1) * (w - 165)) / dates.length
    }px`;
    $('targetLine').hidden = idx < 0;
  }
  function renderInsights() {
    const bound = P.dependencyBound(scenario),
      misses = bound.end && bound.end > scenario.targetDate;
    let out = '<h2>What changes</h2>';
    const changes = scenario.roles.filter(
      (r) =>
        r.people.length !==
        (baseline.roles.find((b) => b.id === r.id)?.people.length || 0)
    );
    out += changes.length
      ? '<h3>Staffing changes</h3>'
      : '<p class="helper">Same headcount as the agreed plan.</p>';
    for (const role of changes)
      out += `<div class="delta"><span class="role-cell" style="--role:${roleColor(
        role.id
      )}"><span class="dot"></span>${esc(role.name)}</span><strong>${
        baseline.roles.find((r) => r.id === role.id)?.people.length || 0
      } → ${role.people.length}</strong></div>`;
    if (misses)
      out += `<div class="callout"><h3>Dependencies exceed the target</h3><p>This chain reaches ${fmt(
        bound.end
      )} even without staffing limits, under the agreed size windows. More people alone cannot reach ${fmt(
        scenario.targetDate
      )}.</p></div>`;
    else if (result.problems.length)
      out +=
        '<div class="callout"><h3>Some work is not scheduled</h3><p>Resolve the issues shown above before treating this as a complete plan.</p></div>';
    else if (!result.fits)
      out += `<div class="callout"><h3>Review capacity and calendars</h3><p>The proposed schedule ends ${fmt(
        result.end
      )}. Dependencies alone do not prove the target impossible.</p></div>`;
    else
      out +=
        '<div class="callout" style="background:#f5f2ff;border-color:#e4dcfb;color:#503686"><h3>Fits under these assumptions</h3><p>Review the concurrent workload and estimates before accepting the proposed plan.</p></div>';
    out += '<h3>Longest dependency chain</h3><ol class="chain">';
    for (const id of bound.chain)
      out += `<li>${button(
        `<strong>${esc(id)}</strong> ${esc(ticketFor(id).title)}`,
        'open-ticket',
        `data-id="${esc(id)}"`
      )}</li>`;
    out += '</ol>';
    if (!misses)
      out += button(
        'Find a team for this target',
        'suggest-team',
        'class="primary"'
      );
    if (suggestion) {
      out += `<p class="helper">${esc(suggestion.reason)}</p>`;
      if (suggestion.plan && suggestion.additions) {
        out += suggestion.plan.roles
          .filter((r, i) => r.people.length !== scenario.roles[i].people.length)
          .map(
            (r, i) =>
              `<p class="small">${esc(r.name)}: ${
                scenario.roles.find((s) => s.id === r.id).people.length
              } → ${r.people.length}</p>`
          )
          .join('');
        out += button('Try this team', 'apply-suggestion', 'class="primary"');
      }
    }
    if (result.engineeringEnd && result.end !== result.engineeringEnd)
      out += `<hr class="divider"><p class="small">Engineering finishes <strong>${fmt(
        result.engineeringEnd
      )}</strong>. Included support work finishes <strong>${fmt(
        result.end
      )}</strong>.</p>`;
    out +=
      '<hr class="divider"><h3>Planning assumptions</h3><ul class="notes"><li>Day uses one project working day; Week uses five. Sizes assume the working pattern agreed during refinement.</li><li>Each ticket belongs to one person in its responsible role.</li><li>Context limits do not establish feasible combined workload.</li><li>New people are assumed available from the project start unless edited.</li></ul>';
    if (scenario.assumptions?.length)
      out +=
        '<ul class="notes">' +
        scenario.assumptions.map((a) => `<li>${esc(a)}</li>`).join('') +
        '</ul>';
    out +=
      '<p class="helper">This is a scheduling heuristic, not a minimum-staffing proof. Scope and acceptance stay unchanged.</p>' +
      button('Reset to agreed plan', 'reset', 'class="quiet"');
    $('insights').innerHTML = out;
  }
  function filterOptions() {
    const oldRole = $('roleFilter').value,
      oldFeature = $('featureFilter').value;
    $('roleFilter').innerHTML =
      '<option value="">Role: All</option>' +
      scenario.roles
        .map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`)
        .join('');
    $('featureFilter').innerHTML =
      '<option value="">Feature: All</option>' +
      [...new Set(scenario.tickets.map((t) => t.feature || 'Ungrouped'))]
        .map((f) => `<option value="${esc(f)}">${esc(f)}</option>`)
        .join('');
    $('roleFilter').value = oldRole;
    $('featureFilter').value = oldFeature;
  }
  function renderBacklog() {
    const query = $('search').value.toLowerCase(),
      role = $('roleFilter').value,
      feature = $('featureFilter').value;
    const tickets = scenario.tickets.filter(
      (t) =>
        (!role || t.roleId === role) &&
        (!feature || (t.feature || 'Ungrouped') === feature) &&
        `${t.id} ${t.title} ${t.outcome || ''}`.toLowerCase().includes(query)
    );
    $(
      'ticketCount'
    ).textContent = `${tickets.length} of ${scenario.tickets.length} tickets`;
    let out =
      '<table><thead><tr><th>Ticket</th><th>Role</th><th>Size</th><th>Depends on</th><th>Planned</th></tr></thead><tbody>';
    for (const group of [
      ...new Set(tickets.map((t) => t.feature || 'Ungrouped')),
    ]) {
      const rows = tickets.filter((t) => (t.feature || 'Ungrouped') === group);
      out += `<tr class="feature"><td colspan="5">${esc(
        group
      )} <span class="muted small">${rows.length} tickets</span></td></tr>`;
      for (const t of rows) {
        const e = rowFor(t.id),
          r = roleFor(t.roleId);
        out += `<tr class="${
          selected === t.id ? 'selected' : ''
        }"><td><button class="ticket-open" data-ticket="${esc(
          t.id
        )}"><span class="ticket-id">${esc(t.id)}</span>${esc(
          t.title
        )}</button></td><td><span class="role-cell" style="--role:${roleColor(
          r.id
        )}"><span class="dot"></span>${esc(
          r.name
        )}</span></td><td><span class="size">${esc(
          t.size || 'Unsized'
        )}</span></td><td>${esc(t.dependsOn.join(', ') || 'None')}</td><td>${
          e.end ? esc(fmt(e.start) + ' - ' + fmt(e.end)) : esc(e.reason)
        }</td></tr>`;
      }
    }
    $('backlogTable').innerHTML = tickets.length
      ? out + '</tbody></table>'
      : '<div class="empty">No tickets match these filters.</div>';
    renderDetail();
  }
  function renderDetail() {
    const t = ticketFor(selected);
    $('ticketDetail').hidden = !t;
    $('backlogView').classList.toggle('has-detail', !!t);
    if (!t) return;
    const e = rowFor(t.id),
      r = roleFor(t.roleId);
    let out = `<div class="detail-top"><span class="ticket-id">${esc(
      t.id
    )}</span>${button(
      '×',
      'close-ticket',
      'aria-label="Close ticket details"'
    )}</div><h2>${esc(t.title)}</h2><p class="muted">${esc(
      t.feature || ''
    )}</p><dl class="properties"><dt>Responsible role</dt><dd>${esc(
      r.name
    )}</dd><dt>Person</dt><dd>${esc(
      e.personName || 'Unassigned'
    )}</dd><dt>Size</dt><dd>${esc(
      t.size || 'Unsized'
    )}</dd><dt>Depends on</dt><dd>${esc(
      t.dependsOn.join(', ') || 'None'
    )}</dd><dt>Planned</dt><dd>${
      e.end ? esc(fmt(e.start) + ' - ' + fmt(e.end)) : esc(e.reason)
    }</dd></dl>`;
    for (const [title, value] of [
      ['Size rationale', t.sizeRationale],
      ['Outcome', t.outcome],
      ['Accepted scope', t.scope],
      ['Acceptance', t.acceptance],
      ['Verification', t.verification],
      ['Understand before completion', t.understanding],
      ['Decisions to preserve', t.decisions],
      ['Risks and open questions', t.risks],
    ]) {
      if (!list(value).length) continue;
      out += `<section class="detail-section"><h3>${title}</h3>${
        Array.isArray(value)
          ? '<ul>' + value.map((v) => `<li>${esc(v)}</li>`).join('') + '</ul>'
          : `<p>${esc(value)}</p>`
      }</section>`;
    }
    if (t.sourceUrl && /^https?:\/\//.test(t.sourceUrl))
      out += `<div class="detail-section"><a href="${esc(
        t.sourceUrl
      )}" target="_blank" rel="noopener noreferrer">View source</a></div>`;
    $('ticketDetail').innerHTML = out;
  }
  function switchView(next) {
    view = next;
    $('capacityView').hidden = next !== 'capacity';
    $('backlogView').hidden = next !== 'backlog';
    $('capacityTab').setAttribute('aria-selected', next === 'capacity');
    $('backlogTab').setAttribute('aria-selected', next === 'backlog');
    $('pageTitle').textContent =
      next === 'capacity' ? 'Capacity & timeline' : 'Backlog';
    $('pageSubtitle').textContent =
      next === 'capacity'
        ? 'Explore the team and sequencing needed for this scope.'
        : 'The engineering outcomes behind this plan.';
    if (next === 'capacity') requestAnimationFrame(drawDependencies);
    else renderBacklog();
  }
  function render() {
    result = P.schedule(scenario);
    baseResult = P.schedule(baseline);
    document.title = `${scenario.title} | Attention-First Engineering`;
    $('projectCrumb').textContent = scenario.title;
    $('planBadge').textContent = scenario.illustrative
      ? 'Illustrative plan'
      : 'Planning artifact';
    $('baselineFinish').textContent = fmt(baseResult.end);
    $('proposedFinish').textContent = fmt(result.end);
    $('targetDate').value = scenario.targetDate;
    const reviews = [
      ...result.review,
      ...P.calendarReviews(baseline, scenario),
    ];
    const issues = [...result.problems, ...reviews];
    $('notice').innerHTML = issues.length
      ? '<strong>Needs review</strong><ul>' +
        issues.map((s) => `<li>${esc(s)}</li>`).join('') +
        '</ul>'
      : '';
    $('scenarioStatus').textContent = result.problems.length
      ? 'Incomplete scope'
      : reviews.length
      ? 'Review estimates'
      : result.fits
      ? 'Fits assumptions'
      : 'Target not met';
    $('scenarioStatus').classList.toggle(
      'amber',
      !result.fits || reviews.length > 0
    );
    renderTeam();
    renderTimeline();
    renderInsights();
    filterOptions();
    renderBacklog();
    if (view === 'capacity') $('backlogView').hidden = true;
  }
  function daysInput(name, values) {
    return (
      '<div class="days">' +
      dayNames
        .map(
          (d, i) =>
            `<label><input type="checkbox" name="${esc(name)}" value="${i}" ${
              values.includes(i) ? 'checked' : ''
            }>${d}</label>`
        )
        .join('') +
      '</div>'
    );
  }
  function openTeam() {
    let out = `<p class="helper">Names are optional. Role-based placeholders work until the team is known. Capacity is an integer number of daily ticket contexts.</p><div class="calendar-fields"><label class="field"><span>Project start</span><input type="date" name="projectStart" required value="${
      scenario.startDate
    }"></label><div class="field"><span>Project working days</span>${daysInput(
      'projectDays',
      scenario.calendar.workingDays || [1, 2, 3, 4, 5]
    )}</div><label class="field"><span>Shared holidays</span><textarea name="holidays" placeholder="YYYY-MM-DD, one per line">${esc(
      (scenario.calendar.holidays || []).join('\n')
    )}</textarea></label><p class="helper">A Day/Week estimate assumes the person's working pattern at refinement. Changed availability may require re-sizing. A person must not be duplicated under another role.</p></div>`;
    let index = 0;
    for (const role of scenario.roles) {
      out += `<hr class="divider"><h3>${esc(role.name)} <span class="muted">${
        role.kind === 'engineering' ? 'Engineering' : 'Separate support role'
      }</span></h3>`;
      for (const p of role.people) {
        const prefix = `p${index++}`;
        out += `<div class="person-edit"><label class="field"><span>Name</span><input name="${prefix}Name" value="${esc(
          p.name
        )}" required></label><label class="field"><span>Daily capacity</span><input name="${prefix}Capacity" type="number" min="1" step="1" required value="${
          p.capacity
        }"></label><div class="field"><span>Working days</span>${daysInput(
          prefix + 'Days',
          p.workingDays || scenario.calendar.workingDays || [1, 2, 3, 4, 5]
        )}</div><div class="exceptions"><label class="field"><span>Starts (blank means project start)</span><input type="date" name="${prefix}From" value="${
          p.availableFrom || ''
        }"></label><label class="field"><span>Rolls off after (optional)</span><input type="date" name="${prefix}Until" value="${
          p.availableUntil || ''
        }"></label><label class="field"><span>Vacation / time off ranges</span><textarea name="${prefix}Ranges" placeholder="2026-07-06 to 2026-07-17">${esc(
          (p.timeOff || []).map((r) => r.start + ' to ' + r.end).join('\n')
        )}</textarea></label><label class="field"><span>Additional days off</span><textarea name="${prefix}Off" placeholder="YYYY-MM-DD, one per line">${esc(
          (p.daysOff || []).join('\n')
        )}</textarea></label></div></div>`;
      }
    }
    $('teamEditor').innerHTML = out;
    $('teamError').textContent = '';
    $('teamDialog').showModal();
  }
  function saveTeam(event) {
    event.preventDefault();
    const f = new FormData($('teamForm')),
      next = P.clone(scenario),
      split = (v) =>
        String(v || '')
          .split(/[\s,]+/)
          .filter(Boolean);
    next.startDate = f.get('projectStart');
    next.calendar.workingDays = f.getAll('projectDays').map(Number);
    next.calendar.holidays = split(f.get('holidays'));
    let index = 0;
    try {
      for (const role of next.roles)
        for (const p of role.people) {
          const prefix = `p${index++}`;
          p.name = String(f.get(prefix + 'Name')).trim();
          p.capacity = Number(f.get(prefix + 'Capacity'));
          p.workingDays = f.getAll(prefix + 'Days').map(Number);
          p.daysOff = split(f.get(prefix + 'Off'));
          p.availableFrom = f.get(prefix + 'From') || undefined;
          p.availableUntil = f.get(prefix + 'Until') || undefined;
          p.timeOff = String(f.get(prefix + 'Ranges') || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((line) => {
              const match = line.match(
                /^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/
              );
              if (!match)
                throw new Error(
                  'Use YYYY-MM-DD to YYYY-MM-DD for each vacation range.'
                );
              return { start: match[1], end: match[2] };
            });
        }
      P.validate(next);
      update(next);
      $('teamDialog').close();
    } catch (error) {
      $('teamError').textContent = error.message;
    }
  }
  function download(content, name, type) {
    const blob = new Blob([content], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function saveHtml() {
    const copy = document.documentElement.cloneNode(true),
      data = JSON.stringify({ plan: baseline, scenario }, null, 2)
        .replaceAll('<', '\\u003c')
        .replaceAll('&', '\\u0026')
        .replaceAll('\u2028', '\\u2028')
        .replaceAll('\u2029', '\\u2029');
    copy.querySelector('#plan-data').textContent = data;
    copy
      .querySelectorAll('dialog[open]')
      .forEach((d) => d.removeAttribute('open'));
    download(
      '<!doctype html>\n' + copy.outerHTML,
      'attention-first-plan.html',
      'text/html;charset=utf-8'
    );
  }
  document.addEventListener('click', (event) => {
    const ticketButton = event.target.closest('[data-ticket]');
    if (ticketButton) {
      selected = ticketButton.dataset.ticket;
      switchView('backlog');
      return;
    }
    const b = event.target.closest('[data-action]');
    if (!b) return;
    const action = b.dataset.action;
    if (action === 'edit-team') openTeam();
    if (action === 'add-person') {
      const next = P.clone(scenario);
      P.addPerson(next, b.dataset.role);
      update(next);
    }
    if (action === 'remove-person') {
      const next = P.clone(scenario);
      next.roles.find((r) => r.id === b.dataset.role).people.pop();
      update(next);
    }
    if (action === 'open-ticket') {
      selected = b.dataset.id;
      switchView('backlog');
    }
    if (action === 'close-ticket') {
      selected = null;
      renderBacklog();
    }
    if (action === 'reset') update(P.clone(baseline));
    if (action === 'suggest-team') {
      b.disabled = true;
      suggestion = P.suggestTeam(scenario);
      renderInsights();
    }
    if (action === 'apply-suggestion' && suggestion?.plan)
      update(P.clone(suggestion.plan));
  });
  $('capacityTab').addEventListener('click', () => switchView('capacity'));
  $('backlogTab').addEventListener('click', () => switchView('backlog'));
  $('targetDate').addEventListener('change', () => {
    const next = P.clone(scenario);
    next.targetDate = $('targetDate').value;
    update(next);
  });
  $('showDependencies').addEventListener('change', drawDependencies);
  ['search', 'roleFilter', 'featureFilter'].forEach((id) =>
    $(id).addEventListener('input', renderBacklog)
  );
  $('closeTeam').addEventListener('click', () => $('teamDialog').close());
  $('cancelTeam').addEventListener('click', () => $('teamDialog').close());
  $('teamForm').addEventListener('submit', saveTeam);
  $('exportCsv').addEventListener('click', () =>
    download(
      P.csv(scenario, result),
      'attention-first-backlog.csv',
      'text/csv;charset=utf-8'
    )
  );
  $('saveHtml').addEventListener('click', saveHtml);
  window.addEventListener('resize', drawDependencies);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selected) {
      selected = null;
      renderBacklog();
    }
  });
  try {
    P.validate(baseline);
    render();
    switchView('capacity');
  } catch (error) {
    $('notice').textContent = 'Cannot render plan: ' + error.message;
    ['exportCsv', 'saveHtml', 'targetDate'].forEach(
      (id) => ($(id).disabled = true)
    );
  }
})();
