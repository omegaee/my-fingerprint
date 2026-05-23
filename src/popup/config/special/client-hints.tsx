import { selectStatusDotStyles as dotStyles } from "../styles"
import { useTranslation } from "react-i18next"
import { Button, Checkbox, Collapse, CollapseProps, Input, Select, Spin, Tooltip } from "antd"
import { LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { useI18n } from "@/utils/hooks"
import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'
import { sharedAsync } from "@/utils/timer"
import { ClientHintsOption, LocalApi } from "@/api/local"
import { HookModeCustom } from "../ui"
import { useHookMode } from "../context"

const userAgentData: any = (navigator as any).userAgentData;

type OptionType = (string & {}) | HookType

type UserAgentInput = {
  ua: ClientHintsInfo['ua']
  uaData: Omit<ClientHintsInfo['uaData'], 'formFactors' | 'versions'> & {
    formFactors: string
    versions: string
  }
}

const versionsToArr = (v?: string) => {
  if (!v) return [];
  const arr = v.split(',').map(v => v.trim()).filter(Boolean)
  return arr.map(v => {
    const [brand, version] = v.split('=').map(v => v.trim())
    return {
      brand,
      version,
    }
  })
}

const versionsToStr = (v?: any[]) => {
  if (!v) return '';
  return v.map(v => `${v.brand}=${v.version ?? ''}`).join(',\n')
}

const formFactorsToArr = (v?: string) => {
  if (!v) return [];
  return v.split(',').map(v => v.trim()).filter(Boolean)
}

const getUaData = async () => {
  if (userAgentData) {
    const data = await userAgentData.getHighEntropyValues([
      "architecture",
      "bitness",
      "formFactor",
      "model",
      "platform",
      "platformVersion",
      'formFactors',
      "uaFullVersion",
      "brands",
      "fullVersionList",
    ])
    return data;
  }
}

const fetchClientHints = sharedAsync(LocalApi.clientHints)

/**
 * 配置模块
 */
const ClientHintsConfigItem = ({ }: {}) => {
  const { t, i18n, asLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [localPreset, setLocalPreset] = useState<ClientHintsOption[]>([])
  const [uaInfo, setUaInfo] = useState<ClientHintsInfo>()

  const { mode, value: modeValue = {}, setType, setValue } = useHookMode()

  useEffect(() => {
    getUaData().then(data => {
      if (!data) return;
      setUaInfo({
        ua: {
          userAgent: navigator.userAgent,
          appVersion: navigator.appVersion,
          platform: navigator.platform,
        },
        uaData: {
          arch: data.architecture,
          bitness: data.bitness,
          mobile: data.mobile,
          model: data.model,
          platform: data.platform,
          platformVersion: data.platformVersion,
          formFactors: data.formFactors,
          uaFullVersion: data.uaFullVersion,
          versions: data.fullVersionList,
        }
      })
    });
  }, [])

  useEffect(() => {
    if (!isOpen || localPreset.length != 0) return;
    fetchClientHints()
      .then((data) => {
        setLocalPreset(data)
      }).catch((e) => {
        console.warn(e)
      })
  }, [isOpen])

  const options = useMemo(() => {
    return [
      {
        label: <span>{t('g.special')}</span>,
        title: 'special',
        options: [
          {
            value: HookType.default,
            label: t('type.' + HookType[HookType.default]),
          },
          {
            value: HookType.value,
            label: t('type.' + HookType[HookType.value]),
          },
        ],
      },
      localPreset && {
        label: <span>{t('g.preset')}</span>,
        title: 'preset',
        options: localPreset.map((v) => ({
          value: v.key,
          label: asLang(v.title),
        })),
      },
    ].filter(v => !!v)
  }, [i18n.language, localPreset])

  const onChange = (v: OptionType) => {
    if (v === HookType.default) {
      setType(HookType.default)
    } else if (v === HookType.value) {
      setValue({ ...uaInfo })
    } else {
      const preset = localPreset?.find(item => item.key === v);
      if (preset) {
        const { title, ...rest } = preset;
        setValue(rest)
      }
    }
  }

  if (!userAgentData) {
    return <></>
  }

  return <>
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      value={modeValue.key || mode.type}
      onChange={onChange}
    />
    <HookModeCustom>
      {uaInfo ? <ConfigContentView defaultValues={uaInfo} /> : <Spin indicator={<LoadingOutlined spin />} />}
    </HookModeCustom>
  </>
}

/**
 * 配置组
 */
const ConfigContentView = ({ defaultValues }: {
  defaultValues: ClientHintsInfo
}) => {
  const { value: modeValue = {}, setValue, version } = useHookMode()

  const resetUserAgent = () => {
    setValue({
      ua: { ...defaultValues.ua },
      uaData: modeValue.uaData,
    })
  }

  const resetUserAgentData = () => {
    setValue({
      ua: modeValue.ua,
      uaData: { ...defaultValues.uaData },
    })
  }

  const items = useMemo<CollapseProps['items']>(() => [
    {
      key: '1',
      label: 'UserAgent',
      children: <UserAgentView defaultValues={defaultValues} />,
      extra: <ResetButton onPress={resetUserAgent} />,
    },
    {
      key: '2',
      label: 'UserAgentData',
      children: <UserAgentDataView defaultValues={defaultValues} />,
      extra: <ResetButton onPress={resetUserAgentData} />,
    },
  ].map((v) => ({
    ...v,
    className: 'mb-2 last:mb-0 bg-default-100 !border-none !rounded [&_.ant-collapse-content]:bg-default-100',
  })), [version]);

  return <div>
    <Collapse
      bordered={false}
      accordion
      size="small"
      className="bg-default-50 overflow-auto no-scrollbar border-none"
      items={items}
    />
  </div>
}

const ResetButton = ({ onPress }: {
  onPress?: () => void
}) => {
  const { t } = useTranslation()
  return <Tooltip title={t('g.reset')}>
    <Button
      size="small"
      className="group size-[22px]"
      icon={<RedoOutlined className="group-hover:rotate-180 duration-200" />}
      onClick={(e) => {
        e.stopPropagation()
        onPress?.()
      }}
    />
  </Tooltip>
}

const UserAgentView = ({ defaultValues }: {
  defaultValues: ClientHintsInfo
}) => {
  const { value, setValue } = useHookMode()

  const raw = defaultValues.ua;
  const data = value?.ua ?? {};

  return <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
    <label>userAgent</label>
    <Input
      placeholder={raw.userAgent}
      defaultValue={data.userAgent ?? raw.userAgent}
      onInput={({ target }: any) => setValue({
        ...value,
        ua: {
          ...data,
          userAgent: target.value || raw.userAgent,
        }
      })}
    />

    <label>appVersion</label>
    <Input
      placeholder={raw.appVersion}
      defaultValue={data.appVersion ?? raw.appVersion}
      onInput={({ target }: any) => setValue({
        ...value,
        ua: {
          ...data,
          appVersion: target.value || raw.appVersion,
        }
      })}
    />

    <label>platform</label>
    <Input
      placeholder={raw.platform}
      defaultValue={data.platform ?? raw.platform}
      onInput={({ target }: any) => setValue({
        ...value,
        ua: {
          ...data,
          platform: target.value || raw.platform,
        }
      })}
    />
  </div>
}

const UserAgentDataView = ({ defaultValues }: {
  defaultValues: ClientHintsInfo
}) => {
  const { value, setValue } = useHookMode()

  const raw = defaultValues.uaData;
  const data = value?.uaData ?? {};

  return <div className="flex flex-col gap-1">
    <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
      <label>mobile</label>
      <div>
        <Checkbox
          defaultChecked={data.mobile ?? raw.mobile}
          onChange={({ target }: any) => setValue({
            ...value,
            uaData: {
              ...data,
              mobile: target.checked,
            }
          })}
        />
      </div>

      <label>arch</label>
      <Input
        placeholder={raw.arch}
        defaultValue={data.arch ?? raw.arch}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            arch: target.value || raw.arch,
          }
        })}
      />

      <label>bitness</label>
      <Input
        placeholder={raw.bitness}
        defaultValue={data.bitness ?? raw.bitness}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            bitness: target.value || raw.bitness,
          }
        })}
      />

      <label>platform</label>
      <Input
        placeholder={raw.platform}
        defaultValue={data.platform ?? raw.platform}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            platform: target.value || raw.platform,
          }
        })}
      />

      <label>platformVersion</label>
      <Input
        placeholder={raw.platformVersion}
        defaultValue={data.platformVersion ?? raw.platformVersion}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            platformVersion: target.value || raw.platformVersion,
          }
        })}
      />

      <label>model</label>
      <Input
        placeholder={raw.model}
        defaultValue={data.model ?? raw.model}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            model: target.value || raw.model,
          }
        })}
      />

      <label>formFactors</label>
      <Input
        placeholder={raw.formFactors.join(', ')}
        defaultValue={data.formFactors ?? raw.formFactors}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            formFactors: target.value,
          }
        })}
      />

      <label>uaFullVersion</label>
      <Input
        placeholder={raw.uaFullVersion}
        defaultValue={data.uaFullVersion ?? raw.uaFullVersion}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            uaFullVersion: target.value || raw.uaFullVersion,
          }
        })}
      />
    </div>

    <div>
      <label className="mb-1">versions</label>
      <Input.TextArea
        size="small"
        autoSize={{
          minRows: 3,
          maxRows: 3,
        }}
        placeholder={versionsToStr(raw.versions)}
        defaultValue={data.uaFullVersion ? versionsToStr(data.uaFullVersion) : versionsToStr(raw.versions)}
        onInput={({ target }: any) => setValue({
          ...value,
          uaData: {
            ...data,
            versions: target.value,
          }
        })}
      />
    </div>
  </div>
}

export default ClientHintsConfigItem