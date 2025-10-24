import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage"
import { HookType } from '@/types/enum'
import { useTranslation } from "react-i18next"
import { Form, Input, Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import TimeZoneConfigItem from "../special/timezone"
import { ConfigDesc, ConfigItemY, HookModeContent } from "../item"
import TipIcon from "@/components/data/tip-icon"
import { getBrowserInfo } from "@/utils/browser"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { useShallow } from "zustand/shallow"
import UserAgentConfigItem from "../special/user-agent"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const baseValueTypes = [...baseTypes, HookType.value]
const jsTypes = [HookType.default, HookType.browser, HookType.global]
const valueTypes = [HookType.default, HookType.value]

const deprecatedTag = ['deprecated']
const unstableTag = ['unstable']

export const WeakFpConfigGroup = memo(() => {
  const [t] = useTranslation()

  const storage = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))
  const fp = storage.config?.fp

  const browserInfo = useMemo(() => getBrowserInfo(navigator.userAgent), [])

  const gpuInfo = useMemo<GpuInfo>(() => {
    const cvs = document.createElement('canvas')
    const gl = cvs.getContext("webgl2") ?? cvs.getContext("webgl")
    if (!gl) return {};
    const ex = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ex) return {};
    return {
      vendor: gl.getParameter(ex.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ex.UNMASKED_RENDERER_WEBGL),
    }
  }, [])

  return fp ? <div key={storage.version}>
    {browserInfo.name !== 'firefox' && <UserAgentConfigItem />}

    <TimeZoneConfigItem />

    {/* uaVersion */}
    {browserInfo.name !== 'firefox' &&
      <HookModeContent
        mode={fp?.navigator.uaVersion}
        types={jsTypes}
        selectClassName={dotStyles.base}
      >{(mode, { select }) =>
        <ConfigItemY
          label={t('item.title.uaVersion')}
          className={mode.isDefault ? '' : dotStyles.warning}
          endContent={<TipIcon.Question content={<ConfigDesc tags={unstableTag} desc={t('item.desc.uaVersion', { joinArrays: '\n\n' })} />} />}
        >
          {select}
        </ConfigItemY>}
      </HookModeContent>}

    {/* languages */}
    <HookModeContent
      mode={fp.navigator.languages}
      types={valueTypes}
      parser={{
        toInput: (v) => v?.join?.(',') ?? '',
        toValue: (v) => {
          const res = v.split(',').map(v => v.trim()).filter((v) => !!v)
          return res.length ? res : navigator.languages as string[]
        },
      }}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.languages')}
        className={mode.isDefault ? '' : dotStyles.warning}
        endContent={<TipIcon.Question content={<ConfigDesc tags={unstableTag} desc={t('item.desc.languages', { joinArrays: '\n\n' })} />} />}
      >
        {select}
        {mode.isValue && <>
          <Input
            placeholder={navigator.languages.join(',')}
            value={mode.input}
            onChange={({ target }) => mode.setInput(target.value)}
          />
        </>}
      </ConfigItemY>}
    </HookModeContent>

    {/* gpuInfo */}
    <HookModeContent
      mode={fp.normal.gpuInfo}
      types={valueTypes}
      parser={{
        toInput: (v) => v ?? gpuInfo,
        toValue: (v) => {
          if (!v.vendor?.trim()) v.vendor = gpuInfo.vendor;
          if (!v.renderer?.trim()) v.renderer = gpuInfo.renderer;
          return v;
        },
      }}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.gpuInfo')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<ConfigDesc desc={t('item.desc.gpuInfo')} />} />}
      >
        {select}
        {mode.isValue && <>
          <Form.Item label={t('item.label.glVendor')}>
            <Input
              value={mode.input.vendor}
              onChange={({ target }) => mode.setInput({ ...mode.input, vendor: target.value })}
            />
          </Form.Item>
          <Form.Item label={t('item.label.glRenderer')}>
            <Input
              value={mode.input.renderer}
              onChange={({ target }) => mode.setInput({ ...mode.input, renderer: target.value })}
            />
          </Form.Item>
        </>}
      </ConfigItemY>}
    </HookModeContent>

    {/* screen size */}
    <HookModeContent
      mode={fp.screen.size}
      types={baseValueTypes}
      parser={{
        toInput: v => v ?? { width: screen.width, height: screen.height },
        toValue(v) {
          v.width ??= screen.width;
          v.height ??= screen.height;
          return v;
        },
      }}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.size')}
        className={mode.isDefault ? '' : dotStyles.warning}
        endContent={<TipIcon.Question content={<ConfigDesc tags={unstableTag} desc={t('item.desc.size')} />} />}
      >
        {select}
        {mode.isValue && <>
          <Form.Item label='width'>
            <Input
              value={mode.input.width}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                width: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='height'>
            <Input
              value={mode.input.height}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                height: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}
      </ConfigItemY>}
    </HookModeContent>

    {/* screen colorDepth */}
    <HookModeContent
      mode={fp.screen.depth}
      types={valueTypes}
      parser={{
        toInput: v => v ?? { color: screen.colorDepth, pixel: screen.pixelDepth },
        toValue(v) {
          v.color ??= screen.colorDepth;
          v.pixel ??= screen.pixelDepth;
          return v;
        },
      }}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.depth')}
        className={mode.isDefault ? '' : dotStyles.error}
        endContent={<TipIcon.Question content={<ConfigDesc tags={deprecatedTag} desc={t('item.desc.depth')} />} />}
      >
        {select}
        {mode.isValue && <>
          <Form.Item label='colorDepth'>
            <Input
              value={mode.input.color}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                color: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='pixelDepth'>
            <Input
              value={mode.input.pixel}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                pixel: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}
      </ConfigItemY>}
    </HookModeContent>

    {/* navigator hardwareConcurrency */}
    <HookModeContent
      mode={fp.navigator.hardwareConcurrency}
      types={valueTypes}
      parser={{
        toInput: v => String(v ?? navigator.hardwareConcurrency),
        toValue: (v) => isNaN(parseInt(v)) ? navigator.hardwareConcurrency : parseInt(v),
      }}
      selectClassName={dotStyles.base}
    >{(mode, { select }) =>
      <ConfigItemY
        label={t('item.title.hardwareConcurrency')}
        className={mode.isDefault ? '' : dotStyles.error}
        endContent={<TipIcon.Question content={<ConfigDesc tags={deprecatedTag} desc={t('item.desc.hardwareConcurrency')} />} />}
      >
        {select}
        {mode.isValue && <>
          <Input
            placeholder={String(navigator.hardwareConcurrency)}
            value={mode.input}
            onChange={({ target }) => mode.setInput(target.value)}
          />
        </>}
      </ConfigItemY>}
    </HookModeContent>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default WeakFpConfigGroup