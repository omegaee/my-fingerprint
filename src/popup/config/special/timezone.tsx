import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { Form, Input, InputNumber, Select } from "antd"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { sharedAsync } from "@/utils/timer"
import { LocalApi, type TimeZoneOption } from "@/api/local"
import { useI18n } from "@/utils/hooks"
import { useHookMode } from "../context"
import { HookModeCustom } from "../ui"

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

const TimeZoneConfigItem = ({ }: {}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<TimeZoneOption[]>([])

  const { mode, value: modeValue = {}, setType, setValue } = useHookMode()

  const currentTz = useMemo(() => getCurrentTimeZoneInfo(), [])

  useEffect(() => {
    if (!isOpen || localPreset.length != 0) return;
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
    if (v === HookType.default) {
      setType(HookType.default)
    } else if (v === HookType.value) {
      setValue({ ...currentTz })
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
      <Form.Item label={t('item.sub.tz.offset')}>
        <InputNumber
          min={-12} max={12}
          placeholder={`${currentTz.offset}`}
          value={modeValue.offset ?? currentTz.offset}
          onChange={(offset) => setValue({
            ...modeValue,
            key: undefined,
            offset: offset ?? currentTz.offset
          })}
        />
      </Form.Item>
      <Form.Item label={t('item.sub.tz.locale')}>
        <Input
          placeholder={currentTz.locale}
          value={modeValue.locale ?? currentTz.locale}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            locale: target.value || currentTz.locale
          })}
        />
      </Form.Item>
      <Form.Item label={t('item.sub.tz.zone')}>
        <Input
          placeholder={currentTz.zone}
          defaultValue={modeValue.zone ?? currentTz.zone}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            zone: target.value || currentTz.zone
          })}
        />
      </Form.Item>
    </HookModeCustom>
  </>
}

export default TimeZoneConfigItem