import { Collapse, Typography, type CollapseProps } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import WeakFpConfigGroup from "./group/weak"
import StrongFpConfigGroup from "./group/strong"
import PrefsConfigGroup from "./group/prefs"
import ScriptConfigGroup from "./group/script"
import { usePrefsStore } from "../stores/prefs"

export const FConfig = () => {
  const [t, i18n] = useTranslation()

  const prefs = usePrefsStore()

  const items = useMemo<CollapseProps['items']>(() => {
    return [
      {
        label: <Typography.Text className="font-bold">{t('label.config.strong')}</Typography.Text>,
        children: <StrongFpConfigGroup />,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.weak')}</Typography.Text>,
        children: <WeakFpConfigGroup />,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.script')}</Typography.Text>,
        children: <ScriptConfigGroup />,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.prefs')}</Typography.Text>,
        children: <PrefsConfigGroup />,
      },
    ].map((item, key) => ({
      ...item,
      key,
      className: 'mb-2 last:mb-0 py-1 !border-0 bg-[--ant-color-bg-container] !rounded-md',
    })) as CollapseProps['items']
  }, [i18n.language, prefs.theme])

  return <Collapse
    size='small'
    className="h-full bg-[--ant-layout-body-bg] overflow-auto no-scrollbar"
    bordered={false}
    accordion
    items={items} />
}

export default FConfig