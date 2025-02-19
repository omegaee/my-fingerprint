import { Button } from "antd"
import {
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { type MessageInstance } from "antd/es/message/interface";
import { type ChangeEvent, useCallback, useRef } from "react";
import { useConfigStore } from "../stores/config";
import { useShallow } from 'zustand/shallow'
import { saveAs } from 'file-saver';
import { useTranslation } from "react-i18next";

export type MoreViewProps = {
  msgApi?: MessageInstance
}

export const MoreView = ({ msgApi }: MoreViewProps) => {
  const [t] = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)

  const { config, importConfig } = useConfigStore(useShallow((state) => ({
    config: state.config,
    importConfig: state.importConfig
  })))

  const onChangeFiles = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return;
    file.text().then((text) => {
      try {
        const config = JSON.parse(text)
        importConfig(config).then(() => {
          msgApi?.success(t('tip.ok.config-import'))
        }).catch((err) => {
          msgApi?.error(`${t('tip.err.config-import')}: ${t(err)}`)
        })
      } catch (_) {
        msgApi?.error(t('tip.err.config-parse'))
      }
    })
  }, [])

  return <>
    <section className="flex justify-center items-center gap-4">
      <input ref={fileRef} type="file" className="hidden"
        accept="application/json"
        onChange={onChangeFiles} />
      <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>{t('label.config-import')}</Button>
      <Button icon={<ExportOutlined />} onClick={() => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
        saveAs(blob, "config.json");
      }}>{t('label.config-export')}</Button>
    </section>
  </>
}

export default MoreView