import { describe, it, expect } from 'vitest'
import getInNok from './getInNok'

describe('getInNok', () => {
  it('formats positive numbers as NOK currency', () => {
    // Norwegian locale places kr after the amount and uses narrow no-break space
    expect(getInNok(1000)).toContain('1')
    expect(getInNok(1000)).toContain('000,00')
    expect(getInNok(1000)).toContain('kr')
    expect(getInNok(1234567)).toContain('567,00')
  })

  it('formats decimal numbers with max 2 fraction digits', () => {
    expect(getInNok(1234.56)).toContain(',56')
    expect(getInNok(1234.56)).toContain('kr')
    expect(getInNok(100.5)).toContain('100,50')
    expect(getInNok(42.123456)).toContain('42,12')
  })

  it('handles zero as currency', () => {
    expect(getInNok(0)).toContain('0,00')
    expect(getInNok(0)).toContain('kr')
  })

  it('handles negative amounts', () => {
    expect(getInNok(-1000)).toContain('−')
    expect(getInNok(-1000)).toContain('1')
    expect(getInNok(-1000)).toContain('kr')
    expect(getInNok(-1234.56)).toContain(',56')
  })

  it('uses default value of 0 when no argument provided', () => {
    expect(getInNok()).toContain('0,00')
    expect(getInNok()).toContain('kr')
  })

  it('handles very small amounts', () => {
    expect(getInNok(0.01)).toContain('0,01')
    expect(getInNok(0.5)).toContain('0,50')
  })

  it('handles very large amounts', () => {
    const result = getInNok(1000000000)
    expect(result).toContain('1')
    expect(result).toContain('000,00')
    expect(result).toContain('kr')
  })

  it('always includes currency symbol', () => {
    const result = getInNok(100)
    expect(result).toContain('kr')
  })

  it('always shows 2 decimal places for whole numbers', () => {
    expect(getInNok(100)).toContain('100,00')
    expect(getInNok(1000)).toContain('1')
    expect(getInNok(1000)).toContain('000,00')
  })
})