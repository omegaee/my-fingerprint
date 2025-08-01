import { Tag } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const RootKeys = ['weak', 'strong', 'other']

const KeyColors: Record<string, string> = {
  strong: 'orange',
  weak: 'green',
  other: 'blue'
}

type FpNoticeItemProps = {
  title: string
  count?: number
  isRoot?: boolean
}

export const FpNoticeItem = ({ title, count, isRoot }: FpNoticeItemProps) => {
  const [t, i18n] = useTranslation()

  const label = useMemo(() => {
    if (isRoot && RootKeys.includes(title)) {
      return t('label.fp-notice.' + title)
    }
    return title
  }, [isRoot, title, i18n.language])

  return isRoot ?
    <div className="py-[2px] flex justify-between items-center font-bold">
      <div>{label}</div>
      <Tag
        className="mr-0 text-[14px]"
        color={KeyColors[title]}>
        x {count}
      </Tag>
    </div>
    :
    <div className="flex justify-between items-center font-bold">
      <div>{label}</div>
      <div className="mr-2">x {count}</div>
    </div>
}