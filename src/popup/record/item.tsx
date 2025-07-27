import { Tag } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const RootKeys = ['weak', 'strong', 'other']

type FpNoticeItemProps = {
  title: string
  count?: number
  isRoot?: boolean
}

export const FpNoticeItem = ({ title, count, isRoot }: FpNoticeItemProps) => {
  const [t] = useTranslation()

  const label = useMemo(() => {
    if (isRoot && RootKeys.includes(title)) {
      return t('notice.fp.' + title)
    }
    return title
  }, [isRoot, title])

  return <div className="flex justify-between items-center">
    <div>{label}</div>
    <Tag bordered={false}>x{count}</Tag>
  </div>
}