import { useTranslation } from "react-i18next"
import { HookType } from '@/types/enum'
import FConfigTimezoneItem from "./item/timezone"
import FWorkSelectItem, { FWorkSelectItemProps } from "./item/work-select"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const valueTypes = [HookType.value]
const types = [...baseTypes, ...valueTypes]

type FItems = {
  type: 'simple'
  text: string
  keys: FWorkSelectItemProps['keys']
  keyPrefix: FWorkSelectItemProps['keyPrefix']
  types: HookType[]
} | {
  type: 'timezone'
  text: string,
  keys: FWorkSelectItemProps['keys']
  keyPrefix: FWorkSelectItemProps['keyPrefix']
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
  tab?: chrome.tabs.Tab
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
        case "simple": return <FWorkSelectItem
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