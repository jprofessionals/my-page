import { Settings } from '@/types'

export default function getSetting(settings: Settings[], key: string): string {
  if (settings == null) {
    return null
  }
  const setting = (settings as Setting[]).find((element) => element.settingId === key)
  return setting ? setting.settingValue : null
}
