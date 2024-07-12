import { Input, Select, type SelectProps, Switch, Tooltip, Typography } from "antd"
import {
  AlertOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from "react";

export type FConfigItemProps = {
  title: string
  desc?: string
  node?: React.ReactNode
  lineType?: 'single' | 'multiple'
}

export const FConfigItem = function (props: FConfigItemProps) {
  switch (props.lineType) {
    case 'single': {
      return <section className="p-1 flex gap-2 justify-between hover:bg-[#cffafe77]">
        <Typography.Text>{props.title}</Typography.Text>
        <section className="flex items-center gap-3">
          <Tooltip arrow placement='left' title={props.desc}>
            <AlertOutlined className="hover:text-red-500" />
          </Tooltip>
          {props.node}
        </section>
      </section>
    }
    case 'multiple':
    default: {
      return <section className="flex flex-col gap-2 p-1 hover:bg-[#cffafe77]">
        <Typography.Text className="flex items-center justify-between">
          <span>{props.title}</span>
          <Tooltip arrow placement='left' title={props.desc}>
            <AlertOutlined className="hover:text-red-500" />
          </Tooltip>
        </Typography.Text>
        {props.node}
      </section>
    }
  }
}

export default FConfigItem


/// **********
/// Select
/// **********

export type FConfigSelectItemProps<T = any> = FConfigItemProps & {
  options?: SelectProps['options']
  defaultValue?: SelectProps['defaultValue']
  onChangeOption?: (opt: T) => void
}

FConfigItem.Select = function <T = any>(props: FConfigSelectItemProps<T>) {
  return <>
    <FConfigItem {...props} node={<Select<T>
      onChange={props.onChangeOption}
      defaultValue={props.defaultValue}
      options={props.options}
    />} />
    {props.node}
  </>
}


/// **********
/// Input
/// **********

export type FConfigInputItemProps = FConfigItemProps & {
  defaultValue?: string | number
  onInput?: (value: string) => void
}

FConfigItem.Input = (props: FConfigInputItemProps) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (typeof (props.defaultValue) === 'number') {
      setValue(String(props.defaultValue))
    } else {
      setValue(props.defaultValue ?? '')
    }
  }, [props.defaultValue])

  return <>
    <FConfigItem {...props} node={<Input
      value={value}
      onInput={({ target }: any) => {
        setValue(target.value)
        props.onInput?.(target.value)
      }} />} />
    {props.node}
  </>
}

/// **********
/// Switch
/// **********

export type FConfigSwitchItemProps = FConfigItemProps & {
  checked?: boolean
  onChange?: (value: boolean) => void
}

FConfigItem.Switch = (props: FConfigSwitchItemProps) => {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setChecked(props.checked ?? false)
  }, [])

  return <FConfigItem {...props} lineType='single' node={<Switch
    checked={checked}
    onChange={(value) => {
      setChecked(value)
      props.onChange?.(value)
    }} />} />
}
