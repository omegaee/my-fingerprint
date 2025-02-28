import { useDebounceCallback } from "@/utils/hooks"
import { Form, Input, InputNumber, InputNumberProps, InputProps } from "antd"
import { useCallback, useEffect, useState, type ReactNode } from "react"

export type InputLineProps = {
  name?: InputProps['name']
  label?: ReactNode
  defaultValue?: string | number
  initialValue?: string | number
  onDebouncedInput?: (value: string) => void
} & InputProps

export const InputLine = ({ name, label, defaultValue, initialValue, onDebouncedInput, ...props }: InputLineProps) => {
  const [value, setValue] = useState<string>(String(initialValue ?? defaultValue ?? ''))

  const onInput = useDebounceCallback((text: string) => {
    const _value = text.trim()
    onDebouncedInput?.(_value ? _value : String(defaultValue))
  }, 200, [onDebouncedInput])

  const onBlur = useCallback((text: string) => {
    if (defaultValue !== undefined && !text.trim()) {
      const _value = String(defaultValue)
      onDebouncedInput?.(_value)
      setValue(_value)
    }
  }, [onDebouncedInput])

  useEffect(() => {
    if (!value.trim()) return;
    onInput(value)
  }, [value])

  return <Form.Item name={name} label={label} className="mb-0 [&_.ant-form-item-label.ant-col]:p-0">
    <Input {...props}
      value={value}
      defaultValue={initialValue}
      placeholder={String(defaultValue)}
      onChange={({ target }) => setValue(target.value)}
      onInput={({ target }: any) => onInput(target.value)}
      onBlur={({ target }: any) => onBlur(target.value)}
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

  const onBlur = useCallback((text: string) => {
    if (defaultValue !== undefined && !text) {
      const vl = Number(defaultValue)
      setValue(vl)
      onDebouncedInput?.(vl)
    }
  }, [onDebouncedInput])

  useEffect(() => {
    onInput(value)
  }, [value])

  return <Form.Item name={name} label={label} className="mb-0 [&_.ant-form-item-label.ant-col]:p-0">
    <InputNumber {...props}
      value={value}
      defaultValue={initialValue}
      placeholder={String(defaultValue)}
      onChange={(value) => {
        setValue(value ?? '')
        onInput(value ?? '')
      }}
      onBlur={({ target }: any) => onBlur(target.value)}
    />
  </Form.Item>
}
