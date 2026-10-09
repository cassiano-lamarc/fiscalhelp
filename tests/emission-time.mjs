import assert from 'node:assert/strict';
import { emissionLabel } from '../src/app/shared/emission-time.ts';
assert.equal(emissionLabel('2026-10-09T02:00:00Z','2026-10-08',new Date('2026-10-09T03:01:00Z')),'Ontem às 23h00');
assert.equal(emissionLabel('2026-10-09T13:52:00Z','2026-10-09',new Date('2026-10-09T18:00:00Z')),'Hoje às 10h52');
assert.equal(emissionLabel('2026-10-07T17:30:00Z','2026-10-07',new Date('2026-10-09T18:00:00Z')),'07/10/2026 às 14h30');
assert.equal(emissionLabel(null,'2026-10-07',new Date('2026-10-09T18:00:00Z')),'07/10/2026');
assert.equal(emissionLabel('2025-12-31T23:00:00Z','2025-12-31',new Date('2026-01-01T12:00:00Z')),'Ontem às 20h00');
assert.equal(emissionLabel('2026-03-07T23:00:00Z','2026-03-07',new Date('2026-03-08T18:00:00Z'),'America/New_York'),'Ontem às 18h00');
console.log('PASS: today, yesterday, older dates, UTC/local midnight, year rollover, DST and legacy dates without invented time.');
