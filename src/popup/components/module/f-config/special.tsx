import { useTranslation } from "react-i18next"
import FConfigItem, { type FConfigItemProps } from "./item/item"
import { HookType } from '@/types/enum'
import FConfigTimezoneItem from "./item/timezone"
import FConfigSimpleItem, { FConfigSimpleItemProps } from "./item/simple"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.seed]
const valueTypes = [HookType.value]
const types = [...baseTypes, ...valueTypes]

type FItems = {
  type: 'simple'
  text: string
  keys: FConfigSimpleItemProps['keys']
  keyPrefix: FConfigSimpleItemProps['keyPrefix']
  types: HookType[]
} | {
  type: 'timezone'
  text: string,
  keys: FConfigSimpleItemProps['keys']
  keyPrefix: FConfigSimpleItemProps['keyPrefix']
}

const fItems: FItems[] = [
  {
    type: 'timezone',
    text: 'timezone',
    keys: ['timezone'],
    keyPrefix: ['other'],
  },
  {
    type: 'simple',
    text: 'canvas',
    keys: ['canvas'],
    keyPrefix: ['other'],
    types: baseTypes,
  },
  {
    type: 'simple',
    text: 'audio',
    keys: ['audio'],
    keyPrefix: ['other'],
    types: baseTypes,
  },
  {
    type: 'simple',
    text: 'webgl',
    keys: ['webgl'],
    keyPrefix: ['other'],
    types: baseTypes,
  },
]

export type FSpecialConfigProps = {
  config?: Partial<LocalStorageConfig>
}

export const FSpecialConfig = function ({config}: FSpecialConfigProps) {
  const [t] = useTranslation()

  const getSimpleValues = (keyPrefix: FItems['keyPrefix'], keys: FItems['keys']): (HookMode | undefined)[] => {
    if(keyPrefix.length !== keys.length) return []
    return keys.map((key, index) => {
      const hf = config?.fingerprint?.[keyPrefix[index]]
      // @ts-ignore
      return hf[key]
    })
  }

  const getTimezoneValue = () => {
    const timezoneMode = config?.fingerprint?.other.timezone
    if(timezoneMode?.type === HookType.value){
      return timezoneMode.value
    }
  }

  return <>
    {fItems.map((item) => {
      switch(item.type){
        case "simple": return <FConfigSimpleItem
          key={item.text}
          keys={item.keys}
          keyPrefix={item.keyPrefix}
          values={getSimpleValues(item.keyPrefix, item.keys)}
          title={t('item.title.' + item.text)}
          desc={t('item.desc.' + item.text)}
          types={item.types}
        />
        case "timezone": return <FConfigTimezoneItem 
          key={item.text}
          title={t('item.title.' + item.text)}
          desc={t('item.desc.' + item.text)}
          value={getTimezoneValue()}
        />
      }
    })}
  </>
}
export default FSpecialConfig