import { Popover, type PopoverProps } from "antd"
import {
  QuestionOutlined,
} from '@ant-design/icons';
import { cn } from "@/utils/style";

type Color = 'default' | 'warning' | 'danger'

const triggerColor: Record<Color, string> = {
  default: 'bg-default-100 hover:bg-default-200',
  warning: 'bg-warning-50 hover:bg-warning-100',
  danger: 'bg-danger-50 hover:bg-danger-100',
}

export type TipIconProps = {
  isIconOnly?: boolean
  color?: Color
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
} & PopoverProps

export const TipIcon = ({ isIconOnly, color = 'default', className, style, children, ...props }: TipIconProps) => {
  return <Popover rootClassName="[&_.ant-popover-inner]:p-2" {...props}>
    <div
      className={cn(
        'flex justify-center items-center rounded duration-300 text-default-600 hover:text-default-900 select-none',
        isIconOnly && 'size-[22px]',
        triggerColor[color],
        className
      )}
      style={style}>{children}</div>
  </Popover>
}

TipIcon.Question = ({ content, ...props }: Omit<TipIconProps, 'icon'>) => {
  return <TipIcon isIconOnly content={content} {...props} ><QuestionOutlined /></TipIcon>
}

export default TipIcon