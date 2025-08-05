import { useStorageStore } from "@/popup/stores/storage"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import { memo } from "react"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { ConfigItemY, HookModeContent } from "../item"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const disabledTypes = [HookType.default, HookType.disabled]

export const StrongFpConfigGroup = memo(() => {
  const [t] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fp

  return fp ? <>

    <HookModeContent
      mode={fp.other.canvas}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.canvas')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.canvas')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.audio}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.audio')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.audio')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.font}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.font')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.font')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webgl}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.webgl')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webgl')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webrtc}
      types={disabledTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.webrtc')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webrtc')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webgpu}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.webgpu')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webgpu')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.domRect}
      types={baseTypes}
    >{(_, { select }) =>
      <ConfigItemY
        label={t('item.title.domRect')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.domRect')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default StrongFpConfigGroup