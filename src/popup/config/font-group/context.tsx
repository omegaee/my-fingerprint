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

  const changeEnable = async (checked: boolean) => {
    if (!action) return;
    action.enable = checked;
    saveConfig()
  }

  const allowFont = (f: string) => {
    if (!action) return;
    action.blocklist = action.blocklist.filter((v) => v !== f)
    action.allowlist.push(f)
    saveConfig()
  }

  const blockFont = (f: string) => {
    if (!action) return;
    action.allowlist = action.allowlist.filter((v) => v !== f)
    action.blocklist.push(f)
    saveConfig()
  }

  const syncFonts = async () => {
    if (!action || !fontsSet || !supportedFonts) return;

    // Try init allow fonts
    if (action.allowlist.length === 0) {
      action.allowlist = await filterSupportedFonts(fontsSet.default)
    }

    // Sync block fonts
    const allowset = new Set(action.allowlist)
    action.blocklist = supportedFonts.filter((f) => !allowset.has(f))

    saveConfig()
  }

  useEffect(() => {
    if (!action) return;
    if (action.allowlist.length === 0) {
      syncFonts()
    }
  }, [action?.allowlist])

  return {
    fonts: fontsSet,
    isFontsPending,
    supportedFonts,
    isSupportedFontsPending,
    config, saveConfig,
    version,
    action,
    changeEnable,
    allowFont,
    blockFont,
    syncFonts,
  }
})