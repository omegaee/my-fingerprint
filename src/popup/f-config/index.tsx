import { Collapse, theme, Typography, type CollapseProps } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import FBaseConfig from "./base"
import FSpecialConfig from "./special"
import OtherConfig from "./other"

export type FConfigProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
}

export const FConfig = (props: FConfigProps) => {
  const [t, i18n] = useTranslation()

  const { token } = theme.useToken();

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
        label: <Typography.Text className="font-bold">{t('e.f-base-config')}</Typography.Text>,
        children: <FBaseConfig {...props} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.f-special-config')}</Typography.Text>,
        children: <FSpecialConfig {...props} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.other-config')}</Typography.Text>,
        children: <OtherConfig {...props} />,
        style,
      },
    ].map((item, key) => ({ ...item, key }))
  }, [i18n.language, props.config])

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