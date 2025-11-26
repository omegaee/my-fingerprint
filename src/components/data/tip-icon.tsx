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
  icon?: React.ReactNode
  color?: Color
  className?: string
  style?: React.CSSProperties
} & PopoverProps

export const TipIcon = ({ icon, color = 'default', className, style, ...props }: TipIconProps) => {
  return <Popover rootClassName="[&_.ant-popover-inner]:p-2" {...props}>
    <div
      className={cn(
        'size-[22px] flex justify-center items-center rounded duration-300 text-default-600 hover:text-default-900',
        // 'bg-[--ant-color-bg-text-hover] hover:bg-[--ant-color-bg-text-active] text-[--ant-color-text-secondary] hover:text-[--ant-color-text]',
        triggerColor[color],
        className
      )}
      style={style}>{icon}</div>
  </Popover>
}

TipIcon.Question = ({ content, ...props }: Omit<TipIconProps, 'icon'>) => {
  return <TipIcon icon={<QuestionOutlined />} content={content} {...props} />
}

export default TipIcon