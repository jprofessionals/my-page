import { Setting } from '@/data/types/types.gen'

export default function getSetting(
  settings: Setting[] | undefined,
  key: string,
): string | undefined {
  if (settings == null) {
    return undefined
  }
  const setting = settings.find((element) => element.settingId === key)
  return setting ? setting.settingValue : undefined
}
