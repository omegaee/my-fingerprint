import { Select, type SelectProps } from "antd"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { useHookMode } from "./context"
import { selectStatusDotStyles as dotStyles } from "./styles"
import { ConfigDesc, ConfigItemX, ConfigItemY } from "./item"
import TipIcon from "@/components/data/tip-icon"
import { HookType } from '@/types/enum'

const useHookTypeOptions = (types: HookType[], name?: string) => {
  const [t, i18n] = useTranslation()

  const makeLable = (value: HookType) => {
    const key = 'type.' + HookType[value];
    const skey = `type.${name}.${HookType[value]}`
    if (!name) return t(key);
    return i18n.exists(skey) ? t(skey) : t(key)
  }

  const options = useMemo(() => {
    return [
      {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: types
          .filter(v => v !== HookType.value)
          .map((value) => ({
            value,
            label: makeLable(value),
          })),
      },
      types.includes(HookType.value) && {
        label: <span>{t('g.custom')}</span>,
        title: 'custom',
        options: [{
          value: HookType.value,
          label: t('type.' + HookType[HookType.value]),
        }],
      }
    ].filter(v => !!v)
  }, [types, i18n.language])

  return options as SelectProps['options']
}

/**
 * 选择器
 */
export const HookModeSelector = ({ types, defaultValue }: {
  types?: HookType[]
  defaultValue?: any
}) => {
  const { name, mode, setType, setValue } = useHookMode()
  const options = useHookTypeOptions(types ?? [], name)

  return <Select<HookType>
    className={dotStyles.base}
    options={options}
    value={mode.type}
    onChange={(t) => {
      if (t === HookType.value) {
        setValue(defaultValue)
      } else {
        setType(t)
      }
    }}
  />
}

/**
 * 自定义模式组件
 */
export const HookModeCustom = ({ children }: {
  children?: React.ReactNode | ((ctx: ReturnType<typeof useHookMode>) => React.ReactNode)
}) => {
  const ctx = useHookMode()
  return ctx.mode.type === HookType.value && (typeof children === 'function' ? children(ctx) : children);
}

/**
 * 卡片
 */
export const HookModeCard = ({ axis = 'y', color = 'base', tags, isDescArray, children }: {
  axis?: 'x' | 'y'
  color?: keyof typeof dotStyles
  tags?: string[] | undefined
  isDescArray?: boolean
  children?: React.ReactNode
}) => {
  const [t] = useTranslation()
  const { name, mode } = useHookMode()

  const Item = axis === 'y' ? ConfigItemY : ConfigItemX

  return <Item
    label={t('item.title.' + name)}
    className={mode.type === HookType.default ? '' : dotStyles[color]}
    endContent={<TipIcon.Question content={
      <ConfigDesc
        tags={tags}
        desc={t('item.desc.' + name, isDescArray ? { joinArrays: '\n\n' } : undefined)}
      />
    } />}
  >
    {children}
  </Item>
}