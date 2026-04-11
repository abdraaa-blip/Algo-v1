import { describe, expect, it } from 'vitest'
import { CONTROL_ROOM_QUICK_NAV } from '@/lib/control-room/quick-nav'

describe('CONTROL_ROOM_QUICK_NAV', () => {
  it('liste des entrées stables et chemins absolus', () => {
    expect(CONTROL_ROOM_QUICK_NAV.length).toBeGreaterThanOrEqual(6)
    for (const item of CONTROL_ROOM_QUICK_NAV) {
      expect(item.href.startsWith('/')).toBe(true)
      expect(item.label.length).toBeGreaterThan(0)
    }
  })
})
