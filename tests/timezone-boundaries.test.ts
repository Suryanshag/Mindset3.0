/**
 * Regression tests for IST boundary helpers in src/lib/format-date.ts.
 *
 * Uses node:test + node:assert (built-in, no new deps). Run via:
 *   npx tsx --test tests/timezone-boundaries.test.ts
 *
 * These tests lock in the 8 known edge cases that have bitten the
 * codebase (3 confirmed bugs, plus 5 derived cases). Any future change
 * to format-date.ts that breaks one of them is a real regression.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  startOfDayIST,
  startOfNextDayIST,
  startOfWeekIST,
  startOfMonthIST,
  dateOnlyIST,
} from '../src/lib/format-date'

describe('IST boundary helpers', () => {
  it('startOfDayIST handles a UTC instant that is already next-day IST', () => {
    // 2026-05-27 18:30 UTC = 2026-05-28 00:00 IST
    // The IST calendar day containing this instant is 2026-05-28
    // Its start in UTC is 2026-05-27 18:30 UTC
    const input = new Date('2026-05-27T18:30:00.000Z')
    const result = startOfDayIST(input)
    assert.equal(result.toISOString(), '2026-05-27T18:30:00.000Z')
  })

  it('startOfDayIST for a UTC mid-morning instant', () => {
    // 2026-05-27 06:00 UTC = 2026-05-27 11:30 IST
    // IST calendar day = 2026-05-27, start in UTC = 2026-05-26 18:30 UTC
    const input = new Date('2026-05-27T06:00:00.000Z')
    const result = startOfDayIST(input)
    assert.equal(result.toISOString(), '2026-05-26T18:30:00.000Z')
  })

  it('startOfNextDayIST + startOfDayIST give a 24-hour window', () => {
    const d = new Date('2026-05-27T10:00:00.000Z')
    const start = startOfDayIST(d)
    const end = startOfNextDayIST(d)
    assert.equal(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000)
  })

  it('a session at 23:30 IST falls into the correct IST day bucket', () => {
    // 2026-05-27 23:30 IST = 2026-05-27 18:00 UTC
    const sessionInstant = new Date('2026-05-27T18:00:00.000Z')
    const dayBoundary = startOfDayIST(sessionInstant)
    const nextDayBoundary = startOfNextDayIST(sessionInstant)
    assert.ok(sessionInstant.getTime() >= dayBoundary.getTime())
    assert.ok(sessionInstant.getTime() < nextDayBoundary.getTime())
  })

  it('a session at 00:30 IST falls into the correct IST day bucket (not the prior day)', () => {
    // 2026-05-28 00:30 IST = 2026-05-27 19:00 UTC
    // CRITICAL: a naive UTC startOfDay would put this in 2026-05-27,
    // which is WRONG. The IST calendar day is 2026-05-28.
    const sessionInstant = new Date('2026-05-27T19:00:00.000Z')
    const dayBoundary = startOfDayIST(sessionInstant)
    const nextDayBoundary = startOfNextDayIST(sessionInstant)
    // IST calendar day containing this instant is 2026-05-28
    // Its UTC start is 2026-05-27 18:30 UTC
    assert.equal(dayBoundary.toISOString(), '2026-05-27T18:30:00.000Z')
    assert.ok(sessionInstant.getTime() >= dayBoundary.getTime())
    assert.ok(sessionInstant.getTime() < nextDayBoundary.getTime())
  })

  it('week boundary is Monday-start IST', () => {
    // 2026-05-27 is a Wednesday IST
    const wed = new Date('2026-05-27T06:00:00.000Z')
    const weekStart = startOfWeekIST(wed)
    // Monday 2026-05-25 00:00 IST = Sunday 2026-05-24 18:30 UTC
    assert.equal(weekStart.toISOString(), '2026-05-24T18:30:00.000Z')
  })

  it('handles month boundary at IST 00:00 not UTC 00:00', () => {
    // 2026-06-01 00:30 IST = 2026-05-31 19:00 UTC
    // This instant belongs to June IST, not May
    const instant = new Date('2026-05-31T19:00:00.000Z')
    const monthStart = startOfMonthIST(instant)
    // IST month containing this instant is June 2026
    // June 1 00:00 IST = May 31 18:30 UTC
    assert.equal(monthStart.toISOString(), '2026-05-31T18:30:00.000Z')
  })

  it('dateOnlyIST returns UTC midnight of the IST calendar day', () => {
    const input = new Date('2026-05-27T10:00:00.000Z')
    const result = dateOnlyIST(input)
    assert.equal(result.getUTCHours(), 0)
    assert.equal(result.getUTCMinutes(), 0)
    assert.equal(result.getUTCSeconds(), 0)
    // Specifically: IST of 10:00 UTC = 15:30 IST May 27 → IST day = May 27
    assert.equal(result.toISOString(), '2026-05-27T00:00:00.000Z')
  })

  it('dateOnlyIST stores the IST calendar day, not the UTC date, for late-evening UTC instants', () => {
    // 2026-05-27 19:00 UTC = 2026-05-28 00:30 IST
    // The IST calendar day is 2026-05-28, NOT 2026-05-27.
    // This was the mood.ts bug: late-evening IST check-ins were stored under yesterday.
    const input = new Date('2026-05-27T19:00:00.000Z')
    const result = dateOnlyIST(input)
    assert.equal(result.toISOString(), '2026-05-28T00:00:00.000Z')
  })
})
