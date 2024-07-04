import { arrayFilter } from "@/utils/base"
import { Input, Select, Tooltip, Typography } from "antd"
import type { SelectProps } from "antd"
import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"

import {
  AlertOutlined,
} from '@ant-design/icons';

import { HookType } from '@/types/enum'
import { msgSetConfig } from "@/message/runtime"
import { useDebounceCallback } from "@/utils/hooks"

type FItemPrefix = keyof HookFingerprint

export type FConfigItemProps = {
  title: string
  prefix: FItemPrefix
  keys: HookFingerprintKey[]
  values?: (HookMode | undefined)[]
  desc?: string
  types?: HookType[]
  // defaultType?: HookType
}

export const FConfigItem = function (props: FConfigItemProps) {
  const [t] = useTranslation()
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    if(props.values){
      props.values.filter((value) => value?.type === HookType.value).length > 0 && setShowInput(true)
    }
  }, [props.values])

  const getOption = (type: HookType) => {
    if (!props.types?.includes(type)) return
    return { label: t('type.' + HookType[type]), value: type }
  }

  const options = useMemo<SelectProps['options']>(() => {
    if (!props.types?.length) return []
    const presetArr = arrayFilter([
      getOption(HookType.default),
      getOption(HookType.page),
      getOption(HookType.browser),
      getOption(HookType.domain),
      getOption(HookType.seed),
    ])
    const customArr = arrayFilter([
      getOption(HookType.value),
    ])

    return arrayFilter([
      presetArr.length > 0 && {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: presetArr,
      },
      customArr.length > 0 && props.types?.includes(HookType.value) && {
        label: <span>{t('g.custom')}</span>,
        title: 'custom',
        options: customArr,
      },
    ])
  }, [props.types])

  const onChangeSelect = (opt: HookType) => {
    const isValueType = opt === HookType.value
    setShowInput(isValueType)
    if(!isValueType){
      // props.keys.reduce<DeepPartial<HookFingerprint>>((prev, key) => {
      //   prev[props.prefix]
      //   return prev['navigator'] = {}
      // }, {})
      msgSetConfig({
        fingerprint: {
          [props.prefix]: {
            ...props.keys.reduce((prev, key) => ({ ...prev, [key]: { type: opt }}), {})
          }
        }
      })
    }
  }

  const onChangeInput = useDebounceCallback((prefix: FItemPrefix, key: HookFingerprintKey, value: string) => {
    msgSetConfig({
      fingerprint: {
        [prefix]: {
          [key]: {type: HookType.value, value}
        }
      }
    })
  })

  return <section
    className="flex flex-col gap-2 p-1 hover:bg-[#cffafe77]">
    <Typography.Text className="flex items-center justify-between">
      <span>{props.title}</span>
      <Tooltip arrow placement='left' title={props.desc}>
        <AlertOutlined className="hover:text-red-500" />
      </Tooltip>
    </Typography.Text>
    <Select
      onChange={onChangeSelect}
      defaultValue={props.values?.[0]?.type ?? HookType.default}
      options={options}
    />
    {showInput &&
      props.keys.map((opt, index) => <section key={opt} className="flex items-center gap-2">
        <Typography.Text className="whitespace-nowrap">{opt}</Typography.Text>
        <Input defaultValue={(props.values?.[index] as ValueHookMode)?.value} className="grow" onInput={({target}: any) => onChangeInput(props.prefix, opt, target.value)} />
      </section>)
    }
  </section>
}
export default FConfigItem