import { Tabs } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FpNoticePanel } from "./fp";
import { sendToBackground } from "@/utils/message";
import TipIcon from "@/components/data/tip-icon";

type NoticePanelProps = {
  tab?: chrome.tabs.Tab
}

export const NoticePanel = ({ tab }: NoticePanelProps) => {
  const [t] = useTranslation();
  const [fpNotice, setFpNotice] = useState<Record<string, number>>()

  useEffect(() => {
    if (tab?.id == null) return;
    sendToBackground({
      type: 'notice.get',
      tabId: tab.id,
    }).then((data) => setFpNotice(data))
  }, [tab?.id])

  return <div className='relative h-full flex flex-col'>
    <div className="absolute right-1">
      <TipIcon.Question content='content' />
    </div>
    <Tabs
      className="h-full [&_.ant-tabs-tab]:!py-0.5 [&_.ant-tabs-nav]:mb-0"
      type="card"
      size='small'
      items={[
        {
          key: '1',
          label: t('e.fp-record'),
          children: <FpNoticePanel notice={fpNotice} />,
        },
        {
          key: '2',
          label: t('e.iframe-record'),
          children: <div></div>,
        }
      ]}
    />
  </div>
}