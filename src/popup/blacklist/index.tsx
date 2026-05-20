import { useDebounceCallback } from "@/utils/hooks"
import { Button, Input, Popconfirm, Space, theme } from "antd"
import { useEffect, useState } from "react"
import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import WhitelistItem from "../whitelist/item";
import { type MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import { useStorageStore } from "../stores/storage";
import { useShallow } from "zustand/shallow";
import { existParentDomain, existChildDomain } from "@/utils/base";

export type BlacklistProps = {
  msgApi?: MessageInstance
}

export const BlacklistView = (props: BlacklistProps) => {
  const [t] = useTranslation()
  const [filteredBlacklist, setFilteredBlacklist] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const [confirmContent, setConfirmContent] = useState<string>()

  const debounceSetFilterValue = useDebounceCallback((value: string) => {
    setFilterValue(value.trim())
  })
  const { token } = theme.useToken()

  const { blacklist, addBlacklist, deleteBlacklist, cleanBlacklist } = useStorageStore(useShallow((state) => ({
    blacklist: state.blacklist,
    addBlacklist: state.addBlacklist,
    deleteBlacklist: state.deleteBlacklist,
    cleanBlacklist: state.cleanBlacklist,
  })));

  useEffect(() => {
    setFilteredBlacklist(blacklist?.filter((item) => item.includes(filterValue)) ?? [])
  }, [blacklist, filterValue])

  const addItemHelper = () => {
    if (!blacklist) return;
    try {
      const url = new URL(`http://${addValue}`)
      if (blacklist.includes(url.hostname)) {
        props.msgApi?.error(t('tip.err.domain-exist'))
      } else if (existParentDomain(blacklist, url.hostname)) {
        props.msgApi?.error(t('tip.err.parent-domain-exist'))
      } else if (existChildDomain(blacklist, url.hostname)) {
        setConfirmContent(url.hostname)
      } else {
        addItem(url.hostname)
      }
    } catch (err) {
      props.msgApi?.error(t('tip.err.input-hostname'))
    }
  }

  const addItem = (item: string) => {
    if (!blacklist) return;
    addBlacklist(item)
    setAddValue('')
  }

  const deleteItem = (item: string) => {
    if (!blacklist) return;
    deleteBlacklist(item)
  }

  const cleanItem = () => {
    if (!blacklist) return;
    cleanBlacklist()
  }

  return <section className="h-full flex flex-col rounded" style={{
    backgroundColor: token.colorBgContainer,
  }}>
    <Space.Compact>
      <Input suffix={<SearchOutlined />}
        placeholder="example.com"
        onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
      <Popconfirm title={t('tip.if.clean-whitelist')}
        placement='topLeft'
        okText={t('g.confirm')}
        cancelText={t('g.cancel')}
        okType='danger'
        onConfirm={cleanItem}
        children={<Button icon={<DeleteOutlined />} disabled={blacklist?.length === 0} />}
      />
    </Space.Compact>
    <section className="overflow-y-auto no-scrollbar grow flex flex-col">
      {filteredBlacklist.map((item) => <WhitelistItem key={item} item={item} filterValue={filterValue} onDelete={deleteItem} />)}
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

export default BlacklistView
