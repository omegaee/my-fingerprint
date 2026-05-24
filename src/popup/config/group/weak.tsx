import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage2"
import { HookType } from '@/types/enum'
import { Form, Input, InputNumber, Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import TimeZoneConfigItem from "../special/timezone"
import { getBrowserInfo } from "@/utils/browser"
import { useShallow } from "zustand/shallow"
import ClientHintsConfigItem from "../special/client-hints"
import GPUInfoConfigItem from "../special/gpu-info"
import { HookModeProvider } from "../context"
import { HookModeCard, HookModeCustom, HookModeSelector } from "../ui"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const baseValueTypes = [...baseTypes, HookType.value]
const jsTypes = [HookType.default, HookType.browser, HookType.global]
const valueTypes = [HookType.default, HookType.value]

const deprecatedTag = ['deprecated']
const unstableTag = ['unstable']

export const WeakFpConfigGroup = memo(() => {
  const { config } = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))
  const fp = config?.fp

  const browserInfo = useMemo(() => getBrowserInfo(navigator.userAgent), [])
  const defaultLanguages = navigator.languages.join(',')

  return fp ? <div key={String(!!config)}>
    {/* timezone */}
    <HookModeProvider obj={fp.other} name='timezone'>
      <HookModeCard color='success'>
        <TimeZoneConfigItem />
      </HookModeCard>
    </HookModeProvider>

    {/* languages */}
    <HookModeProvider obj={fp.navigator} name='languages'>
      <HookModeCard color='success' isDescArray>
        <HookModeSelector types={valueTypes} defaultValue={navigator.languages} />
        <HookModeCustom>{({ value, setValue }) => (
          <Input
            placeholder={defaultLanguages}
            value={value?.join?.(',') ?? defaultLanguages}
            onChange={({ target }) => {
              const list = target.value.split(',').map(v => v.trim()).filter((v) => !!v)
              setValue(list.length ? list : navigator.languages)
            }}
          />
        )}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

    {/* clientHints */}
    {browserInfo.name !== 'firefox' && (
      <HookModeProvider obj={fp.navigator} name='clientHints'>
        <HookModeCard color='warning' isDescArray tags={unstableTag}>
          <ClientHintsConfigItem />
        </HookModeCard>
      </HookModeProvider>
    )}

    {/* gpuInfo */}
    <HookModeProvider obj={fp.normal} name='gpuInfo'>
      <HookModeCard color='warning' isDescArray tags={unstableTag}>
        <GPUInfoConfigItem />
      </HookModeCard>
    </HookModeProvider>

    {/* screen size */}
    <HookModeProvider obj={fp.screen} name='size'>
      <HookModeCard color='warning' tags={unstableTag}>
        <HookModeSelector types={baseValueTypes} defaultValue={{
          width: screen.width,
          height: screen.height,
        }} />
        <HookModeCustom>{({ value, setValue }) => <>
          <Form.Item label='width'>
            <Input
              value={value.width ?? screen.width}
              onChange={({ target }) => setValue({
                ...value,
                width: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='height'>
            <Input
              value={value.height ?? screen.height}
              onChange={({ target }) => setValue({
                ...value,
                height: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

    {/* screen colorDepth */}
    <HookModeProvider obj={fp.screen} name='depth'>
      <HookModeCard color='error' tags={deprecatedTag}>
        <HookModeSelector types={valueTypes} defaultValue={{
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
        }} />
        <HookModeCustom>{({ value, setValue }) => <>
          <Form.Item label='colorDepth'>
            <Input
              value={value.colorDepth ?? screen.colorDepth}
              onChange={({ target }) => setValue({
                ...value,
                colorDepth: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='pixelDepth'>
            <Input
              value={value.pixelDepth ?? screen.pixelDepth}
              onChange={({ target }) => setValue({
                ...value,
                pixelDepth: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
        </>}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

    {/* navigator hardwareConcurrency */}
    <HookModeProvider obj={fp.navigator} name='hardwareConcurrency'>
      <HookModeCard color='error' tags={deprecatedTag}>
        <HookModeSelector types={valueTypes} defaultValue={navigator.hardwareConcurrency} />
        <HookModeCustom>{({ value, setValue }) => (
          <InputNumber
            min={0}
            placeholder={String(navigator.hardwareConcurrency)}
            value={value ?? navigator.hardwareConcurrency}
            onChange={(v) => setValue(v)}
          />
        )}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default WeakFpConfigGroup