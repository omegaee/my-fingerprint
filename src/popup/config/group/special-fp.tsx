import { useConfigStore } from "@/popup/stores/config"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import SelectFpConfigItem from "../item/fp/select"
import TimeZoneConfigItem from "../item/special/timezone"
import { memo } from "react"

const BASE_TYPES = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]

// export type SpecialFpConfigGroupProps = {
// }

export const SpecialFpConfigGroup = memo(() => {
  const [t] = useTranslation()

  const config = useConfigStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fingerprint

  return fp && <>
    <TimeZoneConfigItem />

    <SelectFpConfigItem
      title={t('item.title.canvas')}
      desc={t('item.desc.canvas')}
      options={BASE_TYPES}
      defaultValue={fp.other.canvas.type}
      onChange={(type) => fp.other.canvas.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.audio')}
      desc={t('item.desc.audio')}
      options={BASE_TYPES}
      defaultValue={fp.other.audio.type}
      onChange={(type) => fp.other.audio.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.webgl')}
      desc={t('item.desc.webgl')}
      options={BASE_TYPES}
      defaultValue={fp.other.webgl.type}
      onChange={(type) => fp.other.webgl.type = type as any}
    />
  </>
})

export default SpecialFpConfigGroup