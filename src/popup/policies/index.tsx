import { useDebounceCallback } from "@/utils/hooks"
import { Button, Input, Popconfirm, Space } from "antd"
import { useMemo, useState } from "react"
import {
  DeleteOutlined,
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

export const PoliciesView = (props: WhitelistProps) => {
  const [t] = useTranslation()
  const [filterValue, setFilterValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const [confirmContent, setConfirmContent] = useState<string>()

  const debounceSetFilterValue = useDebounceCallback((value: string) => {
    setFilterValue(value.trim())
  })

  const { version, policies, savePolicies } = useStorageStore(useShallow((s) => ({
    version: s.version,
    policies: s.policies,
    savePolicies: s.savePolicies,
  })))

  const siteList = useMemo(() => {
    if (!policies) return [];
    return policies.isBlacklistMode ? policies.blacklist : policies.whitelist
  }, [version])

  const filteredList = useMemo(() => {
    return siteList.filter((item) => item.includes(filterValue))
  }, [version, siteList, filterValue])

  const addItemHelper = () => {
    if (!policies) return;
    try {
      const url = new URL(`http://${addValue}`)
      if (siteList.includes(url.hostname)) {
        /* 域名重复 */
        props.msgApi?.error(t('tip.err.domain-exist'))
      } else if (existParentDomain(siteList, url.hostname)) {
        /* 存在父域名 */
        props.msgApi?.error(t('tip.err.parent-domain-exist'))
      } else if (existChildDomain(siteList, url.hostname)) {
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
    if (!policies) return;
    siteList.push(item)
    setAddValue('')
    savePolicies()
  }

  const deleteItem = (item: string) => {
    if (!policies) return;
    const idx = siteList.indexOf(item)
    if (idx !== -1) {
      siteList.splice(idx, 1)
      savePolicies()
    }
  }

  const cleanItem = () => {
    if (!policies) return;
    siteList.length = 0
    savePolicies()
  }

  const switchIsBlacklistMode = (isBlacklistMode: boolean) => {
    if (!policies) return;
    policies.isBlacklistMode = isBlacklistMode
    savePolicies()
  }

  return <section className="h-full flex flex-col gap-2">
    <div className="flex gap-2">
      <Button
        className="grow"
        color={!policies?.isBlacklistMode ? 'primary' : 'default'}
        variant={!policies?.isBlacklistMode ? 'solid' : 'outlined'}
        onClick={() => switchIsBlacklistMode(false)}>
        仅排除网站列表
      </Button>
      <Button
        className="grow"
        color={policies?.isBlacklistMode ? 'primary' : 'default'}
        variant={policies?.isBlacklistMode ? 'solid' : 'outlined'}
        onClick={() => switchIsBlacklistMode(true)}>
        仅注入网站列表
      </Button>
    </div>
    <div className="h-full flex flex-col rounded-lg bg-[--ant-color-bg-container]">
      <Space.Compact>
        <Input
          className="rounded-lg"
          suffix={<SearchOutlined />}
          placeholder="example.com"
          onInput={({ target }: any) => debounceSetFilterValue(target.value)} />
        <Popconfirm title={t('tip.if.clean-whitelist')}
          placement='topLeft'
          okText={t('g.confirm')}
          cancelText={t('g.cancel')}
          okType='danger'
          onConfirm={cleanItem}
          children={<Button icon={<DeleteOutlined />} disabled={siteList.length === 0} />}
        />
      </Space.Compact>
      <section className="overflow-y-auto no-scrollbar grow flex flex-col">
        {filteredList.map((item) => <WhitelistItem key={item} item={item} filterValue={filterValue} onDelete={deleteItem} />)}
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
    </div>
  </section>
}

export default PoliciesView
