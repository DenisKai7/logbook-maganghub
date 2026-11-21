import assert from 'node:assert';

function getCurrentIsoWeek(d = new Date('2026-11-21T00:00:00Z')) {
  const target = new Date(d.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

const w = getCurrentIsoWeek();
assert.strictEqual(typeof w, 'string');
assert.match(w, /^\d{4}-W\d{2}$/);
console.log('check passed: iso week format ->', w);
