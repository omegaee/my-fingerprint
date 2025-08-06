import { Popover, type PopoverProps } from "antd"
import {
  QuestionOutlined,
} from '@ant-design/icons';

export type TipIconProps = {
  icon?: React.ReactNode
  className?: string
  style?: React.CSSProperties
} & PopoverProps

export const TipIcon = ({ icon, className, style, ...props }: TipIconProps) => {
  return <Popover {...props}>
    <div className={'size-[22px] flex justify-center items-center rounded duration-300 bg-[--ant-color-bg-text-hover] hover:bg-[--ant-color-bg-text-active] text-[--ant-color-text-secondary] hover:text-[--ant-color-text] ' + (className ?? '')} style={style}>{icon}</div>
  </Popover>
}

TipIcon.Question = ({ content, ...props }: Omit<TipIconProps, 'icon'>) => {
  return <TipIcon icon={<QuestionOutlined />} content={content} {...props} />
}

export default TipIcon