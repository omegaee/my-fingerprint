import { useDebounceCallback } from "@/utils/hooks"
import { Button, Input, Space, theme } from "antd"
import { useEffect, useState } from "react"

import {
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { msgAddWhiteList, msgDelWhiteList } from "@/message/runtime";
import WhitelistItem from "./item";
import { type MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";

export type WhitelistProps = {
  msgApi?: MessageInstance
}

export const WhitelistView = (props: WhitelistProps) => {
  const [t] = useTranslation()
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [filteredWhitelist, setFilteredWhitelist] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const debounceSetFilterValue = useDebounceCallback((value: string) => {
    setFilterValue(value.trim())
  })
  const { token } = theme.useToken()


  useEffect(() => {
    chrome.storage.local.get('whitelist').then(({whitelist}: Partial<LocalStorage>) => {
      setWhitelist(whitelist ?? [])
    })
  }, [])

  useEffect(() => {
    setFilteredWhitelist(whitelist?.filter((item) => item.includes(filterValue)))
  }, [whitelist, filterValue])

  const addItem = () => {
    const part = addValue.split(':')
    const hostname = part[0]?.trim()
    const port = part[1]?.trim()
    if(!hostname || !hostname.includes('.')){
      props.msgApi?.error(t('tip.err.input-hostname'))
      return
    }

    if(port){
      const nPort = Number(port)
      if(!Number.isInteger(nPort) || nPort <= 0 || nPort > 65535){
        props.msgApi?.error(t('tip.err.input-port'))
        return
      }
      const host = `${hostname}:${port}`
      msgAddWhiteList(host)
      setWhitelist([...whitelist, host])
      setAddValue('')
    }else{
      const host = [hostname + ':80', hostname + ':443']
      msgAddWhiteList(host)
      setWhitelist([...whitelist, ...host])
      setAddValue('')
    }
  }

  const deleteItem = (item: string) => {
    msgDelWhiteList(item)
    setWhitelist(whitelist.filter((value) => value !== item))
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
        onChange={({target}) => setAddValue(target.value)}
        onKeyDown={({key}) => key === 'Enter' && addItem()} />
      <Button icon={<PlusOutlined />} 
        disabled={!addValue} onClick={addItem} />
    </Space.Compact>
  </section>
}

export default WhitelistView
