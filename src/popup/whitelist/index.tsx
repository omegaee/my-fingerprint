import { useDebounceCallback } from "@/utils/hooks"
import { Highlight } from '@/components/data/highlight'
import { Button, Input, Space } from "antd"
import { useEffect, useState } from "react"

import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { msgAddWhiteList, msgDelWhiteList } from "@/message/runtime";

export type WhitelistProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
}

export const WhitelistView = (props: WhitelistProps) => {
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [filteredWhitelist, setFilteredWhitelist] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const debounceSetFilterValue = useDebounceCallback((value: string) => {
    setFilterValue(value.trim())
  })

  useEffect(() => {
    chrome.storage.local.get('whitelist').then(({whitelist}: Partial<LocalStorage>) => {
      setWhitelist(whitelist ?? [])
    })
  }, [])

  useEffect(() => {
    setFilteredWhitelist(whitelist?.filter((item) => item.includes(filterValue)))
  }, [whitelist, filterValue])

  const addWhitelist = () => {
    const value = addValue.trim()
    if(value){
      msgAddWhiteList(value)
      setWhitelist([...whitelist, value])
      setAddValue('')
    }else{
      setAddValue('')
    }
  }

  const deleteWhitelist = (item: string) => {
    msgDelWhiteList(item)
    setWhitelist(whitelist.filter((item) => item !== item))
  }

  return <section>
    <Input suffix={<SearchOutlined />} 
      onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
    <section className="flex flex-col">
      {filteredWhitelist.map((item) => <section>
        <Highlight key={item} text={item} keyword={filterValue} ignoreCase />
        <Button type='text' icon={<DeleteOutlined />} onClick={() => deleteWhitelist(item)} />
      </section>)}
    </section>
    <Space.Compact>
      <Input value={addValue} onChange={({target}) => setAddValue(target.value)} placeholder="hostname:port" />
      <Button icon={<PlusOutlined />} disabled={!addValue} onClick={addWhitelist} />
    </Space.Compact>
  </section>
}

export default WhitelistView