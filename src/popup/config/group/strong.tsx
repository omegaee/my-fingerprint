import { useStorageStore } from "@/popup/stores/storage"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import SelectFpConfigItem from "../item/fp/select"
import { memo } from "react"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'

const BASE_TYPES: HookMode['type'][] = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const SWITCH_TYPES: HookMode['type'][] = [HookType.default, HookType.disabled]

export const StrongFpConfigGroup = memo(() => {
  const [t] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fp

  return fp ? <>
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
      title={t('item.title.font')}
      desc={t('item.desc.font')}
      options={BASE_TYPES}
      defaultValue={fp.other.font.type}
      onChange={(type) => fp.other.font.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.webgl')}
      desc={t('item.desc.webgl')}
      options={BASE_TYPES}
      defaultValue={fp.other.webgl.type}
      onChange={(type) => fp.other.webgl.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.webrtc')}
      desc={t('item.desc.webrtc')}
      options={SWITCH_TYPES}
      defaultValue={fp.other.webrtc.type}
      onChange={(type) => fp.other.webrtc.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.webgpu')}
      desc={t('item.desc.webgpu')}
      options={BASE_TYPES}
      defaultValue={fp.other.webgpu.type}
      onChange={(type) => fp.other.webgpu.type = type as any}
    />

    <SelectFpConfigItem
      title={t('item.title.domRect')}
      desc={t('item.desc.domRect')}
      options={BASE_TYPES}
      defaultValue={fp.other.domRect.type}
      onChange={(type) => fp.other.domRect.type = type as any}
    />
  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default StrongFpConfigGroup