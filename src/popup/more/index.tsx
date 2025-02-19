import { Button } from "antd"
import {
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { type MessageInstance } from "antd/es/message/interface";
import { type ChangeEvent, useCallback, useRef } from "react";
import { useStorageStore } from "../stores/storage";
import { useShallow } from 'zustand/shallow'
import { saveAs } from 'file-saver';
import { useTranslation } from "react-i18next";

export type MoreViewProps = {
  msgApi?: MessageInstance
}

export const MoreView = ({ msgApi }: MoreViewProps) => {
  const [t] = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)

  const { storage, importStorage } = useStorageStore(useShallow((state) => ({
    storage: state.storage,
    importStorage: state.importStorage
  })))

  const onChangeFiles = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return;
    file.text().then((text) => {
      try {
        const ss = JSON.parse(text)
        importStorage(ss).then(() => {
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
        const blob = new Blob([JSON.stringify(storage, null, 2)], { type: "application/json" });
        saveAs(blob, "my-fingerprint-config.json");
      }}>{t('label.config-export')}</Button>
    </section>
  </>
}

export default MoreView