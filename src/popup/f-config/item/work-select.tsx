import { arrayFilter } from "@/utils/base"
import { Input, Typography } from "antd"
import type { SelectProps } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import { msgSetConfig } from "@/message/runtime"
import { useDebounceCallback } from "@/utils/hooks"
import FConfigItem from "./base"

type FItemPrefix = keyof HookFingerprint

export type FWorkSelectItemProps = {
  title: string
  keys: HookFingerprintKey[]
  keyPrefix: FItemPrefix[]
  values?: (HookMode | undefined)[]
  desc?: string
  types?: HookType[]
}

export const FWorkSelectItem = function (props: FWorkSelectItemProps) {
  const [t] = useTranslation()
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    if (props.values) {
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
    if(props.keys.length !== props.keyPrefix.length) return
    const isValueType = opt === HookType.value
    setShowInput(isValueType)
    if (!isValueType) {
      const fingerprint: DeepPartial<HookFingerprint> = {}
      for (let i = 0; i < props.keys.length; i++) {
        const prefix = props.keyPrefix[i]
        fingerprint[prefix] = {...fingerprint[prefix], [props.keys[i]]: { type: opt }}
      }
      msgSetConfig({ fingerprint })
    }
  }

  const onChangeInput = useDebounceCallback((prefix: FItemPrefix, key: HookFingerprintKey, value: string) => {
    msgSetConfig({
      fingerprint: {
        [prefix]: {
          [key]: { type: HookType.value, value }
        }
      }
    })
  })

  return <FConfigItem.Select<HookType>
    title={props.title}
    desc={props.desc}
    options={options}
    defaultValue={props.values?.[0]?.type ?? HookType.default}
    onChangeOption={onChangeSelect}
    node={showInput &&
      props.keys.map((opt, index) => <section key={opt} className="flex items-center gap-2">
        <Typography.Text className="whitespace-nowrap">{opt}</Typography.Text>
        <Input defaultValue={(props.values?.[index] as ValueHookMode)?.value} className="grow" onInput={({ target }: any) => onChangeInput(props.keyPrefix[index], opt, target.value)} />
      </section>)} />
}
export default FWorkSelectItem