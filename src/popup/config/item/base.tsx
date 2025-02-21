import { Form, Input, type InputProps, Select, type SelectProps, Switch, SwitchProps, Typography } from "antd"
import { useDebounceCallback } from "@/utils/hooks";
import { useEffect, useState } from "react";

export type ConfigItemProps = {
  title: string
  type?: 'single' | 'multiple'
  node?: React.ReactNode
  action?: React.ReactNode
}

export const ConfigItem = ({ title, type, node, action }: ConfigItemProps) => {
  switch (type) {
    case 'single': {
      return <section className="p-1 mb-1 last:mb-0 flex gap-2 items-center justify-between rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
        <Typography.Text>{title}</Typography.Text>
        <section className="flex items-center gap-3">
          {action}
          {node}
        </section>
      </section>
    }
    case 'multiple':
    default: {
      return <section className="mb-1 last:mb-0 flex flex-col gap-2 p-1 rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
        <section className="flex items-center justify-between">
          <Typography.Text>{title}</Typography.Text>
          {action}
        </section>
        {node}
      </section>
    }
  }
}

ConfigItem.Select = <T,>({ title, type, node, action, ...props }: ConfigItemProps & SelectProps<T>) => {
  return <ConfigItem
    title={title}
    type={type}
    action={action}
    node={<>
      <Form.Item className="mb-0"><Select<T> {...props} /></Form.Item>
      {node}
    </>} />
}

ConfigItem.Input = ({
  title, type, node, action, currentValue, onDebouncedInput,
  ...props
}: ConfigItemProps & InputProps & {
  currentValue?: string
  onDebouncedInput?: (value: string) => void
}) => {
  const [value, setValue] = useState(currentValue ?? '')
  const onInput = useDebounceCallback(({ target }: any) => {
    onDebouncedInput?.(target.value)
  }, 200, [onDebouncedInput])

  useEffect(() => {
    setValue(currentValue ?? '')
  }, [currentValue])

  return <ConfigItem
    title={title}
    type={type}
    action={action}
    node={<>
      <Form.Item className="mb-0">
        <Input {...props} value={value} onInput={(...args) => {
          setValue((args[0] as any).target.value)
          props.onInput?.(...args)
          onDebouncedInput && onInput(...args)
        }} />
      </Form.Item>
      {node}
    </>} />
}

ConfigItem.Switch = ({ title, type = "single", node, action, currentValue, ...props }: ConfigItemProps & SwitchProps & {
  currentValue?: boolean
}) => {
  const [checked, setChecked] = useState(currentValue ?? false)

  useEffect(() => {
    setChecked(currentValue ?? false)
  }, [currentValue])

  return <ConfigItem
    title={title}
    type={type}
    action={action}
    node={<>
      <Form.Item className="mb-0"><Switch {...props} checked={checked} onChange={(...args) => {
        setChecked(args[0] as boolean)
        props.onChange?.(...args)
      }} /></Form.Item>
      {node}
    </>} />
}

export default ConfigItem