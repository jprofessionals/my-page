import { describe, it, expect } from 'vitest'
import cn from './cn'

describe('cn (classname utility)', () => {
  it('merges multiple classnames', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classnames', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
  })

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar')
  })

  it('merges Tailwind classes correctly (removes duplicates)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles arrays of classnames', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('handles objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('handles complex Tailwind merge scenarios', () => {
    // Later value should override earlier value for same property
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('preserves non-conflicting Tailwind classes', () => {
    expect(cn('text-sm p-4', 'bg-blue-500')).toBe('text-sm p-4 bg-blue-500')
  })

  it('handles mixed input types', () => {
    expect(cn('foo', ['bar', { baz: true, qux: false }], 'quux')).toBe(
      'foo bar baz quux',
    )
  })

  it('trims whitespace', () => {
    expect(cn('  foo  ', '  bar  ')).toBe('foo bar')
  })
})