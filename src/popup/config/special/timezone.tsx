import { useTranslation } from "react-i18next"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { useMemo } from "react"
import { HookType } from '@/types/enum'
import { LoadingOutlined } from '@ant-design/icons'
import { Form, Input, InputNumber, Select, Spin } from "antd"
import { ConfigItemY, HookModeContent } from "../item"

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

type OptionType = (string & {}) | HookType

const getCurrentTimeZoneInfo = (): Omit<TimeZoneInfo, 'text'> => {
  const opts = Intl.DateTimeFormat().resolvedOptions()
  return {
    locale: opts.locale,
    zone: opts.timeZone,
    offset: new Date().getTimezoneOffset() / -60
  }
}
const currentTz = getCurrentTimeZoneInfo()

export const TimeZoneConfigItem = () => {
  const [t, i18n] = useTranslation()

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

  return fp ? <>

    <HookModeContent
      isMakeSelect={false}
      mode={fp.other.timezone}
      parser={{
        toInput: v => v ?? {
          ...currentTz,
          text: undefined,
        },
        toValue(v) {
          v.offset ||= currentTz.offset
          v.zone ||= currentTz.zone
          v.locale ||= currentTz.locale
          return v
        },
      }}
    >{(mode) =>
      <ConfigItemY
        label={t('item.title.timezone')}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.timezone')}</Markdown>} />}
      >
        <Select<OptionType>
          options={options}
          value={mode.input.text || mode.type}
          onChange={(v) => {
            if (v === HookType.default || v === HookType.value) {
              mode.setType(v);
              mode.setInput({
                ...currentTz,
                text: undefined,
              });
            } else {
              mode.setType(HookType.value);
              mode.setInput({ ...TIMEZONE_MAP[v]! });
            }
          }}
        />
        {mode.isValue && !mode.input.text && <>
          <Form.Item label={t('item.sub.tz.offset')}>
            <InputNumber
              min={-12} max={12}
              value={mode.input.offset}
              onChange={(offset) => offset != null && mode.setInput({ ...mode.input, offset })}
            />
          </Form.Item>
          <Form.Item label={t('item.sub.tz.locale')}>
            <Input
              value={mode.input.locale}
              onChange={({ target }) => mode.setInput({ ...mode.input, locale: target.value })}
            />
          </Form.Item>
          <Form.Item label={t('item.sub.tz.zone')}>
            <Input
              value={mode.input.zone}
              onChange={({ target }) => mode.setInput({ ...mode.input, zone: target.value })}
            />
          </Form.Item>
        </>}
      </ConfigItemY>}
    </HookModeContent>

  </> : <Spin indicator={<LoadingOutlined spin />} />
}

export default TimeZoneConfigItem