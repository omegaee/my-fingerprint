import { type GpuInfoOption, LocalApi } from "@/api/local"
import { useStorageStore } from "@/popup/stores/storage"
import { type HookModeHandler, useI18n } from "@/utils/hooks"
import { sharedAsync } from "@/utils/timer"
import { Form, Input, Select, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { ConfigDesc, ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { cn } from "@/utils/style"
import TipIcon from "@/components/data/tip-icon"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'

type ModeHandler = HookModeHandler<GpuInfo, GpuInfo>
type OptionType = (string & {}) | HookType

const unstableTag = ['unstable']

const fetchGPUInfo = sharedAsync(LocalApi.gpuInfo)

const GPUInfoConfigItem = ({ }: {
}) => {
  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

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

  return !fp ?
    <Spin indicator={<LoadingOutlined spin />} /> :
    <HookModeContent<GpuInfo, GpuInfo>
      isMakeSelect={false}
      mode={fp.normal.gpuInfo}
      parser={{
        toInput: (value) => value ?? { ...gpuInfo },
        toValue: (input) => input,
      }}
    >{(mode) => <ModeView mode={mode} defaultValues={gpuInfo} />}</HookModeContent>
}

const ModeView = ({ mode, defaultValues }: {
  mode: ModeHandler
  defaultValues: GpuInfo
}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<GpuInfoOption[]>([])

  const presetKey = (mode.value as any)?.key;

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
    if (v === HookType.default || v === HookType.value) {
      mode.setValue({ ...defaultValues })
      mode.setType(v);
    } else {
      const preset = localPreset?.find(item => item.key === v);
      if (preset) {
        const { title, ...rest } = preset;
        mode.setValue(rest)
      }
      mode.setType(HookType.value);
    }
  }

  return <ConfigItemY
    label={t('item.title.gpuInfo')}
    className={cn(!mode.isDefault && dotStyles.warning)}
    endContent={<TipIcon.Question content={<ConfigDesc tags={unstableTag} desc={t('item.desc.gpuInfo', { joinArrays: '\n\n' })} />} />}
  >
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      value={presetKey || mode.type}
      onChange={onChange}
    />
    {(mode.isValue && !presetKey) && <CustomView mode={mode} defaultValues={defaultValues} />}
  </ConfigItemY>
}

const CustomView = ({ mode, defaultValues }: {
  mode: ModeHandler
  defaultValues: GpuInfo
}) => {
  const { t } = useTranslation()
  const input = mode.input;

  return <div>
    <Form.Item label={t('item.label.glVendor')}>
      <Input
        value={mode.input.vendor}
        onChange={({ target }) => {
          input.vendor = target.value || defaultValues.vendor;
          mode.updateValue()
        }}
      />
    </Form.Item>
    <Form.Item label={t('item.label.glRenderer')}>
      <Input
        value={mode.input.renderer}
        onChange={({ target }) => {
          input.renderer = target.value || defaultValues.renderer;
          mode.updateValue()
        }}
      />
    </Form.Item>
  </div>
}

export default GPUInfoConfigItem