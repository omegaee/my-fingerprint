import { useStorageStore } from "@/popup/stores/storage2"
import { HookType } from '@/types/enum'
import { memo } from "react"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { useShallow } from "zustand/shallow"
import { HookModeProvider } from "../context"
import { HookModeCard, HookModeSelector } from "../ui"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const disabledTypes = [HookType.default, HookType.disabled]

const unstableTag = ['unstable']

export const StrongFpConfigGroup = memo(() => {
  const { config } = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))
  const fp = config?.fp

  return fp ? <div key={String(!!config)}>

    <HookModeProvider obj={fp.other} name='canvas'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webgl'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='audio'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webrtc'>
      <HookModeCard color='warning' isDescArray tags={unstableTag}>
        <HookModeSelector types={disabledTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webgpu'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='font'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='domRect'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='serviceWorker'>
      <HookModeCard color='warning' isDescArray tags={unstableTag}>
        <HookModeSelector types={disabledTypes} />
      </HookModeCard>
    </HookModeProvider>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default StrongFpConfigGroup