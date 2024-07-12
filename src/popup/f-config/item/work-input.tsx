import FConfigItem from "./base"
import { msgSetConfig } from "@/message/runtime"
import { useDebounceCallback } from "@/utils/hooks"

export type FWorkInputItemProps = {
  title: string
  keyPrefix: keyof LocalStorageConfig
  desc?: string
  value?: string | number
}

export const FWorkInputItem = function (props: FWorkInputItemProps) {
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
export default FWorkInputItem