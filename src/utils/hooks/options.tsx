import { HookType } from '@/types/enum'
import type { SelectProps } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export const useHookTypeOptions = (types: HookType[]) => {
  const [t, i18n] = useTranslation()

  const options = useMemo(() => {
    return [
      {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: types
          .filter(v => v !== HookType.value)
          .map((value) => ({
            value,
            label: t('type.' + HookType[value]),
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