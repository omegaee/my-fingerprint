import { useHookMode, useHookTypeOptions } from "@/utils/hooks"
import { Select, type SelectProps } from "antd"

type ConfigItemXProps = {
  children: React.ReactNode
  label?: React.ReactNode
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

export const ConfigItemX = ({ children, label, startContent, endContent }: ConfigItemXProps) => {
  return <div className="py-2 px-1 mb-1 last:mb-0 flex gap-2 items-center justify-between rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
    <div className="flex items-center gap-3">
      {label}
      {startContent}
    </div>
    <div className="flex items-center gap-3">
      {endContent}
      {children}
    </div>
  </div>
}

type ConfigItemYProps = {
  children: React.ReactNode
  label?: React.ReactNode
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  bottomContent?: React.ReactNode
}

export const ConfigItemY = ({ children, label, startContent, endContent, bottomContent }: ConfigItemYProps) => {
  return <div className="mb-1 last:mb-0 flex flex-col gap-2 p-1 rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {label}
        {startContent}
      </div>
      {endContent && <div className="flex items-center gap-3">
        {endContent}
      </div>}
    </div>
    {children}
    {bottomContent}
  </div>
}

/**
 * @param types 选择器可选类型
 * @param isMakeSelect 是否生成选择器
 */
type HookModeItemProps<V, I,> = {
  mode?: HookMode<V>
  parser?: Parameters<typeof useHookMode<V, I>>[1]
  types?: HookType[]
  isMakeSelect?: boolean
  children?: (mode: ReturnType<typeof useHookMode<V, I>>, options: SelectProps['options']) => React.ReactNode
}

export const HookModeItem = <V, I,>({ mode, parser, types, isMakeSelect, children }: HookModeItemProps<V, I>) => {
  const hookMode = useHookMode<V, I>(mode, parser)
  const options = useHookTypeOptions(types ?? [])
  return <>
    {isMakeSelect && <Select<HookType>
      options={options}
      value={hookMode.type}
      onChange={hookMode.setType}
    />}
    {children?.(hookMode, options)}
  </>
}