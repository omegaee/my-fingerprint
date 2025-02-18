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

export type MoreViewProps = {
  msgApi?: MessageInstance
}

export const MoreView = ({ msgApi }: MoreViewProps) => {
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
          msgApi?.success('配置导入成功')
        }).catch((err) => {
          msgApi?.error('配置导入失败: ' + err)
        })
      } catch (_) {
        msgApi?.error('配置解析失败')
      }
    })
  }, [])

  return <>
    <section className="flex justify-center items-center gap-4">
      <input ref={fileRef} type="file" className="hidden"
        accept="application/json"
        onChange={onChangeFiles} />
      <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>导入配置</Button>
      <Button icon={<ExportOutlined />} onClick={() => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
        saveAs(blob, "config.json");
      }}>导出配置</Button>
    </section>
  </>
}

export default MoreView