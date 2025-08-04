import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage"
import { HookType } from '@/types/enum'
import { useTranslation } from "react-i18next"
import { Form, Input, Select, Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import TimeZoneConfigItem from "../item/special/timezone"
import { useHookMode } from "@/utils/hooks"
import { ConfigItemY } from "../item"
import { useHookTypeOptions } from "@/utils/hooks/options"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { getBrowserInfo } from "@/utils/browser"

type DeprecatedType = {
  option: HookType,
  reason: string
}

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const baseValueTypes = [...baseTypes, HookType.value]
const jsTypes = [HookType.default, HookType.browser, HookType.global]
const valueTypes = [HookType.default, HookType.value]

export const WeakFpConfigGroup = memo(() => {
  const [t, i18n] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fp

  const baseValueOptions = useHookTypeOptions(baseValueTypes)
  const jsOptions = useHookTypeOptions(jsTypes)
  const valueOptions = useHookTypeOptions(valueTypes)

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

  return fp ? <>
    <TimeZoneConfigItem />

    {/* uaVersion */}
    {browserInfo.name !== 'firefox' && <ConfigItemY
      label={t('item.title.uaVersion')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.uaVersion')}</Markdown>} />}
    >
      <HookModeItem mode={fp?.navigator.uaVersion}>{(mode) => <>
        <Select<HookType>
          options={jsOptions}
          value={mode.type}
          onChange={mode.setType}
        />
      </>}</HookModeItem>
    </ConfigItemY>}

    {/* languages */}
    <ConfigItemY
      label={t('item.title.languages')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.languages')}</Markdown>} />}
    >
      <HookModeItem<string[], string>
        mode={fp.navigator.languages}
        parser={{
          toInput: (v) => v?.join?.(',') ?? navigator.languages.join(','),
          toValue: (v) => {
            const res = v.split(',').map(v => v.trim()).filter((v) => !!v)
            return res.length ? res : navigator.languages as string[]
          },
        }}
      >{(mode) => <>
        <Select
          options={baseValueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <>
          <Input
            value={mode.input}
            onChange={({ target }) => mode.setInput(target.value)}
          />
        </>}
      </>}</HookModeItem>
    </ConfigItemY>

    {/* gpuInfo */}
    <ConfigItemY
      label={t('item.title.glDriver')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.glDriver')}</Markdown>} />}
    >
      <HookModeItem<GpuInfo, GpuInfo>
        mode={fp.normal.gpuInfo}
        parser={{
          toInput: (v) => v ?? gpuInfo,
          toValue: (v) => {
            if (!v.vendor?.trim()) v.vendor = gpuInfo.vendor;
            if (!v.renderer?.trim()) v.renderer = gpuInfo.renderer;
            return v;
          },
        }}
      >{(mode) => <>
        <Select
          options={valueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <>
          <Form.Item className="mb-0" label={t('item.label.glVendor')}>
            <Input
              value={mode.input.vendor}
              onChange={({ target }) => mode.setInput({ ...mode.input, vendor: target.value })}
            />
          </Form.Item>
          <Form.Item className="mb-0" label={t('item.label.glRenderer')}>
            <Input
              value={mode.input.renderer}
              onChange={({ target }) => mode.setInput({ ...mode.input, renderer: target.value })}
            />
          </Form.Item>
        </>}
      </>}</HookModeItem>
    </ConfigItemY>

    {/* screen size */}
    <ConfigItemY
      label={t('item.title.size')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.size')}</Markdown>} />}
    >
      <HookModeItem
        mode={fp.screen.size}
        parser={{
          toInput: v => v ?? { width: screen.width, height: screen.height },
          toValue(v) {
            v.width ??= screen.width;
            v.height ??= screen.height;
            return v;
          },
        }}
      >{(mode) => <>
        <Select
          options={valueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <>
          <Form.Item className="mb-0" label='width'>
            <Input
              value={mode.input.width}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                width: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item className="mb-0" label='height'>
            <Input
              value={mode.input.height}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                height: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}
      </>}</HookModeItem>
    </ConfigItemY>

    {/* screen colorDepth */}
    <ConfigItemY
      label={t('item.title.depth')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.depth')}</Markdown>} />}
    >
      <HookModeItem
        mode={fp.screen.depth}
        parser={{
          toInput: v => v ?? { color: screen.colorDepth, pixel: screen.pixelDepth },
          toValue(v) {
            v.color ??= screen.colorDepth;
            v.pixel ??= screen.pixelDepth;
            return v;
          },
        }}
      >{(mode) => <>
        <Select
          options={valueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <>
          <Form.Item className="mb-0" label='colorDepth'>
            <Input
              value={mode.input.color}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                color: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item className="mb-0" label='pixelDepth'>
            <Input
              value={mode.input.pixel}
              onChange={({ target }) => mode.setInput({
                ...mode.input,
                pixel: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}
      </>}</HookModeItem>
    </ConfigItemY>

    {/* navigator hardwareConcurrency */}
    <ConfigItemY
      label={t('item.title.hardwareConcurrency')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.hardwareConcurrency')}</Markdown>} />}
    >
      <HookModeItem<number, string>
        mode={fp.navigator.hardwareConcurrency}
        parser={{
          toInput: v => String(v ?? navigator.hardwareConcurrency),
          toValue: (v) => isNaN(parseInt(v)) ? navigator.hardwareConcurrency : parseInt(v),
        }}
      >{(mode) => <>
        <Select
          options={valueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <>
          <Form.Item className="mb-0" label='value'>
            <Input
              placeholder={String(navigator.hardwareConcurrency)}
              value={mode.input}
              onChange={({ target }) => mode.setInput(target.value)}
            />
          </Form.Item>
        </>}
      </>}</HookModeItem>
    </ConfigItemY >

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

const HookModeItem = <V, I,>({ mode, parser, children }: {
  mode?: HookMode<V>
  parser?: Parameters<typeof useHookMode<V, I>>[1]
  children: (mode: ReturnType<typeof useHookMode<V, I>>) => React.ReactNode
}) => {
  const hm = useHookMode<V, I>(mode, parser)
  return <>{children(hm)}</>
}

export default WeakFpConfigGroup