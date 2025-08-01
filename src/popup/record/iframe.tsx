import { useTranslation } from "react-i18next"
import IframeNoticeItem from "./iframe-item"

export type IframeNoticePanelProps = {
  notice?: Record<string, number>
}

export const IframeNoticePanel = ({ notice }: IframeNoticePanelProps) => {
  const [t] = useTranslation()
  const keys = notice ? Object.keys(notice) : []

  return <div className='p-1 h-full flex flex-col bg-[--ant-color-bg-container]'>
    {keys.length === 0 ?
      <div className='grow flex justify-center items-center'>{t('tip.label.no-fp-notice')}</div> :
      <div>{keys.map((v) => <IframeNoticeItem key={v} src={v} count={notice?.[v]} />)}</div>}
  </div>
}

export default IframeNoticePanel