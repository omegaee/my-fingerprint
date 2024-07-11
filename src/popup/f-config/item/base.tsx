import { Select, Tooltip, Typography } from "antd"
import type { SelectProps } from "antd"

import {
  AlertOutlined,
} from '@ant-design/icons';

export type FConfigBaseItemProps<T=any> = {
  title: string
  desc?: string
  suffixNode?: React.ReactNode 
  options?: SelectProps['options']
  defaultValue?: SelectProps['defaultValue']
  onChangeOption?: (opt: T) => void
}

export const FConfigBaseItem = function<T=any> (props: FConfigBaseItemProps<T>) {
  return <section
    className="flex flex-col gap-2 p-1 hover:bg-[#cffafe77]">
    <Typography.Text className="flex items-center justify-between">
      <span>{props.title}</span>
      <Tooltip arrow placement='left' title={props.desc}>
        <AlertOutlined className="hover:text-red-500" />
      </Tooltip>
    </Typography.Text>
    <Select<T>
      onChange={props.onChangeOption}
      defaultValue={props.defaultValue}
      options={props.options}
    />
    {props.suffixNode}
  </section>
}
export default FConfigBaseItem