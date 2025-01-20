import { Collapse, theme, Typography, type CollapseProps } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import NormalFpConfigGroup from "./group/normal-fp"
import SpecialFpConfigGroup from "./group/special-fp"
import OtherConfigGroup from "./group/other"

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
        label: <Typography.Text className="font-bold">{t('e.normal-fp')}</Typography.Text>,
        children: <NormalFpConfigGroup />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.special-fp')}</Typography.Text>,
        children: <SpecialFpConfigGroup />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.other-config')}</Typography.Text>,
        children: <OtherConfigGroup />,
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