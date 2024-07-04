import { useTranslation } from "react-i18next"
import FConfigItem, { type FConfigItemProps } from "./item/item"
import { HookType } from '@/types/enum'
import { arrayFilter } from "@/utils/base"
import FConfigSimpleItem, { FConfigSimpleItemProps } from "./item/simple"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.seed]
const valueTypes = [HookType.value]
const types = [...baseTypes, ...valueTypes]

type FItems = {
  text: string
  keys: FConfigSimpleItemProps['keys']
  keyPrefix: FConfigSimpleItemProps['keyPrefix']
  types: HookType[]
}

const fItems: FItems[] = [
  {
    text: 'equipment',
    keys: ['appVersion', 'platform', 'userAgent'],
    keyPrefix: ['navigator', 'navigator', 'navigator'],
    types,
  },
  {
    text: 'language',
    keys: ['language'],
    keyPrefix: ['navigator'],
    types,
  },
  {
    text: 'hardwareConcurrency',
    keys: ['hardwareConcurrency'],
    keyPrefix: ['navigator'],
    types,
  },
  {
    text: 'size',
    keys: ['width', 'height'],
    keyPrefix: ['screen', 'screen'],
    types,
  },
  {
    text: 'colorDepth',
    keys: ['colorDepth'],
    keyPrefix: ['screen'],
    types,
  },
  {
    text: 'pixelDepth',
    keys: ['pixelDepth'],
    keyPrefix: ['screen'],
    types,
  },
]

export type FBaseConfigProps = {
  config?: Partial<LocalStorageConfig>
}

export const FBaseConfig = function ({config}: FBaseConfigProps) {
  const [t] = useTranslation()

  // const getDefaultType = (prefix: keyof HookFingerprint, key: HookFingerprintKey): HookType | undefined => {
  //   const hf = config?.fingerprint?.[prefix]
  //   // @ts-ignore
  //   return hf[key].type
  // }

  const getValues = (keyPrefix: FItems['keyPrefix'], keys: FItems['keys']): (HookMode | undefined)[] => {
    if(keyPrefix.length !== keys.length) return []
    return keys.map((key, index) => {
      const hf = config?.fingerprint?.[keyPrefix[index]]
      // @ts-ignore
      return hf[key]
    })
  }

  return <>
    {fItems.map((item) =>
      <FConfigSimpleItem
        key={item.text}
        keys={item.keys}
        keyPrefix={item.keyPrefix}
        values={getValues(item.keyPrefix, item.keys)}
        // defaultType={getDefaultType(item.keyPrefix[0], item.keys[0])}
        title={t('item.title.' + item.text)}
        desc={t('item.desc.' + item.text)}
        types={item.types}
      />)}
  </>
}
export default FBaseConfig