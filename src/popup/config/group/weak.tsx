import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage"
import { HookType } from '@/types/enum'
import { InputLine } from "../form/input"
import { useTranslation } from "react-i18next"
import SelectFpConfigItem from "../item/fp/select"
import { Input, Select, Spin } from "antd"
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

const BASE_TYPES = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const SYSTEM_TYPES = [HookType.default]

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const baseValueTypes = [...baseTypes, HookType.value]
const jsTypes = [HookType.default, HookType.browser, HookType.global]

export const WeakFpConfigGroup = memo(() => {
  const [t, i18n] = useTranslation()

  const netDeprecatedTypes = useMemo<DeprecatedType[]>(() => [
    {
      option: HookType.page,
      reason: t('item.warn.unsupported-net-hook'),
    },
    {
      option: HookType.domain,
      reason: t('item.warn.unsupported-net-hook'),
    },
  ], [i18n.language])

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fp

  const baseOptions = useHookTypeOptions(baseTypes)
  const baseValueOptions = useHookTypeOptions(baseValueTypes)
  const jsOptions = useHookTypeOptions(jsTypes)

  const browserInfo = useMemo(() => getBrowserInfo(navigator.userAgent), [])

  const glInfo = useMemo(() => {
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

    <ConfigItemY
      label={t('item.title.languages')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.languages')}</Markdown>} />}
    >
      <HookModeItem
        mode={fp.navigator.languages}
        parser={{
          ser: v => v?.join?.(',') ?? '',
          deser: v => v.split(',').map(v => v.trim()).filter((v) => !!v),
          defaultValue: navigator.languages
        }}
      >{(mode) => <>
        <Select
          options={baseValueOptions}
          value={mode.type}
          onChange={mode.setType}
        />
        {mode.type === HookType.value && <Input
          value={mode.stringValue}
          onChange={({ target }) => mode.setStringValue(target.value)}
        />}
      </>}</HookModeItem>
    </ConfigItemY>

    <SelectFpConfigItem
      title={t('item.title.glDriver')}
      desc={t('item.desc.glDriver')}
      options={SYSTEM_TYPES}
      defaultValue={fp.normal.glRenderer.type}
      onChange={(type) => {
        fp.normal.glVendor.type = type as any;
        fp.normal.glRenderer.type = type as any;
      }}
      custom={<>
        <InputLine label={t('item.label.glVendor')}
          defaultValue={glInfo.vendor}
          initialValue={(fp.normal.glVendor as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.normal.glVendor as ValueHookMode).value = value} />
        <InputLine label={t('item.label.glRenderer')}
          defaultValue={glInfo.renderer}
          initialValue={(fp.normal.glRenderer as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.normal.glRenderer as ValueHookMode).value = value} />
      </>}
    />

    <SelectFpConfigItem
      title={t('item.title.size')}
      desc={t('item.desc.size')}
      options={BASE_TYPES}
      defaultValue={fp.screen.width.type}
      onChange={(type) => {
        fp.screen.width.type = type as any;
        fp.screen.height.type = type as any;
      }}
      custom={<>
        <InputLine label="width"
          defaultValue={screen.width}
          initialValue={(fp.screen.width as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.screen.width as ValueHookMode).value = value} />
        <InputLine label="height"
          defaultValue={screen.height}
          initialValue={(fp.screen.height as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.screen.height as ValueHookMode).value = value} />
      </>}
    />

    <SelectFpConfigItem
      title={t('item.title.depth')}
      desc={t('item.desc.depth')}
      options={BASE_TYPES}
      defaultValue={fp.screen.colorDepth.type}
      onChange={(type) => {
        fp.screen.colorDepth.type = type as any;
        fp.screen.pixelDepth.type = type as any;
      }}
      custom={<>
        <InputLine label="colorDepth"
          defaultValue={screen.colorDepth}
          initialValue={(fp.screen.colorDepth as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.screen.colorDepth as ValueHookMode).value = value} />
        <InputLine label="pixelDepth"
          defaultValue={screen.pixelDepth}
          initialValue={(fp.screen.pixelDepth as ValueHookMode).value}
          onDebouncedInput={(value) => (fp.screen.pixelDepth as ValueHookMode).value = value} />
      </>}
    />

    <SelectFpConfigItem
      title={t('item.title.hardwareConcurrency')}
      desc={t('item.desc.hardwareConcurrency')}
      options={BASE_TYPES}
      defaultValue={fp.navigator.hardwareConcurrency.type}
      onChange={(type) => fp.navigator.hardwareConcurrency.type = type as any}
      custom={<InputLine label="value"
        defaultValue={navigator.hardwareConcurrency}
        initialValue={(fp.navigator.hardwareConcurrency as ValueHookMode).value}
        onDebouncedInput={(value) => (fp.navigator.hardwareConcurrency as ValueHookMode).value = value} />}
    />

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

const HookModeItem = <T,>({ mode, parser, children }: {
  mode?: HookMode<T>
  parser?: Parameters<typeof useHookMode<T>>[1]
  children: (mode: ReturnType<typeof useHookMode<T>>) => React.ReactNode
}) => {
  const hm = useHookMode<T>(mode, parser)
  return <>{children(hm)}</>
}

export default WeakFpConfigGroup