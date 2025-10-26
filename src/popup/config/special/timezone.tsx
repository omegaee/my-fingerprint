import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { LoadingOutlined } from '@ant-design/icons'
import { Form, Input, InputNumber, Select, Spin } from "antd"
import { ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { sharedAsync } from "@/utils/timer"
import { LocalApi, type TimeZoneOption } from "@/api/local"
import { HookModeHandler, useI18n } from "@/utils/hooks"

type ModeHandler = HookModeHandler<TimeZoneInfo, TimeZoneInfo>
type OptionType = (string & {}) | HookType

const getCurrentTimeZoneInfo = (): TimeZoneInfo => {
  const opts = Intl.DateTimeFormat().resolvedOptions()
  return {
    locale: opts.locale,
    zone: opts.timeZone,
    offset: new Date().getTimezoneOffset() / -60
  }
}

const fetchTimezones = sharedAsync(LocalApi.timezone)

export const TimeZoneConfigItem = () => {
  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

  const currentTz = useMemo(() => getCurrentTimeZoneInfo(), [])

  return !fp ? <Spin indicator={<LoadingOutlined spin />} /> : <>
    <HookModeContent<TimeZoneInfo, TimeZoneInfo>
      isMakeSelect={false}
      mode={fp.other.timezone}
      parser={{
        toInput: value => value ?? { ...currentTz },
        toValue: (input) => input,
      }}
    >{(mode) => <ModeView mode={mode} defaultValues={currentTz} />}
    </HookModeContent>
  </>
}

const ModeView = ({ mode, defaultValues }: {
  mode: ModeHandler
  defaultValues: TimeZoneInfo
}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<TimeZoneOption[]>([])

  const presetKey = (mode.value as any)?.key;
  const input = mode.input;

  useEffect(() => {
    if (!isOpen || localPreset.length != 0) return;
    console.log(111);
    
    fetchTimezones()
      .then(setLocalPreset)
      .catch((e) => {
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
        options: localPreset.map((tz) => ({
          value: tz.key,
          label: `(${tz.offset >= 0 ? '+' : ''}${tz.offset}) ${asLang(tz.title)}`,
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
    label={t('item.title.timezone')}
    className={mode.isDefault ? '' : dotStyles.success}
    endContent={<TipIcon.Question content={<Markdown>{t('item.desc.timezone')}</Markdown>} />}
  >
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      value={presetKey || mode.type}
      onChange={onChange}
    />
    {(mode.isValue && !presetKey) && <>
      <Form.Item label={t('item.sub.tz.offset')}>
        <InputNumber
          min={-12} max={12}
          placeholder={`${defaultValues.offset}`}
          value={mode.input.offset}
          onChange={(offset) => {
            input.offset = offset ?? defaultValues.offset
            mode.updateValue()
          }}
        />
      </Form.Item>
      <Form.Item label={t('item.sub.tz.locale')}>
        <Input
          placeholder={defaultValues.locale}
          value={mode.input.locale}
          onChange={({ target }) => {
            input.locale = target.value || defaultValues.locale;
            mode.updateValue()
          }}
        />
      </Form.Item>
      <Form.Item label={t('item.sub.tz.zone')}>
        <Input
          placeholder={defaultValues.zone}
          value={mode.input.zone}
          onChange={({ target }) => {
            input.zone = target.value || defaultValues.zone;
            mode.updateValue()
          }}
        />
      </Form.Item>
    </>}
  </ConfigItemY>
}

export default TimeZoneConfigItem