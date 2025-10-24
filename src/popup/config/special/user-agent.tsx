import { useStorageStore } from "@/popup/stores/storage"
import { ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import Markdown from "react-markdown"
import TipIcon from "@/components/data/tip-icon"
import { useTranslation } from "react-i18next"
import { Collapse, CollapseProps, Select, Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { HookModeHandler } from "@/utils/hooks"
import { cn } from "@/utils/style"
import { useMemo } from "react"
import { HookType } from '@/types/enum'

type OptionType = (string & {}) | HookType

const UserAgentConfigItem = ({ }: {}) => {
  const { t, i18n } = useTranslation()
  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

  const options = useMemo(() => {
    return [
      {
        label: <span>{t('g.special')}</span>,
        title: 'special',
        options: [
          {
            value: HookType.default,
            label: t('type.' + HookType[HookType.default]),
          },
          {
            value: HookType.value,
            label: t('type.' + HookType[HookType.value]),
          },
        ],
      },
    ].filter(v => !!v)
  }, [i18n.language])

  return fp ? <>
    <HookModeContent<UserAgentInfo, UserAgentInfo>
      isMakeSelect={false}
      mode={fp.navigator.ua}
      parser={{
      }}
    >{(mode) => (
      <ConfigItemY
        label={t('item.title.ua')}
        className={cn(!mode.isDefault && dotStyles.success)}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.ua')}</Markdown>} />}
      >
        <Select<OptionType>
          className={dotStyles.base}
          options={options}
          value={mode.type}
          onChange={(v) => {
            if (v === HookType.default || v === HookType.value) {
              mode.setType(v);
            }
          }}
        />
        {mode.isValue && <ConfigContentView mode={mode} />}
      </ConfigItemY>
    )}</HookModeContent>
  </> : <Spin indicator={<LoadingOutlined spin />} />
}

const ConfigContentView = ({ mode }: {
  mode: HookModeHandler<UserAgentInfo>
}) => {
  const text = `test`;

  const items = useMemo<CollapseProps['items']>(() => [
    {
      key: '1',
      label: 'UserAgent',
      children: <p>{text}</p>,
    },
    {
      key: '2',
      label: 'UserAgentData',
      children: <p>{text}</p>,
    },
  ].map((v) => ({
    ...v,
    className: 'mb-2 last:mb-0 bg-default-100 !border-none !rounded [&_.ant-collapse-content]:bg-default-100',
  })), []);

  return <div>
    <Collapse
      size="small"
      className="bg-default-50 overflow-auto no-scrollbar border-none"
      items={items}
    />
  </div>
}

export default UserAgentConfigItem