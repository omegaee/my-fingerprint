import { useDebounceCallback } from "@/utils/hooks"
import { Button, Input, Popconfirm, Space, theme } from "antd"
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
import { existParentDomain, existChildDomain } from "@/utils/base";

export type WhitelistProps = {
  msgApi?: MessageInstance
}

export const WhitelistView = (props: WhitelistProps) => {
  const [t] = useTranslation()
  const [filteredWhitelist, setFilteredWhitelist] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const [confirmContent, setConfirmContent] = useState<string>()

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

  const addItemHelper = () => {
    if (!whitelist) return;
    try {
      const url = new URL(`http://${addValue}`)
      if (whitelist.includes(url.hostname)) {
        /* 域名重复 */
        props.msgApi?.error(t('tip.err.domain-exist'))
      } else if (existParentDomain(whitelist, url.hostname)) {
        /* 存在父域名 */
        props.msgApi?.error(t('tip.err.parent-domain-exist'))
      } else if (existChildDomain(whitelist, url.hostname)) {
        /* 子域名存在 */
        setConfirmContent(url.hostname)
      } else {
        /* 直接添加 */
        addItem(url.hostname)
      }
    } catch (err) {
      props.msgApi?.error(t('tip.err.input-hostname'))
    }
  }

  const addItem = (item: string) => {
    if (!whitelist) return;
    addWhitelist(item)
    setAddValue('')
  }

  const deleteItem = (item: string) => {
    if (!whitelist) return;
    deleteWhitelist(item)
  }

  return <section className="h-full flex flex-col rounded" style={{
    backgroundColor: token.colorBgContainer,
  }}>
    <Input suffix={<SearchOutlined />}
      placeholder="example.com"
      onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
    <section className="overflow-y-auto no-scrollbar grow flex flex-col">
      {filteredWhitelist.map((item) => <WhitelistItem key={item} item={item} filterValue={filterValue} onDelete={deleteItem} />)}
    </section>
    <Space.Compact>
      <Input value={addValue} placeholder="example.com"
        onChange={({ target }) => setAddValue(target.value)}
        onKeyDown={({ key }) => key === 'Enter' && addItemHelper()} />
      <Popconfirm
        disabled={!confirmContent}
        title={t('tip.if.remove-child-domain')}
        placement='topRight'
        open={!!confirmContent}
        onOpenChange={(open) => !open && setConfirmContent(undefined)}
        onConfirm={() => {
          if (!confirmContent) return;
          addItem(confirmContent)
          setConfirmContent(undefined)
        }}
        onCancel={() => setConfirmContent(undefined)}
        okText={t('g.confirm')}
        cancelText={t('g.cancel')}
        okType='danger' >
        <Button icon={<PlusOutlined />}
          disabled={!addValue} onClick={!confirmContent ? addItemHelper : undefined} />
      </Popconfirm>
    </Space.Compact>
  </section>
}

export default WhitelistView
