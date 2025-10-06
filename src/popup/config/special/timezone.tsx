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
import { LocalApi, type TimeZoneInfoOption } from "@/api/local"
import { useI18n } from "@/utils/hooks"

type OptionType = (string & {}) | HookType

type TimeZoneInfoValue = TimeZoneInfo & {
  key?: string
}

const getCurrentTimeZoneInfo = (): TimeZoneInfo => {
  const opts = Intl.DateTimeFormat().resolvedOptions()
  return {
    locale: opts.locale,
    zone: opts.timeZone,
    offset: new Date().getTimezoneOffset() / -60
  }
}
const currentTz = getCurrentTimeZoneInfo()

const getLocalTimezones = sharedAsync(async () => {
  return LocalApi.timezone()
})

export const TimeZoneConfigItem = () => {
  const { t, i18n, asLang } = useI18n()
  const [localTimezones, setLocalTimezones] = useState<TimeZoneInfoOption[]>()

  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

  useEffect(() => {
    getLocalTimezones().then(setLocalTimezones)
  }, [])

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
      localTimezones && {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: localTimezones.map((tz) => ({
          value: tz.key,
          label: `(${tz.offset >= 0 ? '+' : ''}${tz.offset}) ${asLang(tz.title)}`,
        })),
      },
    ].filter(v => !!v)
  }, [i18n.language, localTimezones])

  const findTzByKey = (key: string) => {
    return localTimezones?.find(v => v.key === key)
  }

  return fp ? <>
    <HookModeContent<TimeZoneInfoValue, TimeZoneInfoValue>
      isMakeSelect={false}
      mode={fp.other.timezone}
      parser={{
        toInput: v => v ?? { ...currentTz },
        toValue(v) {
          v.offset ??= currentTz.offset
          v.zone ||= currentTz.zone
          v.locale ||= currentTz.locale
          return v
        },
      }}
    >{(mode) =>
      <ConfigItemY
        label={t('item.title.timezone')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.timezone')}</Markdown>} />}
      >
        <Select<OptionType>
          className={dotStyles.base}
          options={options}
          value={mode.input.key || mode.type}
          onChange={(v) => {
            if (v === HookType.default || v === HookType.value) {
              mode.setType(v);
              mode.setInput({ ...currentTz });
            } else {
              const tz = findTzByKey(v as string);
              mode.setType(HookType.value);
              if (tz) {
                const { title, ...rest } = tz
                mode.setInput(rest);
              } else {
                mode.setInput({ ...currentTz });
              }
            }
          }}
        />
        {mode.isValue && <>
          <Form.Item label={t('item.sub.tz.offset')}>
            <InputNumber
              disabled={!!mode.input.key}
              min={-12} max={12}
              value={mode.input.offset}
              onChange={(offset) => mode.setInput({ ...mode.input, offset: offset ?? currentTz.offset })}
            />
          </Form.Item>
          <Form.Item label={t('item.sub.tz.locale')}>
            <Input
              disabled={!!mode.input.key}
              value={mode.input.locale}
              onChange={({ target }) => mode.setInput({ ...mode.input, locale: target.value })}
            />
          </Form.Item>
          <Form.Item label={t('item.sub.tz.zone')}>
            <Input
              disabled={!!mode.input.key}
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