import { HookType } from '@/types/enum';
import { LocalApi } from "@/api/local";
import { useStorageStore } from "@/popup/stores/storage";
import { createHookContext } from "@/utils/context";
import { useAsyncValue } from "@/utils/hooks";
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

async function filterSupportedFonts(fonts: string[]): Promise<string[]> {
  const supported: string[] = [];

  for (const f of fonts) {
    try {
      await new FontFace("TestFont", `local("${f}")`).load();
      supported.push(f);
    } catch { }
  }

  return supported;
}

export const {
  Provider: FontGroupProvider,
  useCtx: useFontGroup,
} = createHookContext(() => {
  const { version, config, saveConfig } = useStorageStore(useShallow((s) => ({
    version: s.version,
    config: s.config,
    saveConfig: s.saveConfig,
  })))
  const action = config?.action.fonts
  const mode = config?.fp.other.font

  const {
    value: fontsSet,
    isPending: isFontsPending,
  } = useAsyncValue(() => {
    return LocalApi.fonts()
  }, [])

  const {
    value: supportedFonts,
    isPending: isSupportedFontsPending,
  } = useAsyncValue(() => {
    if (!fontsSet) return Promise.reject();
    return filterSupportedFonts(fontsSet.all)
  }, [fontsSet])

  useEffect(() => {
    if (!action || !supportedFonts) return;
    action.supported = [...supportedFonts]
    saveConfig()
  }, [supportedFonts])

  const resetAllowlist = async () => {
    if (!action || !fontsSet) return;
    const list = await filterSupportedFonts(fontsSet.default)
    action.allowlist = list
    saveConfig()
  }

  useEffect(() => {
    if (!action || !fontsSet) return;
    if (action.allowlist.length === 0) {
      resetAllowlist()
    }
  }, [action, fontsSet])

  const allowFont = (f: string) => {
    if (!action) return;
    if (!action.allowlist.includes(f)) {
      action.allowlist.push(f)
    }
    saveConfig()
  }

  const blockFont = (f: string) => {
    if (!action) return;
    action.allowlist = action.allowlist.filter((font) => font !== f)
    saveConfig()
  }

  const isDefault = mode?.type === HookType.default
  const isCustom = mode?.type === HookType.value
  const isRandom = !isDefault && !isCustom

  return {
    fonts: fontsSet,
    isFontsPending,
    supportedFonts,
    isSupportedFontsPending,
    config, saveConfig,
    version,
    action,
    mode,
    isDefault,
    isCustom,
    isRandom,
    allowFont,
    blockFont,
    resetAllowlist,
  }
})