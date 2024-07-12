import { msgSetConfig } from "@/message/runtime"
import { useDebounceCallback } from "@/utils/hooks"
import FConfigItem from "./base"

/// **********
/// Input
/// **********

export type FWorkInputItemProps = {
  title: string
  keyPrefix: keyof LocalStorageConfig
  desc?: string
  value?: string | number
}

const FWorkInputItem = function (props: FWorkInputItemProps) {
  const onInput = useDebounceCallback((value: string) => {
    msgSetConfig({
      [props.keyPrefix]: value
    })
  })
 
  return <FConfigItem.Input 
    title={props.title}
    desc={props.desc}
    defaultValue={props.value}
    onInput={onInput} />
}


/// **********
/// Switch
/// **********

export type FWorkSwitchItemProps = {
  title: string
  keyPrefix: keyof LocalStorageConfig
  desc?: string
  value?: boolean
}

export const FWorkSwitchItem = function (props: FWorkSwitchItemProps) {
  return <FConfigItem.Switch 
    title={props.title}
    desc={props.desc}
    checked={props.value}
    onChange={(value: boolean) => {
      msgSetConfig({
        [props.keyPrefix]: value
      })
    }} />
}

export const FWorkItem = {
  Input: FWorkInputItem,
  Switch: FWorkSwitchItem,
}

export default FWorkItem