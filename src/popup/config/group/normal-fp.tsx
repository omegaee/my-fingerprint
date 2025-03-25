import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage"
import { HookType } from '@/types/enum'
import { InputLine } from "../../config/form/input"
import { useTranslation } from "react-i18next"
import SelectFpConfigItem from "../item/fp/select"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { getBrowser } from "@/utils/equipment"

type DeprecatedType = {
  option: HookType,
  reason: string
}

const BASE_TYPES = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const SYSTEM_TYPES = [HookType.default]

// export type NormalFpConfigGroupProps = {
// }

export const NormalFpConfigGroup = memo(() => {
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

  const browserType = useMemo(() => getBrowser(navigator.userAgent), [])

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
    {browserType === 'chrome' && <SelectFpConfigItem
      title={t('item.title.uaVersion')}
      desc={t('item.desc.uaVersion')}
      options={BASE_TYPES}
      deprecatedOptions={netDeprecatedTypes}
      defaultValue={fp.navigator.uaVersion.type}
      onChange={(type) => fp.navigator.uaVersion.type = type as any}
    />}

    <SelectFpConfigItem
      title={t('item.title.languages')}
      desc={t('item.desc.languages')}
      options={BASE_TYPES}
      deprecatedOptions={netDeprecatedTypes}
      defaultValue={fp.navigator.languages.type}
      onChange={(type) => {
        fp.navigator.language.type = type as any;
        fp.navigator.languages.type = type as any;
      }}
      custom={<InputLine label="value"
        defaultValue={navigator.languages.join(',')}
        initialValue={(fp.navigator.languages as ValueHookMode<string[]>).value?.join(',')}
        onDebouncedInput={(value) => {
          const parts = [...new Set(value.split(",").filter((v) => !!v.trim()))];
          (fp.navigator.languages as ValueHookMode<string[]>).value = parts;
          (fp.navigator.language as ValueHookMode<string>).value = parts[0];
        }} />}
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
  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default NormalFpConfigGroup