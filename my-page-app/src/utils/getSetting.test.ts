import { describe, it, expect } from 'vitest'
import getSetting from './getSetting'
import { Settings } from '@/types'

describe('getSetting', () => {
  const mockSettings: Settings[] = [
    {
      settingId: 'max_booking_days',
      priority: 1,
      description: 'Maximum booking days',
      settingValue: '30',
    },
    {
      settingId: 'notification_email',
      priority: 2,
      description: 'Notification email address',
      settingValue: 'admin@example.com',
    },
    {
      settingId: 'enable_feature',
      priority: 3,
      description: 'Enable feature flag',
      settingValue: 'true',
    },
  ]

  it('returns the correct setting value when key exists', () => {
    expect(getSetting(mockSettings, 'max_booking_days')).toBe('30')
    expect(getSetting(mockSettings, 'notification_email')).toBe(
      'admin@example.com',
    )
    expect(getSetting(mockSettings, 'enable_feature')).toBe('true')
  })

  it('returns undefined when key does not exist', () => {
    expect(getSetting(mockSettings, 'non_existent_key')).toBeUndefined()
  })

  it('returns undefined when settings is undefined', () => {
    expect(getSetting(undefined, 'any_key')).toBeUndefined()
  })

  it('returns undefined when settings is null', () => {
    expect(getSetting(null as unknown as Settings[], 'any_key')).toBeUndefined()
  })

  it('returns undefined when settings is an empty array', () => {
    expect(getSetting([], 'any_key')).toBeUndefined()
  })

  it('handles multiple settings with different values', () => {
    const result1 = getSetting(mockSettings, 'max_booking_days')
    const result2 = getSetting(mockSettings, 'notification_email')

    expect(result1).not.toBe(result2)
    expect(result1).toBe('30')
    expect(result2).toBe('admin@example.com')
  })

  it('returns the first matching setting when there are duplicates', () => {
    const duplicateSettings: Settings[] = [
      {
        settingId: 'duplicate_key',
        priority: 1,
        description: 'First',
        settingValue: 'first_value',
      },
      {
        settingId: 'duplicate_key',
        priority: 2,
        description: 'Second',
        settingValue: 'second_value',
      },
    ]

    expect(getSetting(duplicateSettings, 'duplicate_key')).toBe('first_value')
  })

  it('handles empty string values', () => {
    const settingsWithEmpty: Settings[] = [
      {
        settingId: 'empty_setting',
        priority: 1,
        description: 'Empty value',
        settingValue: '',
      },
    ]

    expect(getSetting(settingsWithEmpty, 'empty_setting')).toBe('')
  })

  it('is case-sensitive for setting keys', () => {
    expect(getSetting(mockSettings, 'MAX_BOOKING_DAYS')).toBeUndefined()
    expect(getSetting(mockSettings, 'max_booking_days')).toBe('30')
  })
})
