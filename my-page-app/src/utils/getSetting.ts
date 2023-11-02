import { Settings } from '@/types'

export default function getSetting(settings: Settings[]|undefined, key: string): string|undefined {
  if (settings == null) {
    return undefined
  }
  const setting = (settings as Settings[]).find((element) => element.settingId === key)
  return setting ? setting.settingValue : undefined
}
