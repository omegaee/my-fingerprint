import { type GpuInfoOption, LocalApi } from "@/api/local"
import { useI18n } from "@/utils/hooks"
import { sharedAsync } from "@/utils/timer"
import { Form, Input, Select } from "antd"
import { useEffect, useMemo, useState } from "react"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import { useHookMode } from "../context"
import { HookModeCustom } from "../ui"

type OptionType = (string & {}) | HookType

const fetchGPUInfo = sharedAsync(LocalApi.gpuInfo)

const GPUInfoConfigItem = ({ }: {}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<GpuInfoOption[]>([])

  const { mode, value: modeValue = {}, setType, setValue } = useHookMode()

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

  useEffect(() => {
    if (!isOpen || localPreset.length != 0) return;
    fetchGPUInfo()
      .then((data) => {
        setLocalPreset(data)
      }).catch((e) => {
        console.warn(e)
      })
  }, [isOpen])

  const options = useMemo(() => {
    return [
      {
        label: <span>{t('g.special')}</span>,
        title: 'special',
        options: [
          {
            value: HookType.default,
            label: t('type.' + HookType[HookType.default]),
          },
          {
            value: HookType.value,
            label: t('type.' + HookType[HookType.value]),
          },
        ],
      },
      localPreset && {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: localPreset.map((v) => ({
          value: v.key,
          label: asLang(v.title),
        })),
      },
    ].filter(v => !!v)
  }, [i18n.language, localPreset])

  const onChange = (v: OptionType) => {
    if (v === HookType.default) {
      setType(HookType.default)
    } else if (v === HookType.value) {
      setValue({ ...gpuInfo })
    } else {
      const preset = localPreset?.find(item => item.key === v);
      if (preset) {
        const { title, ...rest } = preset;
        setValue(rest)
      }
    }
  }

  return <>
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      value={modeValue.key || mode.type}
      onChange={onChange}
    />
    <HookModeCustom>
      <Form.Item label={t('item.label.glVendor')}>
        <Input
          value={modeValue.vendor ?? gpuInfo.vendor}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            vendor: target.value || gpuInfo.vendor
          })}
        />
      </Form.Item>
      <Form.Item label={t('item.label.glRenderer')}>
        <Input
          value={modeValue.renderer ?? gpuInfo.renderer}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            renderer: target.value || gpuInfo.renderer
          })}
        />
      </Form.Item>
    </HookModeCustom>
  </>
}

export default GPUInfoConfigItem