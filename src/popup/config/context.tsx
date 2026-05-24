import { createHookContext } from "@/utils/context";
import { useState } from "react";
import { useStorageStore } from "../stores/storage2";
import { useShallow } from "zustand/shallow";
import { HookType } from "@/types/enum";

export const {
  Provider: HookModeProvider,
  useCtx: useHookMode,
} = createHookContext(({ obj, name }: {
  obj: object
  name: HookFingerprintKey
}) => {
  const [version, setVersion] = useState(0);
  const { saveConfig } = useStorageStore(useShallow((s) => ({ saveConfig: s.saveConfig })))

  const update = () => {
    saveConfig();
    setVersion(v => v + 1);
  }

  return {
    version,
    name,
    mode: (obj as any)[name] as HookMode,
    value: (obj as any)[name]?.value,
    update,
    setMode: (v: HookMode) => {
      (obj as any)[name] = v;
      update();
    },
    setType: (v: HookType) => {
      (obj as any)[name] = { type: v, value: undefined };
      update();
    },
    setValue: (v: any) => {
      (obj as any)[name] = { type: HookType.value, value: v };
      update();
    }
  }
})
