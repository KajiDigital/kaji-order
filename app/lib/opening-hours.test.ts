import assert from 'node:assert/strict'
import { getOpenStatus } from './opening-hours'

const newaHours = {
  friday: { open: true, openTime: '15:00', closeTime: '00:00' },
  monday: { open: true, openTime: '16:00', closeTime: '23:00' },
  sunday: { open: true, openTime: '12:00', closeTime: '01:00' },
  tuesday: { open: true, openTime: '16:00', closeTime: '23:00' },
  saturday: { open: true, openTime: '12:00', closeTime: '02:00' },
  thursday: { open: true, openTime: '16:00', closeTime: '23:00' },
  wednesday: { open: true, openTime: '16:00', closeTime: '23:00' },
}

function status(iso: string) {
  return getOpenStatus(newaHours, false, false, true, true, 1, null, false, new Date(iso))
}

assert.equal(status('2026-10-31T20:00:00.000Z').isOpen, true, 'Saturday 8pm should be open (noon–2am)')
assert.equal(status('2026-11-01T01:00:00.000Z').isOpen, true, 'Sunday 1am should still be Saturday service')
assert.equal(status('2026-11-01T02:30:00.000Z').isOpen, false, 'Sunday 2:30am should be closed')
assert.equal(status('2026-10-30T16:00:00.000Z').isOpen, true, 'Friday 4pm should be open (3pm–midnight)')
assert.equal(status('2026-10-31T00:00:00.000Z').isOpen, false, 'Saturday midnight should be closed after Friday 00:00 close')
assert.equal(status('2026-10-26T17:00:00.000Z').isOpen, true, 'Monday 5pm same-day hours should be open')
assert.equal(status('2026-10-26T23:30:00.000Z').isOpen, false, 'Monday after 11pm should be closed')

console.log('opening-hours overnight tests passed')
