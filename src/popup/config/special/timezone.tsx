import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { Form, Input, InputNumber, Select } from "antd"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { sharedAsync } from "@/utils/timer"
import { LocalApi, type TimeZoneOption } from "@/api/local"
import { useI18n } from "@/utils/hooks"
import { getTimeZoneDisplayInfo, isValidTimeZone, resolveTimeZoneOffset } from "@/utils/timezone"
import { useHookMode } from "../context"
import { HookModeCustom } from "../ui"

type OptionType = (string & {}) | HookType
type SelectOption = {
  value: OptionType
  label: React.ReactNode
  menuLabel?: React.ReactNode
}

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
  const isZh = useMemo(() => i18n.language.startsWith('zh'), [i18n.language])
  const previewTz = useMemo(() => ({
    ...currentTz,
    ...modeValue,
  }), [currentTz, modeValue])
  const hasValidZone = useMemo(() => isValidTimeZone(previewTz.zone), [previewTz.zone])
  const previewOffset = useMemo(() => {
    if (hasValidZone) {
      return resolveTimeZoneOffset(previewTz, new Date())
    }
    return previewTz.offset
  }, [hasValidZone, previewTz])

  useEffect(() => {
    if (localPreset.length != 0) return;
    fetchTimezones()
      .then(setLocalPreset)
      .catch((e) => {
        console.warn(e)
      })
  }, [localPreset.length])

  const options = useMemo(() => {
    const now = new Date()
    return [
      {
        label: <span>{t('g.special')}</span>,
        title: 'special',
        options: [
          {
            value: HookType.default,
            label: t('type.' + HookType[HookType.default]),
            menuLabel: t('type.' + HookType[HookType.default]),
          },
          {
            value: HookType.value,
            label: t('type.' + HookType[HookType.value]),
            menuLabel: t('type.' + HookType[HookType.value]),
          },
        ] satisfies SelectOption[],
      },
      localPreset && {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: localPreset.map((tz) => {
          const display = getTimeZoneDisplayInfo(tz, now)
          const cityName = asLang(tz.title)
          const seasonLabel = display.season == null
            ? ''
            : isZh
              ? `，${display.season === 'daylight' ? '夏令时' : '标准时'}`
              : `, ${display.season === 'daylight' ? 'DST' : 'Standard'}`

          return {
            value: tz.key,
            label: isZh ? cityName : tz.key,
            menuLabel: isZh
              ? `${cityName}（${display.offset >= 0 ? '+' : ''}${display.offset}${seasonLabel}）`
              : `${cityName} (${display.offset >= 0 ? '+' : ''}${display.offset}${seasonLabel})`,
          }
        }),
      },
    ].filter(v => !!v)
  }, [asLang, i18n.language, isZh, localPreset, t])

  const onChange = (v: OptionType) => {
    if (v === HookType.default) {
      setType(HookType.default)
    } else if (v === HookType.value) {
      setValue({ ...currentTz })
    } else {
      const preset = localPreset?.find(item => item.key === v);
      if (preset) {
        const { title, ...rest } = preset;
        setValue({
          ...rest,
          offset: resolveTimeZoneOffset(rest, new Date()),
        })
      }
    }
  }

  return <>
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      optionLabelProp="label"
      optionRender={(option) => option.data.menuLabel ?? option.data.label}
      value={modeValue.key || mode.type}
      onChange={onChange}
    />
    <HookModeCustom>
      <Form.Item label={t('item.sub.tz.offset')}>
        <InputNumber
          min={-12} max={12}
          placeholder={`${currentTz.offset}`}
          disabled={hasValidZone}
          value={previewOffset}
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
          value={modeValue.zone ?? currentTz.zone}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            zone: target.value,
            offset: isValidTimeZone(target.value)
              ? resolveTimeZoneOffset({
                ...previewTz,
                zone: target.value,
              }, new Date())
              : (modeValue.offset ?? currentTz.offset),
          })}
        />
      </Form.Item>
    </HookModeCustom>
  </>
}

export default TimeZoneConfigItem
