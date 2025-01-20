import { useDebounceCallback } from "@/utils/hooks"
import { Form, Input, InputNumber, InputNumberProps, InputProps } from "antd"
import { useCallback, useState, type ReactNode } from "react"

export type InputLineProps = {
  name?: InputProps['name']
  label?: ReactNode
  defaultValue?: string | number
  initialValue?: string | number
  onDebouncedInput?: (value: string) => void
} & InputProps

export const InputLine = ({ name, label, defaultValue, initialValue, onDebouncedInput, ...props }: InputLineProps) => {
  const [value, setValue] = useState<string>(String(initialValue))

  const onInput = useDebounceCallback(({ target }: any) => {
    const vl = target.value.trim()
    onDebouncedInput?.(vl ? vl : defaultValue)
  }, 200, [onDebouncedInput])

  const onBlur = useCallback(({ target }: any) => {
    if (defaultValue !== undefined && !target.value.trim()) {
      const vl = String(defaultValue)
      setValue(vl)
      onDebouncedInput?.(vl)
    }
  }, [onDebouncedInput])

  return <Form.Item name={name} label={label} className="mb-0 [&_.ant-form-item-label.ant-col]:p-0">
    <Input {...props}
      value={value}
      defaultValue={initialValue}
      placeholder={String(defaultValue)}
      onChange={({ target }) => setValue(target.value)}
      onInput={onInput}
      onBlur={onBlur}
    />
  </Form.Item>
}


export type InputNumberLineProps = {
  name?: InputProps['name']
  label?: ReactNode
  defaultValue?: number
  initialValue?: number
  onDebouncedInput?: (value: number) => void
} & InputNumberProps

export const InputNumberLine = ({ name, label, defaultValue, initialValue, onDebouncedInput, ...props }: InputNumberLineProps) => {
  const [value, setValue] = useState<number | string>(initialValue ?? '')

  const onInput = useDebounceCallback((text: number | string) => {
    if (!onDebouncedInput) return;
    if (text === '' || isNaN(Number(text))) {
      onDebouncedInput(defaultValue ?? 0)
    } else {
      onDebouncedInput(Number(text) ?? 0)
    }
  }, 200, [onDebouncedInput])

  const onBlur = useCallback(({ target }: any) => {
    if (defaultValue !== undefined && !target.value) {
      const vl = Number(defaultValue)
      setValue(vl)
      onDebouncedInput?.(vl)
    }
  }, [onDebouncedInput])

  return <Form.Item name={name} label={label} className="mb-0 [&_.ant-form-item-label.ant-col]:p-0">
    <InputNumber {...props}
      value={value}
      defaultValue={initialValue}
      placeholder={String(defaultValue)}
      onChange={(value) => {
        setValue(value ?? '')
        onInput(value ?? '')
      }}
      onBlur={onBlur}
    />
  </Form.Item>
}
