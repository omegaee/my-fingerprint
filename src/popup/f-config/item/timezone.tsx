import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { msgSetConfig } from "@/message/runtime"
import { HookType } from "@/types/enum" 
import FConfigItem from "./base"

const getTimezones = () => {
  return [
    {
      text: 'SH',
      zone: 'Asia/Shanghai',
      locale: 'zh-CN',
      offset: +8
    },{
      text: 'NY',
      zone: 'America/New_York',
      locale: 'en-US',
      offset: -5
    },{
      text: 'LG',
      zone: 'Europe/London',
      locale: 'en-GB',
      offset: 0
    },{
      text: 'PAR',
      zone: 'Europe/Paris',
      locale: 'fr-FR',
      offset: +1
    },{
      text: 'TY',
      zone: 'Asia/Tokyo',
      locale: 'ja-JP',
      offset: +9
    },{
      text: 'DXB',
      zone: 'Asia/Dubai',
      locale: 'ar-AE',
      offset: +4
    },{
      text: 'SE',
      zone: 'Asia/Seoul',
      locale: 'ko-KR',
      offset: +9
    },{
      text: 'BKK',
      zone: 'Asia/Bangkok',
      locale: 'th-TH',
      offset: +7
    },{
      text: 'JKT',
      zone: 'Asia/Jakarta',
      locale: 'id-ID',
      offset: +7
    },
  ]
}

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
    for(const tz of getTimezones()){
      tz.text = t('city.'+tz.text)
      map.set(tz.zone, tz)
    }
    return map
  }, [])

  const getOptions = () => {
    const preset = {value: DEFAULT_VALUE, label: t('type.default')}
    const timezoneOptions = Array.from(timezones.entries()).map(([key, info]) => ({value: key, label: `${info.text} (${info.offset})`}))
    return [preset, ...timezoneOptions]
  }

  const onChangeOption = (opt: string) => {
    let timezone: ValueHookMode<TimeZoneInfo> | DefaultHookMode
    if(opt === DEFAULT_VALUE){
      timezone = {type: HookType.default}
    }else{
      const value = timezones.get(opt)
      if(!value) return
      timezone = {type: HookType.value, value}
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