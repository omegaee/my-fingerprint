import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import { Typography } from "antd"
import ConfigItem from "../base"
import TipIcon from "@/components/data/tip-icon"
import {
  WarningOutlined,
} from '@ant-design/icons';
import Markdown from "react-markdown"

export type SelectFpConfigItemProps = {
  title: string
  desc?: string

  defaultValue?: HookType
  options: (HookType | undefined)[]
  deprecatedOptions?: {
    option: HookType,
    reason: string
  }[]
  custom?: ReactNode

  onChange?: (value: HookType) => void
}

export const SelectFpConfigItem = ({ title, desc, defaultValue, options, deprecatedOptions, custom, onChange }: SelectFpConfigItemProps) => {
  const [t, i18n] = useTranslation()
  const [isCustom, setIsCustom] = useState(false)
  const [option, setOption] = useState<HookType>(defaultValue ?? HookType.default)

  useEffect(() => {
    setIsCustom(defaultValue === HookType.value)
  }, [defaultValue])

  const onChangeOption = useCallback((opt: HookType) => {
    setOption(opt)
    setIsCustom(opt === HookType.value)
    onChange?.(opt)
  }, [onChange])

  const deprecatedMap = useMemo(() => {
    return deprecatedOptions?.reduce<{ [type in HookType]?: string }>((res, value) => {
      res[value.option] = value.reason
      return res
    }, {}) ?? {}
  }, [deprecatedOptions])

  const finalOptions = useMemo(() => {
    const presetList = options.filter((v) => v !== undefined).map((opt) => ({
      value: opt,
      label: deprecatedMap?.[opt] !== undefined ?
        <Typography.Text type='secondary' delete>{t('type.' + HookType[opt])}</Typography.Text> :
        t('type.' + HookType[opt]),
    }))
    const otherList = [
      custom ? {
        value: HookType.value,
        label: t('type.' + HookType[HookType.value]),
      } : undefined,
    ].filter((v) => !!v)

    const res = []
    presetList.length > 0 && res.push({
      label: <span>{t('g.preset')}</span>,
      title: 'preset',
      options: presetList,
    })
    otherList.length > 0 && res.push({
      label: <span>{t('g.custom')}</span>,
      title: 'custom',
      options: otherList,
    })
    return res
  }, [i18n.language, options])

  return <ConfigItem.Select<HookType>
    title={title}
    options={finalOptions}
    defaultValue={option}
    onChange={onChangeOption}
    node={isCustom && custom}
    action={<div className="flex gap-2">
      {deprecatedMap[option] !== undefined && <TipIcon Icon={WarningOutlined} type='warning' content={deprecatedMap[option]} />}
      <TipIcon.Question content={<Markdown>{desc}</Markdown>} />
    </div>} />
}

export default SelectFpConfigItem