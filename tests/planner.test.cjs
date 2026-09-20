const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../plugins/attention-first-engineering/skills/attention-first/assets/planner-core.js');
const fixture = () => ({
  title: 'Test',
  startDate: '2026-10-05',
  targetDate: '2026-11-30',
  calendar: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
  roles: [
    {
      id: 'ai',
      name: 'AI engineer',
      kind: 'engineering',
      defaultCapacity: 3,
      people: [
        {
          id: 'matt',
          name: 'Matt Groff',
          capacity: 3,
          workingDays: [1, 2, 3, 4, 5],
          daysOff: [],
          timeOff: [],
        },
      ],
    },
  ],
  tickets: [],
});
const ticket = (id, size = 'Day', dependsOn = [], roleId = 'ai') => ({
  id,
  title: id,
  roleId,
  size,
  dependsOn,
});
test('integer daily capacity applies to distinct contexts including completed Day tickets', () => {
  const p = fixture();
  p.roles[0].people[0].capacity = 2;
  p.tickets = [1, 2, 3].map((i) => ticket('T' + i));
  const r = P.schedule(p);
  assert.deepEqual(
    r.entries.map((e) => e.start),
    ['2026-10-05', '2026-10-05', '2026-10-06']
  );
  assert.equal(r.usage.matt['2026-10-05'], 2);
});
test('capacity above three is supported without fractional tickets', () => {
  const p = fixture();
  p.roles[0].people[0].capacity = 5;
  p.tickets = Array.from({ length: 6 }, (_, i) => ticket('T' + i));
  const r = P.schedule(p);
  assert.equal(r.usage.matt['2026-10-05'], 5);
  assert.equal(r.entries[5].start, '2026-10-06');
  p.roles[0].people[0].capacity = 1.5;
  assert.throws(() => P.validate(p), /integer/);
});
test('Week and Day share one person while respecting every daily context limit', () => {
  const p = fixture();
  p.tickets = [
    ticket('W', 'Week'),
    ...Array.from({ length: 10 }, (_, i) => ticket('D' + i)),
  ];
  const r = P.schedule(p);
  assert.equal(r.end, '2026-10-09');
  assert.equal(r.entries[0].activeDays.length, 5);
  assert.ok(Object.values(r.usage.matt).every((n) => n === 3));
});
test('additional people cannot shorten a serial dependency chain', () => {
  const p = fixture();
  p.targetDate = '2026-10-16';
  p.tickets = [
    ticket('A', 'Week'),
    ticket('B', 'Week', ['A']),
    ticket('C', 'Week', ['B']),
  ];
  for (let i = 0; i < 4; i++) P.addPerson(p, 'ai');
  const r = P.schedule(p);
  assert.equal(r.end, '2026-10-23');
  assert.deepEqual(P.dependencyBound(p).chain, ['A', 'B', 'C']);
  assert.equal(P.suggestTeam(p).plan, null);
});
test('staffing can move independent work earlier', () => {
  const p = fixture();
  p.roles[0].people[0].capacity = 1;
  p.roles[0].defaultCapacity = 1;
  p.targetDate = '2026-10-09';
  p.tickets = [ticket('A', 'Week'), ticket('B', 'Week')];
  assert.equal(P.schedule(p).end, '2026-10-16');
  const s = P.suggestTeam(p);
  assert.equal(s.plan.roles[0].people.length, 2);
  assert.equal(s.result.end, '2026-10-09');
});
test('holidays affect dates and are excluded from contexts', () => {
  const p = fixture();
  p.calendar.holidays = ['2026-10-07'];
  p.tickets = [ticket('W', 'Week')];
  const r = P.schedule(p);
  assert.equal(r.end, '2026-10-12');
  assert.equal(r.usage.matt['2026-10-07'], undefined);
  assert.equal(r.entries[0].activeDays.length, 5);
});
test('named person start dates and vacation ranges delay assignment', () => {
  const p = fixture();
  const m = p.roles[0].people[0];
  m.availableFrom = '2026-10-12';
  m.timeOff = [{ start: '2026-10-12', end: '2026-10-16' }];
  p.tickets = [ticket('D')];
  const e = P.schedule(p).entries[0];
  assert.equal(e.start, '2026-10-19');
  assert.equal(e.personName, 'Matt Groff');
});
test('roll-off cannot silently split ownership or schedule after leaving', () => {
  const p = fixture();
  p.roles[0].people[0].availableUntil = '2026-10-07';
  p.tickets = [ticket('W', 'Week')];
  const r = P.schedule(p);
  assert.equal(r.entries[0].start, null);
  assert.match(r.problems[0], /roll-off/);
  assert.equal(r.fits, false);
});
test('another eligible person can own the whole ticket when the first rolls off', () => {
  const p = fixture();
  p.roles[0].people[0].availableUntil = '2026-10-07';
  const replacement = P.addPerson(p, 'ai');
  replacement.name = 'AI engineer 2';
  p.tickets = [ticket('W', 'Week')];
  assert.equal(P.schedule(p).entries[0].personId, replacement.id);
});
test('working pattern changes flag estimates; a week is not silently five attendance days', () => {
  const p = fixture();
  p.tickets = [ticket('W', 'Week')];
  const next = P.clone(p);
  next.roles[0].people[0].workingDays = [1, 3, 5];
  const r = P.schedule(next);
  assert.equal(r.end, '2026-10-09');
  assert.equal(r.entries[0].activeDays.length, 3);
  assert.equal(P.calendarReviews(p, next).length, 1);
});
test('unavailable completion day extends calendar and explicitly requires estimate review', () => {
  const p = fixture();
  p.roles[0].people[0].daysOff = ['2026-10-09'];
  p.tickets = [ticket('W', 'Week')];
  const r = P.schedule(p);
  assert.equal(r.end, '2026-10-12');
  assert.equal(r.review.length, 1);
  assert.equal(r.fits, false);
});
test('calendar-only team members are not automatically assigned tickets; optional QA stays separate', () => {
  const p = fixture();
  p.roles.push({
    id: 'qa',
    name: 'QA',
    kind: 'support',
    people: [
      { id: 'qa1', name: 'QA 1', capacity: 5, availableFrom: '2026-10-12' },
    ],
  });
  p.tickets = [ticket('E')];
  assert.equal(P.schedule(p).entries.length, 1);
  p.tickets.push(ticket('Q', 'Day', ['E'], 'qa'));
  const r = P.schedule(p);
  assert.equal(r.engineeringEnd, '2026-10-05');
  assert.equal(r.end, '2026-10-12');
});
test('unsized or unstaffed tickets and dependents remain visible', () => {
  const p = fixture();
  p.tickets = [ticket('A', null), ticket('B', 'Day', ['A'])];
  let r = P.schedule(p);
  assert.equal(r.problems.length, 2);
  assert.equal(r.entries.length, 2);
  p.tickets[0].size = 'Day';
  p.roles[0].people = [];
  r = P.schedule(p);
  assert.match(r.problems[0], /No AI engineer/);
});
test('cycles, duplicate person IDs, bad dates and invalid roll-off ranges are rejected', () => {
  const p = fixture();
  p.tickets = [ticket('A', 'Day', ['B']), ticket('B', 'Day', ['A'])];
  assert.throws(() => P.validate(p), /cycle/);
  p.tickets = [];
  p.roles[0].people.push(P.clone(p.roles[0].people[0]));
  assert.throws(() => P.validate(p), /unique/);
  assert.throws(() => P.parseDate('2026-02-30'), /Invalid/);
  p.roles[0].people.pop();
  p.roles[0].people[0].timeOff = [{ start: '2026-10-15', end: '2026-10-10' }];
  assert.throws(() => P.validate(p), /before/);
});
test('CSV preserves full ticket detail, quotes, newlines and formula-like input safely', () => {
  const p = fixture();
  p.tickets = [
    {
      ...ticket('X'),
      title: '=HYPERLINK("bad")',
      scope: ['Keep commas, and quotes "yes"', 'Second line'],
      understanding: 'Explain the boundary',
    },
  ];
  const csv = P.csv(p, P.schedule(p));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /""yes""/);
  assert.match(csv, /Second line/);
  assert.match(csv, /Explain the boundary/);
});
test('the same named person cannot be duplicated into a second role with a new id', () => {
  const p = fixture();
  p.roles.push({
    id: 'be',
    name: 'Backend',
    kind: 'engineering',
    people: [{ id: 'other-id', name: '  MATT GROFF  ', capacity: 3 }],
  });
  assert.throws(() => P.validate(p), /one role/);
});
test('rendered data cannot close its script element or replace executable template markers', () => {
  const {
    mkdtempSync,
    writeFileSync,
    readFileSync,
    rmSync,
  } = require('node:fs');
  const { join } = require('node:path');
  const { tmpdir } = require('node:os');
  const { execFileSync } = require('node:child_process');
  const dir = mkdtempSync(join(tmpdir(), 'attention-plan-'));
  try {
    const p = fixture();
    p.title =
      '</script><script>globalThis.injected=true</script> /*__PLANNER_CORE__*/ /*__PLANNER_UI__*/';
    const input = join(dir, 'plan.json'),
      output = join(dir, 'plan.html');
    writeFileSync(input, JSON.stringify(p));
    execFileSync(process.execPath, [
      'plugins/attention-first-engineering/skills/attention-first/scripts/render-plan.mjs',
      input,
      output,
    ]);
    const html = readFileSync(output, 'utf8'),
      data = html.match(
        /<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/
      )[1];
    assert.equal(JSON.parse(data).title, p.title);
    assert.ok(!data.includes('</script>'));
    assert.match(html, /deterministic scenario calculations/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('equal finish dates prefer a person whose calendar preserves the Week window', () => {
  const p = fixture();
  p.startDate = '2026-10-06';
  p.roles[0].people[0].daysOff = ['2026-10-12'];
  const other = P.addPerson(p, 'ai');
  other.availableFrom = '2026-10-07';
  p.tickets = [ticket('W', 'Week')];
  const e = P.schedule(p).entries[0];
  assert.equal(e.end, '2026-10-13');
  assert.equal(e.personId, other.id);
  assert.equal(e.windowExtended, false);
});
test('new role placeholders remain unique after a person has been renamed', () => {
  const p = fixture();
  p.roles[0].people[0].name = 'AI engineer 2';
  const extra = P.addPerson(p, 'ai');
  assert.equal(extra.name, 'AI engineer 3');
  assert.doesNotThrow(() => P.validate(p));
});
