import FConfigItem from "./base"
import { msgSetConfig } from "@/message/runtime"

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
export default FWorkSwitchItem