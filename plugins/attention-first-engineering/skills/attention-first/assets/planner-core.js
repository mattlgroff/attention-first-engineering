/* Attention-First Engineering: deterministic scenario calculations, no dependencies. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const parseDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new Error(`Invalid date: ${value}`);
    const time = Date.parse(`${value}T00:00:00Z`);
    if (
      !Number.isFinite(time) ||
      new Date(time).toISOString().slice(0, 10) !== value
    )
      throw new Error(`Invalid date: ${value}`);
    return time;
  };
  const iso = (time) => new Date(time).toISOString().slice(0, 10);
  const addDays = (date, n) => iso(parseDate(date) + n * DAY);
  const weekdays = [1, 2, 3, 4, 5];
  const working = (date, calendar) =>
    (calendar.workingDays || weekdays).includes(
      new Date(parseDate(date)).getUTCDay()
    ) && !(calendar.holidays || []).includes(date);
  const available = (date, person, calendar) =>
    working(date, calendar) &&
    (person.workingDays || calendar.workingDays || weekdays).includes(
      new Date(parseDate(date)).getUTCDay()
    ) &&
    !(person.daysOff || []).includes(date) &&
    !(person.timeOff || []).some(
      (range) => date >= range.start && date <= range.end
    ) &&
    (!person.availableFrom || date >= person.availableFrom) &&
    (!person.availableUntil || date <= person.availableUntil);
  function nextDay(date, predicate) {
    for (let i = 0; i < 3660; i++, date = addDays(date, 1))
      if (predicate(date)) return date;
    return null;
  }
  function windowDays(start, duration, calendar) {
    const days = [];
    for (
      let date = start, i = 0;
      days.length < duration && i < 3660;
      date = addDays(date, 1), i++
    )
      if (working(date, calendar)) days.push(date);
    return days;
  }
  function checkDays(days, label) {
    if (
      !Array.isArray(days) ||
      days.length === 0 ||
      new Set(days).size !== days.length ||
      days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
    )
      throw new Error(
        `${label} needs distinct working days from 0 (Sunday) to 6 (Saturday).`
      );
  }
  function validate(plan) {
    if (!plan || typeof plan.title !== 'string' || !plan.title.trim())
      throw new Error('A project title is required.');
    parseDate(plan.startDate);
    parseDate(plan.targetDate);
    if (plan.targetDate < plan.startDate)
      throw new Error('Target date must be on or after the start date.');
    if (
      !plan.calendar ||
      !Array.isArray(plan.roles) ||
      !Array.isArray(plan.tickets)
    )
      throw new Error('Calendar, roles, and tickets are required.');
    checkDays(plan.calendar.workingDays || weekdays, 'Project calendar');
    (plan.calendar.holidays || []).forEach(parseDate);
    const roleIds = new Set(),
      personIds = new Set(),
      personNames = new Set(),
      ticketIds = new Set();
    for (const role of plan.roles) {
      if (
        !role.id ||
        roleIds.has(role.id) ||
        !role.name ||
        !['engineering', 'support'].includes(role.kind)
      )
        throw new Error(
          'Each role needs a unique id, name, and engineering/support kind.'
        );
      roleIds.add(role.id);
      if (
        !Number.isInteger(role.defaultCapacity ?? 3) ||
        (role.defaultCapacity ?? 3) < 1
      )
        throw new Error(`${role.name}: capacity must be a positive integer.`);
      if (!Array.isArray(role.people))
        throw new Error(`${role.name}: people must be an array.`);
      for (const person of role.people) {
        if (
          !person.id ||
          personIds.has(person.id) ||
          typeof person.name !== 'string'
        )
          throw new Error('People need unique ids and names.');
        personIds.add(person.id);
        const personName = person.name.trim().toLocaleLowerCase();
        if (!personName || personNames.has(personName))
          throw new Error(
            'Each person belongs to one role. Use distinct names or placeholders and do not duplicate a person.'
          );
        personNames.add(personName);
        if (!Number.isInteger(person.capacity) || person.capacity < 1)
          throw new Error(
            `${person.name}: capacity must be a positive integer.`
          );
        checkDays(
          person.workingDays || plan.calendar.workingDays || weekdays,
          person.name
        );
        (person.daysOff || []).forEach(parseDate);
        if (person.availableFrom) parseDate(person.availableFrom);
        if (person.availableUntil) parseDate(person.availableUntil);
        if (
          person.availableFrom &&
          person.availableUntil &&
          person.availableUntil < person.availableFrom
        )
          throw new Error(`${person.name}: roll-off date precedes start date.`);
        for (const range of person.timeOff || []) {
          parseDate(range.start);
          parseDate(range.end);
          if (range.end < range.start)
            throw new Error(`${person.name}: time off ends before it starts.`);
        }
      }
    }
    for (const ticket of plan.tickets) {
      if (!ticket.id || ticketIds.has(ticket.id) || !ticket.title)
        throw new Error('Tickets need unique ids and titles.');
      ticketIds.add(ticket.id);
      if (!roleIds.has(ticket.roleId))
        throw new Error(`${ticket.id}: responsible role is missing.`);
      if (!['Day', 'Week', null].includes(ticket.size))
        throw new Error(
          `${ticket.id}: size must be Day, Week, or null while unresolved.`
        );
      if (!Array.isArray(ticket.dependsOn))
        throw new Error(`${ticket.id}: dependsOn must be an array.`);
      if (ticket.earliestStart) parseDate(ticket.earliestStart);
    }
    for (const ticket of plan.tickets)
      for (const dep of ticket.dependsOn)
        if (!ticketIds.has(dep) || dep === ticket.id)
          throw new Error(`${ticket.id}: invalid dependency ${dep}.`);
    const byId = new Map(plan.tickets.map((t) => [t.id, t])),
      seen = new Set(),
      active = new Set(),
      order = [];
    function visit(id) {
      if (active.has(id)) throw new Error(`Dependency cycle at ${id}.`);
      if (seen.has(id)) return;
      active.add(id);
      byId.get(id).dependsOn.forEach(visit);
      active.delete(id);
      seen.add(id);
      order.push(byId.get(id));
    }
    plan.tickets.forEach((t) => visit(t.id));
    return order;
  }
  const duration = (ticket) => (ticket.size === 'Day' ? 1 : 5);
  function schedule(plan) {
    const order = validate(plan),
      roles = new Map(plan.roles.map((r) => [r.id, r]));
    const entries = [],
      byId = new Map(),
      usage = {},
      problems = [];
    const horizon = addDays(plan.startDate, 3660);
    // Stable input order breaks ties. This is a feasible scheduling heuristic, not an optimizer.
    for (const ticket of order) {
      const role = roles.get(ticket.roleId);
      const missing = ticket.dependsOn.filter((id) => !byId.get(id)?.end);
      if (!ticket.size || missing.length || !role.people.length) {
        const reason = !ticket.size
          ? 'Needs a Day/Week estimate'
          : missing.length
          ? `Waiting for unscheduled ${missing.join(', ')}`
          : `No ${role.name} assigned`;
        const row = {
          id: ticket.id,
          reason,
          start: null,
          end: null,
          activeDays: [],
        };
        entries.push(row);
        byId.set(ticket.id, row);
        problems.push(`${ticket.id}: ${reason}`);
        continue;
      }
      let release = [
        plan.startDate,
        ticket.earliestStart || plan.startDate,
        ...ticket.dependsOn.map((id) => addDays(byId.get(id).end, 1)),
      ]
        .sort()
        .at(-1);
      let best = null;
      for (const person of role.people) {
        const personUsage = usage[person.id] || {};
        let date = nextDay(release, (d) => available(d, person, plan.calendar));
        for (
          let tries = 0;
          date && date < horizon && tries < 3660;
          tries++,
            date = nextDay(addDays(date, 1), (d) =>
              available(d, person, plan.calendar)
            )
        ) {
          const span = windowDays(date, duration(ticket), plan.calendar);
          if (span.length !== duration(ticket)) break;
          const plannedEnd = span.at(-1);
          // Human completion must land on a day the assigned person is available.
          const end = nextDay(plannedEnd, (d) =>
            available(d, person, plan.calendar)
          );
          if (!end || end >= horizon) break;
          const activeDays = [];
          for (let d = date; d <= end; d = addDays(d, 1))
            if (available(d, person, plan.calendar)) activeDays.push(d);
          if (
            activeDays.every((d) => (personUsage[d] || 0) < person.capacity)
          ) {
            const candidate = {
              id: ticket.id,
              personId: person.id,
              personName: person.name,
              start: date,
              end,
              activeDays,
              windowExtended: end > plannedEnd,
            };
            if (
              !best ||
              candidate.end < best.end ||
              (candidate.end === best.end &&
                (Number(candidate.windowExtended) <
                  Number(best.windowExtended) ||
                  (candidate.windowExtended === best.windowExtended &&
                    candidate.start < best.start)))
            )
              best = candidate;
            break;
          }
        }
      }
      if (!best) {
        best = {
          id: ticket.id,
          start: null,
          end: null,
          activeDays: [],
          reason:
            'No placement fits the assigned team’s working calendars and start/roll-off dates within the 10-year search horizon',
        };
        problems.push(`${ticket.id}: ${best.reason}`);
      } else {
        usage[best.personId] ||= {};
        best.activeDays.forEach(
          (d) => (usage[best.personId][d] = (usage[best.personId][d] || 0) + 1)
        );
      }
      entries.push(best);
      byId.set(ticket.id, best);
    }
    const endFor = (kind) =>
      entries
        .filter(
          (e) =>
            e.end &&
            (!kind ||
              roles.get(plan.tickets.find((t) => t.id === e.id).roleId).kind ===
                kind)
        )
        .map((e) => e.end)
        .sort()
        .at(-1) || null;
    const end = endFor(),
      engineeringEnd = endFor('engineering');
    const extended = entries
      .filter((e) => e.windowExtended)
      .map(
        (e) =>
          `${e.id}: calendar extends its ${
            plan.tickets.find((t) => t.id === e.id).size
          } window; review the estimate`
      );
    return {
      entries,
      usage,
      end,
      engineeringEnd,
      problems,
      review: extended,
      fits:
        !!end && end <= plan.targetDate && !problems.length && !extended.length,
    };
  }
  function dependencyBound(plan) {
    const order = validate(plan),
      dates = new Map();
    for (const ticket of order) {
      if (!ticket.size || ticket.dependsOn.some((id) => !dates.has(id)))
        continue;
      const latestDep = ticket.dependsOn
        .map((id) => dates.get(id))
        .sort((a, b) => a.end.localeCompare(b.end))
        .at(-1);
      const release = [
        plan.startDate,
        ticket.earliestStart || plan.startDate,
        latestDep ? addDays(latestDep.end, 1) : plan.startDate,
      ]
        .sort()
        .at(-1);
      const days = windowDays(release, duration(ticket), plan.calendar);
      dates.set(ticket.id, {
        end: days.at(-1),
        chain: [...(latestDep?.chain || []), ticket.id],
      });
    }
    return (
      [...dates.values()].sort((a, b) => a.end.localeCompare(b.end)).at(-1) || {
        end: null,
        chain: [],
      }
    );
  }
  function addPerson(plan, roleId) {
    const role = plan.roles.find((r) => r.id === roleId);
    let i = role.people.length + 1;
    const ids = new Set(plan.roles.flatMap((r) => r.people.map((p) => p.id)));
    const names = new Set(
      plan.roles.flatMap((r) =>
        r.people.map((p) => p.name.trim().toLocaleLowerCase())
      )
    );
    while (
      ids.has(`${role.id}-${i}`) ||
      names.has(`${role.name} ${i}`.toLocaleLowerCase())
    )
      i++;
    const p = {
      id: `${role.id}-${i}`,
      name: `${role.name} ${i}`,
      capacity: role.defaultCapacity ?? 3,
      workingDays: [...(plan.calendar.workingDays || weekdays)],
      daysOff: [],
    };
    role.people.push(p);
    return p;
  }
  const placementCost = (result) =>
    result.problems.length * 1e12 +
    (result.end ? parseDate(result.end) : 9e14) +
    result.review.length;
  function suggestTeam(plan) {
    const bound = dependencyBound(plan);
    if (bound.end > plan.targetDate)
      return {
        plan: null,
        reason: 'Dependencies exceed the target even before staffing limits.',
        bound,
      };
    let candidate = clone(plan),
      result = schedule(candidate),
      additions = 0;
    if (result.fits)
      return {
        plan: candidate,
        result,
        additions,
        reason:
          'The current scenario already fits the target under its assumptions.',
        bound,
      };
    if (plan.tickets.some((t) => !t.size))
      return {
        plan: null,
        reason: 'Resolve unsized tickets before calculating a team.',
        bound,
      };
    const usedRoles = plan.roles.filter((r) =>
      plan.tickets.some((t) => t.roleId === r.id)
    );
    // Bounded search; ties use backlog order. Never claim the team is the minimum.
    for (let i = 0; i < 24; i++) {
      let choice = null;
      for (const role of usedRoles) {
        const next = clone(candidate);
        addPerson(next, role.id);
        const nextResult = schedule(next);
        const value = placementCost(nextResult);
        if (!choice || value < choice.value)
          choice = { plan: next, result: nextResult, value };
      }
      if (!choice) break;
      const currentValue = placementCost(result);
      if (choice.value >= currentValue) {
        const combined = clone(candidate);
        usedRoles.forEach((role) => addPerson(combined, role.id));
        const combinedResult = schedule(combined);
        const combinedValue = placementCost(combinedResult);
        if (combinedValue >= currentValue) break;
        choice = {
          plan: combined,
          result: combinedResult,
          value: combinedValue,
        };
        additions += usedRoles.length - 1;
      }
      candidate = choice.plan;
      result = choice.result;
      additions++;
      if (result.fits)
        return {
          plan: candidate,
          result,
          additions,
          reason:
            'Suggested team under the current estimates and calendars; review the combined workload.',
          bound,
        };
    }
    return {
      plan: null,
      reason:
        'No fitting team found by this bounded heuristic. Review the schedule and assumptions; this does not prove impossibility.',
      bound,
    };
  }
  function calendarReviews(baseline, scenario) {
    const notes = [];
    if (
      JSON.stringify(baseline.calendar.workingDays) !==
      JSON.stringify(scenario.calendar.workingDays)
    )
      notes.push('Project working pattern changed; review Day/Week estimates.');
    for (const role of scenario.roles)
      for (const person of role.people) {
        const prior = baseline.roles
          .flatMap((r) => r.people)
          .find((p) => p.id === person.id);
        if (
          prior &&
          (JSON.stringify(
            prior.workingDays || baseline.calendar.workingDays
          ) !==
            JSON.stringify(
              person.workingDays || scenario.calendar.workingDays
            ) ||
            JSON.stringify(prior.timeOff || []) !==
              JSON.stringify(person.timeOff || []) ||
            JSON.stringify(prior.daysOff || []) !==
              JSON.stringify(person.daysOff || []))
        )
          notes.push(
            `${person.name}: availability changed; review affected Day/Week estimates.`
          );
      }
    return notes;
  }
  function csv(plan, result) {
    const columns = [
      'ID',
      'Title',
      'Feature',
      'Responsible role',
      'Work category',
      'Size',
      'Size rationale',
      'Person',
      'Start',
      'Finish',
      'Dependencies',
      'Outcome',
      'Accepted scope',
      'Acceptance',
      'Verification',
      'Understanding',
      'Decisions',
      'Risks',
      'Schedule note',
    ];
    const flatten = (value) =>
      Array.isArray(value) ? value.join('\n') : value || '';
    const cell = (value) => {
      let s = String(flatten(value));
      if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const rows = plan.tickets.map((t) => {
      const e = result.entries.find((e) => e.id === t.id),
        role = plan.roles.find((r) => r.id === t.roleId);
      return [
        t.id,
        t.title,
        t.feature,
        role.name,
        role.kind,
        t.size || 'Unsized',
        t.sizeRationale,
        e.personName,
        e.start,
        e.end,
        t.dependsOn,
        t.outcome,
        t.scope,
        t.acceptance,
        t.verification,
        t.understanding,
        t.decisions,
        t.risks,
        e.reason ||
          (e.windowExtended
            ? 'Review estimate: calendar extends size window'
            : 'Proposed schedule; human review required'),
      ];
    });
    return (
      '\uFEFF' +
      [columns, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') +
      '\r\n'
    );
  }
  const api = {
    clone,
    parseDate,
    iso,
    addDays,
    working,
    available,
    windowDays,
    validate,
    schedule,
    dependencyBound,
    addPerson,
    suggestTeam,
    calendarReviews,
    csv,
  };
  root.AttentionPlanner = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
