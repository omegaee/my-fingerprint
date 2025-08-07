import { useStorageStore } from "@/popup/stores/storage"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import { memo } from "react"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { ConfigItemY, HookModeContent } from "../item"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { useShallow } from "zustand/shallow"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const disabledTypes = [HookType.default, HookType.disabled]

export const StrongFpConfigGroup = memo(() => {
  const [t] = useTranslation()

  const storage = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))
  const fp = storage.config?.fp

  return fp ? <div key={storage.version}>

    <HookModeContent
      mode={fp.other.canvas}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.canvas')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.canvas')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.audio}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.audio')}
        className={mode.isDefault ? '' : dotStyles.warning}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.audio')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.font}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.font')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.font')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webgl}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.webgl')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webgl')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webrtc}
      types={disabledTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.webrtc')}
        className={mode.isDefault ? '' : dotStyles.warning}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webrtc')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.webgpu}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.webgpu')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.webgpu')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

    <HookModeContent
      mode={fp.other.domRect}
      types={baseTypes}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.domRect')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.domRect')}</Markdown>} />}
      >
        {select}
      </ConfigItemY>}
    </HookModeContent>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default StrongFpConfigGroup