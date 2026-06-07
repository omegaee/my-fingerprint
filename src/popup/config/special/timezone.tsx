import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { Form, Input, Select } from "antd"
import { selectStatusDotStyles as dotStyles } from "../styles"
import { sharedAsync } from "@/utils/timer"
import { LocalApi, type TimeZoneOption } from "@/api/local"
import { useI18n } from "@/utils/hooks"
import { useHookMode } from "../context"
import { HookModeCustom } from "../ui"
import { isCurrentlyDST, longOffsetToReadable, timeZoneToLongOffset } from "@/utils/timezone"

type OptionType = (string & {}) | HookType

const fetchTimezones = sharedAsync(LocalApi.timezone)

const TimeZoneConfigItem = ({ }: {}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<TimeZoneOption[]>([])
  const [isInvalid, setIsInvalid] = useState(false)

  const { mode, value: modeValue = {}, version, setType, setValue } = useHookMode()

  const currentTz = useMemo<TimeZoneInfo>(() => ({
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }), [])

  useEffect(() => {
    if (modeValue?.zone) {
      checkTimeZone(modeValue?.zone)
    }
  }, [version])

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
        options: localPreset
          .map((v) => ({
            ...v,
            label: asLang(v.title) ?? '',
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((tz) => {
            const offset = timeZoneToLongOffset(tz.zone)
            const isDST = isCurrentlyDST(tz.zone)
            return {
              value: tz.key,
              label: `${tz.label} (${offset ? longOffsetToReadable(offset) : 'N/A'}${isDST ? `, ${t('label.timezone.daylight')}` : ''})`,
            }
          }),
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

  const checkTimeZone = (zone: string) => {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: zone })
      setIsInvalid(false)
    } catch (e) {
      setIsInvalid(true)
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
      <Form.Item label={t('item.sub.tz.zone')}>
        <Input
          status={isInvalid ? 'error' : undefined}
          placeholder={currentTz.zone}
          value={modeValue.zone ?? currentTz.zone}
          onChange={({ target }) => setValue({
            ...modeValue,
            key: undefined,
            zone: target.value || currentTz.zone
          })}
        />
        {isInvalid && <p className="text-danger-500">{t('item.sub.tz.invalid')}</p>}
      </Form.Item>
    </HookModeCustom>
  </>
}

export default TimeZoneConfigItem