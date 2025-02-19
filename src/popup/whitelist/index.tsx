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
    const part = addValue.split(':')
    const hostname = part[0]?.trim()
    const port = part[1]?.trim()
    if (!hostname || !hostname.includes('.')) {
      props.msgApi?.error(t('tip.err.input-hostname'))
      return
    }

    if (port) {
      const nPort = Number(port)
      if (!Number.isInteger(nPort) || nPort <= 0 || nPort > 65535) {
        props.msgApi?.error(t('tip.err.input-port'))
        return
      }
      const host = `${hostname}:${port}`
      addWhitelist(host)
      setAddValue('')
    } else {
      const host = [hostname + ':80', hostname + ':443']
      addWhitelist(host)
      setAddValue('')
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
      placeholder="hostname:port"
      onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
    <section className="overflow-y-auto no-scrollbar grow flex flex-col">
      {filteredWhitelist.map((item) => <WhitelistItem key={item} item={item} filterValue={filterValue} onDelete={deleteItem} />)}
    </section>
    <Space.Compact>
      <Input value={addValue} placeholder="hostname:port"
        onChange={({ target }) => setAddValue(target.value)}
        onKeyDown={({ key }) => key === 'Enter' && addItem()} />
      <Button icon={<PlusOutlined />}
        disabled={!addValue} onClick={addItem} />
    </Space.Compact>
  </section>
}

export default WhitelistView
