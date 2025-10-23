import { useStorageStore } from "@/popup/stores/storage"
import { ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import Markdown from "react-markdown"
import TipIcon from "@/components/data/tip-icon"
import { useTranslation } from "react-i18next"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { HookModeHandler } from "@/utils/hooks"

const UserAgentConfigItem = ({ }: {}) => {
  const [t] = useTranslation()
  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

  return fp ? <>
    <HookModeContent<UserAgentInfo, UserAgentInfo>
      isMakeSelect={false}
      mode={fp.navigator.ua}
      parser={{
      }}
    >{(mode) => (
      <ConfigItemY
        label={t('item.title.ua')}
        className={mode.isDefault ? '' : dotStyles.success}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.ua')}</Markdown>} />}
      >
        <ConfigContentView mode={mode} />
      </ConfigItemY>
    )}</HookModeContent>
  </> : <Spin indicator={<LoadingOutlined spin />} />
}

const ConfigContentView = ({ mode }: {
  mode: HookModeHandler<UserAgentInfo>
}) => {
  return <></>
}

export default UserAgentConfigItem