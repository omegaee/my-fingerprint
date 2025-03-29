import { App, Button, Tooltip } from "antd";
import {
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "../stores/storage";
import VariablePopconfirm from "@/components/feedback/var-popconfirm";

export type MoreConfigViewProps = {
  className?: string
}

export const MoreConfigView = ({ className }: MoreConfigViewProps) => {
  const [t] = useTranslation()
  const { message } = App.useApp()

  const { storage, importStorage } = useStorageStore(useShallow((state) => ({
    storage: state.storage,
    importStorage: state.importStorage
  })))

  const clipboardExport = () => {
    navigator.clipboard.writeText(JSON.stringify(storage, null, 2))
      .then(() => message.success(t('tip.ok.config-export')))
      .catch((err) => message.error(`${t('tip.err.config-export')}: ${err}`))
  }

  const clipboardImport = () => {
    navigator.clipboard.readText()
      .then((text) => {
        try {
          const conf = JSON.parse(text)
          importStorage(conf)
            .then(() => message.success(t('tip.ok.config-import')))
            .catch((err) => message.error(`${t('tip.err.config-import')}: ${err}`))
        } catch (err) {
          message.error(`${t('tip.err.config-parse')}: ${err}`)
        }
      })
      .catch((err) => {
        message.error(`${t('tip.err.config-parse')}: ${err}`)
      })
  }

  return <section className={className}>
    <Tooltip title={t('tip.label.json')}>
      <Button icon={<ExportOutlined />} onClick={clipboardExport}>{t('label.clipboard-export')}</Button>
    </Tooltip>
    <VariablePopconfirm
      tooltip={t('tip.label.json')}
      title={t('tip.if.config-import')}
      onConfirm={clipboardImport}>
      <Button icon={<ImportOutlined />}>{t('label.clipboard-import')}</Button>
    </VariablePopconfirm>
  </section>
}

export default MoreConfigView