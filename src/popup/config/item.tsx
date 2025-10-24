import { Md } from "@/components/data/markdown"
import { useHookMode, useHookTypeOptions } from "@/utils/hooks"
import { Divider, Select, Tag, type SelectProps } from "antd"
import { tagColors } from "./styles"
import { useTranslation } from "react-i18next"

type ConfigItemXProps = {
  children: React.ReactNode
  label?: React.ReactNode
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

export const ConfigItemX = ({ children, label, startContent, endContent }: ConfigItemXProps) => {
  return <div className="py-2 px-1 mb-1 last:mb-0 flex gap-2 items-center justify-between rounded duration-200">
    <div className="flex items-center gap-3">
      {label}
      {startContent}
    </div>
    <div className="flex items-center gap-3 [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:p-0">
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
  className?: string
}

export const ConfigItemY = ({ children, label, startContent, endContent, className }: ConfigItemYProps) => {
  return <div className={"mb-1 last:mb-0 flex flex-col gap-2 p-1 rounded duration-200 [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:p-0 " + (className ?? "")}>
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
  </div>
}

/**
 * 配置描述
 */
export const ConfigDesc = ({ desc, tags }: {
  tags?: string[]
  desc: string
}) => {
  const [t] = useTranslation()
  return <>
    {tags?.length && <>
      <div className="flex items-center justify-center gap-2">
        {tags.map(tag => <Tag key={tag}
          className="mr-0"
          bordered={false}
          color={(tagColors as any)[tag]}>
          {t('tag.' + tag)}
        </Tag>)}
      </div>
      <Divider rootClassName="my-1" />
    </>}
    <Md>{desc}</Md>
  </>
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
  selectClassName?: string
  children: (
    mode: ReturnType<typeof useHookMode<V, I>>,
    params: {
      options: SelectProps['options']
      select: React.ReactNode
    }
  ) => React.ReactNode
}

export const HookModeContent = <V, I,>({ mode, parser, types, isMakeSelect = true, selectClassName, children }: HookModeItemProps<V, I>) => {
  const hookMode = useHookMode<V, I>(mode, parser)
  const options = useHookTypeOptions(types ?? [])

  const select = isMakeSelect && <Select<HookType>
    className={selectClassName}
    options={options}
    value={hookMode.type}
    onChange={hookMode.setType}
  />

  return <>{children(hookMode, { options, select })}</>
}