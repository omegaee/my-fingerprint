import { Button, Divider } from "antd"
import {
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { type MessageInstance } from "antd/es/message/interface";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useStorageStore } from "../stores/storage";
import { useShallow } from 'zustand/shallow'
import { saveAs } from 'file-saver';
import { useTranslation } from "react-i18next";
import PermissionView from "./permission";

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

  return <section>
    <Divider rootClassName="!mt-0 !mb-2" orientation='center'>{t('label.config-file')}</Divider>
    <section className="flex justify-center items-center gap-2">
      <input ref={fileRef} type="file" className="hidden"
        accept="application/json"
        onChange={onChangeFiles} />
      <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>{t('label.config-import')}</Button>
      <Button icon={<ExportOutlined />} onClick={() => {
        const blob = new Blob([JSON.stringify(storage, null, 2)], { type: "application/json" });
        saveAs(blob, "my-fingerprint-config.json");
      }}>{t('label.config-export')}</Button>
    </section>
    <Divider rootClassName="!my-2" orientation='center'>{t('label.permission')}</Divider>
    <PermissionView className="flex flex-wrap justify-center items-center gap-2"/>
    <Divider rootClassName="!my-3" />
  </section>
}

export default MoreView