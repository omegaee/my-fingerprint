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

  const { storage, importStorage } = useStorageStore(useShallow((s) => ({
    storage: s.storage,
    importStorage: s.importStorage
  })))

  const clipboardExport = () => {
    navigator.clipboard.writeText(JSON.stringify(storage, null, 2))
      .then(() => message.success(t('tip.config.export-ok')))
      .catch((err) => message.error(`${t('tip.config.export-fail')}: ${err?.message}`))
  }

  const clipboardImport = () => {
    navigator.clipboard.readText()
      .then(async (text) => {
        const data = JSON.parse(text)
        if (typeof data !== 'object') {
          throw new Error('Not an object')
        }

        await importStorage(data);
        message.success(t('tip.config.import-ok'));
      })
      .catch((err) => {
        message.error(`${t('tip.config.import-fail')}: ${err?.message}`)
      })
  }

  return <section className={className}>
    <Tooltip title={t('label.json')}>
      <Button icon={<ExportOutlined />} onClick={clipboardExport}>{t('label.clipboard-export')}</Button>
    </Tooltip>
    <VariablePopconfirm
      tooltip={t('label.json')}
      title={t('tip.config.override-current')}
      onConfirm={clipboardImport}>
      <Button icon={<ImportOutlined />}>{t('label.clipboard-import')}</Button>
    </VariablePopconfirm>
  </section>
}

export default MoreConfigView