import { useTranslation } from "react-i18next"
import ConfigItem from "../base"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { useCallback, useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { InputLine, InputNumberLine } from "../../../config/form/input"
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from "antd"

const TIMEZONE_LIST: Required<TimeZoneInfo>[] = [
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
    text: 'SG',
    zone: 'Asia/Singapore',
    locale: 'zh-SG',
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

const TIMEZONE_MAP = TIMEZONE_LIST.reduce<Record<string, Required<TimeZoneInfo> | undefined>>((res, value) => {
  res[value.text] = value
  return res
}, {})

type OptionType = string | HookType.default | HookType.value

const getCurrentTimeZoneInfo = (): TimeZoneInfo => {
  const opts = Intl.DateTimeFormat().resolvedOptions()
  return {
    locale: opts.locale,
    zone: opts.timeZone,
    offset: new Date().getTimezoneOffset() / -60
  }
}
const CURRENT_TIMEZONE_INFO = getCurrentTimeZoneInfo()

// export type TimeZoneConfigItemProps = {
// }

export const TimeZoneConfigItem = () => {
  const [t, i18n] = useTranslation()
  const [option, setOption] = useState<OptionType>()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })
  const fp = config?.fp

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
      {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: TIMEZONE_LIST.map((tz) => ({
          value: tz.text,
          label: `(${tz.offset >= 0 ? '+' : ''}${tz.offset}) ${t('city.' + tz.text)}`,
        })),
      },
    ]
  }, [i18n.language])

  useEffect(() => {
    const tzHook = fp?.other.timezone
    if (!tzHook) {
      setOption(undefined)
    } else if (tzHook.type === HookType.default) {
      setOption(HookType.default)
    } else if (tzHook.type === HookType.value) {
      const text = tzHook.value.text ? TIMEZONE_MAP[tzHook.value.text]?.text : undefined
      if (text) {
        setOption(text)
      } else {
        setOption(HookType.value)
      }
    } else {
      setOption(undefined)
    }
  }, [config])

  const onChange = useCallback((opt: OptionType) => {
    if (!fp) return;
    if (opt === HookType.default) {
      fp.other.timezone.type = opt
    } else if (opt === HookType.value) {
      fp.other.timezone = {
        type: HookType.value,
        value: {
          ...getCurrentTimeZoneInfo(),
          text: '',
        }
      }
    } else {
      fp.other.timezone = {
        type: HookType.value,
        value: TIMEZONE_MAP[opt]!,
      }
    }
    setOption(opt)
  }, [config])

  return fp ? <ConfigItem.Select<OptionType>
    title={t('item.title.timezone')}
    action={<TipIcon.Question content={<Markdown>{t('item.desc.timezone')}</Markdown>} />}
    options={options}
    value={option}
    onChange={onChange}
    node={option === HookType.value && <>
      <InputNumberLine label={t('item.sub.tz.offset')}
        min={-12} max={12}
        defaultValue={CURRENT_TIMEZONE_INFO.offset}
        initialValue={(fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.offset}
        onDebouncedInput={(value) => (fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.offset = value}
      />
      <InputLine label={t('item.sub.tz.locale')}
        defaultValue={CURRENT_TIMEZONE_INFO.locale}
        initialValue={(fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.locale}
        onDebouncedInput={(value) => (fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.locale = value}
      />
      <InputLine label={t('item.sub.tz.zone')}
        defaultValue={CURRENT_TIMEZONE_INFO.zone}
        initialValue={(fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.zone}
        onDebouncedInput={(value) => (fp.other.timezone as ValueHookMode<TimeZoneInfo>).value.zone = value}
      />
    </>}
  /> : <Spin indicator={<LoadingOutlined spin />} />
}

export default TimeZoneConfigItem