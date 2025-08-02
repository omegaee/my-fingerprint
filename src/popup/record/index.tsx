import { Tabs } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FpNoticePanel } from "./fp";
import { sendToTab } from "@/utils/message";
import TipIcon from "@/components/data/tip-icon";
import IframeNoticePanel from "./iframe";

const getRecordCount = (record: Record<string, number>) => {
  let count = 0
  for (const key of Object.keys(record)) {
    count += record[key]
  }
  return count > 99 ? '99+' : String(count)
}

type NoticePanelProps = {
  tab?: chrome.tabs.Tab
}

export const NoticePanel = ({ tab }: NoticePanelProps) => {
  const [t] = useTranslation();
  const [fpNotice, setFpNotice] = useState<Record<string, number>>({})
  const [iframeNotice, setIframeNotice] = useState<Record<string, number>>({})

  useEffect(() => {
    const tabId = tab?.id
    if (tabId == null) return;

    const pullData = () => {
      /* fp notice */
      sendToTab(tabId, { type: 'notice.get.fp' })
        .then((data) => setFpNotice(data))
        .catch(() => { })
      /* iframe notice */
      sendToTab(tabId, { type: 'notice.get.iframe' })
        .then((data) => setIframeNotice(data))
        .catch(() => { })
    }

    pullData()
    const timer = setInterval(pullData, 3000)
    return () => clearInterval(timer)
  }, [tab?.id])

  return <div className='relative h-full flex flex-col'>
    <div className="absolute right-1 z-10">
      <TipIcon.Question placement='right' content='content' />
    </div>
    <Tabs
      className="h-full [&_.ant-tabs-tab]:!py-0.5 [&_.ant-tabs-nav]:mb-0"
      type="card"
      size='small'
      items={[
        {
          key: '1',
          label: `${t('e.fp-record')} (${getRecordCount(fpNotice)})`,
          children: <FpNoticePanel notice={fpNotice} />,
        },
        {
          key: '2',
          label: `${t('e.iframe-record')} (${getRecordCount(iframeNotice)})`,
          children: <IframeNoticePanel notice={iframeNotice} />,
        }
      ]}
    />
  </div>
}