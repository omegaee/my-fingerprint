import { useDebounceCallback } from "@/utils/hooks"
import { Button, Input, Space, theme } from "antd"
import { useEffect, useState } from "react"

import {
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import WhitelistItem from "./item";
import { type MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import { useStorageStore } from "../stores/storage";
import { useShallow } from "zustand/shallow";

export type WhitelistProps = {
  msgApi?: MessageInstance
}

export const WhitelistView = (props: WhitelistProps) => {
  const [t] = useTranslation()
  const [filteredWhitelist, setFilteredWhitelist] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const debounceSetFilterValue = useDebounceCallback((value: string) => {
    setFilterValue(value.trim())
  })
  const { token } = theme.useToken()

  const { whitelist, addWhitelist, deleteWhitelist } = useStorageStore(useShallow((state) => ({
    whitelist: state.whitelist,
    addWhitelist: state.addWhitelist,
    deleteWhitelist: state.deleteWhitelist,
  })))

  useEffect(() => {
    setFilteredWhitelist(whitelist?.filter((item) => item.includes(filterValue)) ?? [])
  }, [whitelist, filterValue])

  const addItem = () => {
    if (!whitelist) return;
    try {
      const url = new URL(`http://${addValue}`)
      if (whitelist.includes(url.hostname)) {
        props.msgApi?.error(t('tip.err.host-exist'))
        return
      }
      addWhitelist(url.hostname)
      setAddValue('')
    } catch (err) {
      props.msgApi?.error(t('tip.err.input-hostname'))
    }
  }

  const deleteItem = (item: string) => {
    if (!whitelist) return;
    deleteWhitelist(item)
  }

  return <section className="h-full flex flex-col rounded" style={{
    backgroundColor: token.colorBgContainer,
  }}>
    <Input suffix={<SearchOutlined />}
      placeholder="hostname"
      onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
    <section className="overflow-y-auto no-scrollbar grow flex flex-col">
      {filteredWhitelist.map((item) => <WhitelistItem key={item} item={item} filterValue={filterValue} onDelete={deleteItem} />)}
    </section>
    <Space.Compact>
      <Input value={addValue} placeholder="hostname"
        onChange={({ target }) => setAddValue(target.value)}
        onKeyDown={({ key }) => key === 'Enter' && addItem()} />
      <Button icon={<PlusOutlined />}
        disabled={!addValue} onClick={addItem} />
    </Space.Compact>
  </section>
}

export default WhitelistView
