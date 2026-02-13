import { describe, it, expect } from 'vitest'
import getAsNo from './getAsNo'

describe('getAsNo', () => {
  it('formats positive numbers with Norwegian locale', () => {
    // Norwegian locale uses narrow no-break space (U+202F) as thousands separator
    expect(getAsNo(1000)).toContain('1')
    expect(getAsNo(1000)).toContain('000')
    expect(getAsNo(1234567)).toContain('234')
  })

  it('formats decimal numbers with max 2 fraction digits', () => {
    expect(getAsNo(1234.56)).toContain('1')
    expect(getAsNo(1234.56)).toContain(',56')
    expect(getAsNo(100.5)).toBe('100,5')
    expect(getAsNo(42.123456)).toContain(',12')
  })

  it('handles zero', () => {
    expect(getAsNo(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(getAsNo(-1000)).toContain('−')
    expect(getAsNo(-1000)).toContain('1')
    expect(getAsNo(-1234.56)).toContain(',56')
  })

  it('uses default value of 0 when no argument provided', () => {
    expect(getAsNo()).toBe('0')
  })

  it('handles very small decimal numbers', () => {
    expect(getAsNo(0.01)).toBe('0,01')
    expect(getAsNo(0.001)).toBe('0')
  })

  it('handles very large numbers', () => {
    const result = getAsNo(1000000000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('formats numbers without currency symbol', () => {
    const result = getAsNo(100)
    expect(result).not.toContain('kr')
    expect(result).not.toContain('NOK')
  })
})
