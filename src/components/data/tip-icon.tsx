import { Popover, type PopoverProps } from "antd"
import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

type TipIconType = 'primary' | 'info' | 'success' | 'warning' | 'error'

const ICON_CLASS_NAMES: { [key in TipIconType]: string } = {
  primary: "text-[--ant-color-primary-text] hover:text-[--ant-color-primary-hover] duration-200",
  info: "text-[--ant-color-info-text] hover:text-[--ant-color-info-hover] duration-200",
  success: "text-[--ant-color-success-text] hover:text-[--ant-color-success-hover] duration-200",
  warning: "text-[--ant-color-warning-text] hover:text-[--ant-color-warning-hover] duration-200",
  error: "text-[--ant-color-error-text] hover:text-[--ant-color-error-hover] duration-200",
}

export type TipIconProps = {
  Icon: React.ElementType
  type?: TipIconType
  iconClassName?: string
  iconStyle?: React.CSSProperties
} & PopoverProps

export const TipIcon = ({ Icon, type, iconClassName, iconStyle, ...props }: TipIconProps) => {
  return <Popover {...props}>
    <Icon className={type ? ICON_CLASS_NAMES[type] : iconClassName} style={iconStyle} />
  </Popover>
}

TipIcon.Question = ({ content, ...props }: Omit<TipIconProps, 'Icon'>) => {
  return <TipIcon type='info' Icon={QuestionCircleOutlined} content={content} {...props} />
}

export default TipIcon