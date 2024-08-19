import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { msgSetConfig } from "@/message/runtime"
import { HookType } from "@/types/enum"
import FConfigItem from "./base"

const getTimezones = () => [
  {
    text: 'LG',
    zone: 'Europe/London',
    locale: 'en-GB',
    offset: 0
  }, {
    text: 'PAR',
    zone: 'Europe/Paris',
    locale: 'fr-FR',
    offset: +1
  }, {
    text: 'BER',
    zone: 'Europe/Berlin',
    locale: 'de-DE',
    offset: +1,
  }, {
    text: 'CAI',
    zone: 'Africa/Cairo',
    locale: 'ar-EG',
    offset: +2,
  }, {
    text: 'MSK',
    zone: 'Europe/Moscow',
    locale: 'ru-RU',
    offset: +3
  }, {
    text: 'DXB',
    zone: 'Asia/Dubai',
    locale: 'ar-AE',
    offset: +4
  }, {
    text: 'KZ',
    zone: 'Asia/Almaty',
    locale: 'zh-CN',
    offset: +5
  }, {
    text: 'KHI',
    zone: 'Asia/Karachi',
    locale: 'ur-PK',
    offset: +5
  }, {
    text: 'DAC',
    zone: 'Asia/Dhaka',
    locale: 'bn-BD',
    offset: +6
  }, {
    text: 'BKK',
    zone: 'Asia/Bangkok',
    locale: 'th-TH',
    offset: +7
  }, {
    text: 'JKT',
    zone: 'Asia/Jakarta',
    locale: 'id-ID',
    offset: +7
  }, {
    text: 'SH',
    zone: 'Asia/Shanghai',
    locale: 'zh-CN',
    offset: +8
  }, {
    text: 'TY',
    zone: 'Asia/Tokyo',
    locale: 'ja-JP',
    offset: +9
  }, {
    text: 'SE',
    zone: 'Asia/Seoul',
    locale: 'ko-KR',
    offset: +9
  }, {
    text: 'SYD',
    zone: 'Australia/Sydney',
    locale: 'en-AU',
    offset: +10,
  }, {
    text: 'NOU',
    zone: 'Pacific/Noumea',
    locale: 'fr-NC',
    offset: +11
  }, {
    text: 'AKL',
    zone: 'Pacific/Auckland',
    locale: 'en-NZ',
    offset: +12
  }, {
    text: 'CVT',
    zone: 'Atlantic/Cape_Verde',
    locale: 'pt-CV',
    offset: -1
  }, {
    text: 'GST',
    zone: 'America/Noronha',
    locale: 'pt-BR',
    offset: -2
  }, {
    text: 'BRT',
    zone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    offset: -3
  }, {
    text: 'AST',
    zone: 'America/Caracas',
    locale: 'es-VE',
    offset: -4
  }, {
    text: 'NY',
    zone: 'America/New_York',
    locale: 'en-US',
    offset: -5
  }, {
    text: 'CHI',
    zone: 'America/Chicago',
    locale: 'en-US',
    offset: -6
  }, {
    text: 'DEN',
    zone: 'America/Denver',
    locale: 'en-US',
    offset: -7
  }, {
    text: 'LAX',
    zone: 'America/Los_Angeles',
    locale: 'en-US',
    offset: -8
  }, {
    text: 'AKST',
    zone: 'America/Anchorage',
    locale: 'en-US',
    offset: -9
  }, {
    text: 'HNL',
    zone: 'Pacific/Honolulu',
    locale: 'en-US',
    offset: -10
  }, {
    text: 'NUT',
    zone: 'Pacific/Niue',
    locale: 'en-NU',
    offset: -11
  },
]

const DEFAULT_VALUE = '<default>'

export type FConfigTimezoneItemProps = {
  title: string
  desc?: string
  value?: TimeZoneInfo
}

export const FConfigTimezoneItem = (props: FConfigTimezoneItemProps) => {
  const [t] = useTranslation()

  const timezones = useMemo<Map<string, TimeZoneInfo>>(() => {
    const map = new Map<string, TimeZoneInfo>()
    for (const tz of getTimezones()) {
      tz.text = t('city.' + tz.text)
      map.set(tz.zone, tz)
    }
    return map
  }, [])

  const getOptions = () => {
    const preset = { value: DEFAULT_VALUE, label: t('type.default') }
    const timezoneOptions = Array.from(timezones.entries()).map(([key, info]) => ({ value: key, label: `(${info.offset > 0 ? '+'+info.offset : info.offset}) ${info.text}` }))
    return [preset, ...timezoneOptions]
  }

  const onChangeOption = (opt: string) => {
    let timezone: ValueHookMode<TimeZoneInfo> | DefaultHookMode
    if (opt === DEFAULT_VALUE) {
      timezone = { type: HookType.default }
    } else {
      const value = timezones.get(opt)
      if (!value) return
      timezone = { type: HookType.value, value }
    }
    msgSetConfig({
      fingerprint: {
        other: { timezone }
      }
    })
  }

  return <FConfigItem.Select<string>
    title={props.title}
    desc={props.desc}
    options={getOptions()}
    defaultValue={props.value?.zone ?? DEFAULT_VALUE}
    onChangeOption={onChangeOption}
  />
}

export default FConfigTimezoneItem