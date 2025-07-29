import { Collapse, theme, Typography, type CollapseProps } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import WeakFpConfigGroup from "./group/weak"
import StrongFpConfigGroup from "./group/strong"
import PrefsConfigGroup from "./group/prefs"
import ScriptConfigGroup from "./group/script"
import { usePrefsStore } from "../stores/prefs"

export const FConfig = () => {
  const [t, i18n] = useTranslation()
  const { token } = theme.useToken();

  const prefs = usePrefsStore()

  const items = useMemo<CollapseProps['items']>(() => {
    const style: React.CSSProperties = {
      marginBottom: 8,
      // background: token.colorFillContent,
      borderRadius: token.borderRadiusSM,
      border: '2px solid',
      borderColor: token.colorBorder,
    }
    return [
      {
        label: <Typography.Text className="font-bold">{t('label.config.strong')}</Typography.Text>,
        children: <StrongFpConfigGroup />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.weak')}</Typography.Text>,
        children: <WeakFpConfigGroup />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.script')}</Typography.Text>,
        children: <ScriptConfigGroup />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('label.config.ui')}</Typography.Text>,
        children: <PrefsConfigGroup />,
        style,
      },
    ].map((item, key) => ({ ...item, key }))
  }, [i18n.language, prefs.theme])

  return <Collapse className="h-full" size='small'
    style={{
      background: 'transparent',
    }}
    expandIconPosition='end'
    bordered={false}
    accordion
    items={items} />
}

export default FConfig