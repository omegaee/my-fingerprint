import { Highlight } from '@/components/data/highlight'
import { Button, theme } from "antd"
import {
  DeleteOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

export type WhitelistItemProps = {
  item: string
  filterValue: string
  onDelete?: (item: string) => void
}

export const WhitelistItem = ({ item, filterValue, onDelete }: WhitelistItemProps) => {
  const [active, setActive] = useState(false)
  const { token } = theme.useToken()

  return <section className='px-2 py-1 h-6 flex justify-between items-center border-solid border-b'
    style={{
      backgroundColor: active ? token.colorFillQuaternary : undefined,
      borderColor: token.colorBorderSecondary,
    }}
    onMouseEnter={() => setActive(true)}
    onMouseLeave={() => setActive(false)}>
    <Highlight className='font-mono' text={item} keyword={filterValue} ignoreCase />
    {active && <Button className='float-end' type='text' size='small' danger icon={<DeleteOutlined />} onClick={() => onDelete?.(item)} />}
  </section>
}

export default WhitelistItem