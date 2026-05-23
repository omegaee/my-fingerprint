import { memo, useMemo } from "react"
import { useStorageStore } from "@/popup/stores/storage2"
import { HookType } from '@/types/enum'
import { Form, Input, Spin } from "antd"
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
        <HookModeSelector types={valueTypes} />
        <HookModeCustom>{({ value, setValue }) => (
          <Input
            placeholder={navigator.languages.join(',')}
            defaultValue={value?.join?.(',') ?? ''}
            onChange={({ target }) => {
              const list = target.value.split(',').map(v => v.trim()).filter((v) => !!v)
              setValue(list.length ? list : navigator.languages)
            }}
          />
        )}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

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
        <HookModeSelector types={baseValueTypes} />
        <HookModeCustom>{({ value, setValue }) => <>
          <Form.Item label='width'>
            <Input
              defaultValue={value.width ?? screen.width}
              onChange={({ target }) => setValue({
                ...value,
                width: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='height'>
            <Input
              defaultValue={value.height ?? screen.height}
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
        <HookModeSelector types={valueTypes} />
        <HookModeCustom>{({ value, setValue }) => <>
          <Form.Item label='colorDepth'>
            <Input
              defaultValue={value.colorDepth ?? screen.colorDepth}
              onChange={({ target }) => setValue({
                ...value,
                colorDepth: target.value ? parseInt(target.value) : undefined,
              })}
            />
          </Form.Item>
          <Form.Item label='pixelDepth'>
            <Input
              defaultValue={value.pixelDepth ?? screen.pixelDepth}
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
        <HookModeSelector types={valueTypes} />
        <HookModeCustom>{({ setValue }) => (
          <Input
            placeholder={String(navigator.hardwareConcurrency)}
            defaultValue={String(navigator.hardwareConcurrency)}
            onChange={({ target }) => setValue(target.value)}
          />
        )}</HookModeCustom>
      </HookModeCard>
    </HookModeProvider>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default WeakFpConfigGroup