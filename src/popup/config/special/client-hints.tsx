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

const formFactorsToStr = (v?: any[]) => {
  if (!v) return '';
  return v.join(', ')
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

  return uaInfo ? <>
    <Select<OptionType>
      open={isOpen}
      onOpenChange={setIsOpen}
      className={dotStyles.base}
      options={options}
      value={modeValue.key || mode.type}
      onChange={onChange}
    />
    <HookModeCustom>
      <ConfigContentView defaultValues={uaInfo} />
    </HookModeCustom>
  </> : <Spin indicator={<LoadingOutlined spin />} />
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
      key: undefined,
      ua: { ...defaultValues.ua },
      uaData: modeValue.uaData,
    })
  }

  const resetUserAgentData = () => {
    setValue({
      key: undefined,
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
  const { value, update: _update } = useHookMode()

  const raw = defaultValues.ua;
  const data = value?.ua;

  const update = () => {
    value.key = undefined;
    _update();
  }

  return data && <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
    <label>userAgent</label>
    <Input
      placeholder={raw.userAgent}
      value={data.userAgent ?? raw.userAgent}
      onInput={({ target }: any) => {
        data.userAgent = target.value || raw.userAgent;
        update();
      }}
    />

    <label>appVersion</label>
    <Input
      placeholder={raw.appVersion}
      value={data.appVersion ?? raw.appVersion}
      onInput={({ target }: any) => {
        data.appVersion = target.value || raw.appVersion;
        update();
      }}
    />

    <label>platform</label>
    <Input
      placeholder={raw.platform}
      value={data.platform ?? raw.platform}
      onInput={({ target }: any) => {
        data.platform = target.value || raw.platform;
        update();
      }}
    />
  </div>
}

const UserAgentDataView = ({ defaultValues }: {
  defaultValues: ClientHintsInfo
}) => {
  const { value, update: _update } = useHookMode()

  const raw = defaultValues.uaData;
  const data = value?.uaData;

  const update = () => {
    value.key = undefined;
    _update();
  }

  return data && <div className="flex flex-col gap-1">
    <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
      <label>mobile</label>
      <div>
        <Checkbox
          checked={data.mobile ?? raw.mobile}
          onChange={({ target }: any) => {
            data.mobile = target.checked;
            update();
          }}
        />
      </div>

      <label>arch</label>
      <Input
        placeholder={raw.arch}
        value={data.arch ?? raw.arch}
        onInput={({ target }: any) => {
          data.arch = target.value || raw.arch;
          update();
        }}
      />

      <label>bitness</label>
      <Input
        placeholder={raw.bitness}
        value={data.bitness ?? raw.bitness}
        onInput={({ target }: any) => {
          data.bitness = target.value || raw.bitness;
          update();
        }}
      />

      <label>platform</label>
      <Input
        placeholder={raw.platform}
        value={data.platform ?? raw.platform}
        onInput={({ target }: any) => {
          data.platform = target.value || raw.platform;
          update();
        }}
      />

      <label>platformVersion</label>
      <Input
        placeholder={raw.platformVersion}
        value={data.platformVersion ?? raw.platformVersion}
        onInput={({ target }: any) => {
          data.platformVersion = target.value || raw.platformVersion;
          update();
        }}
      />

      <label>model</label>
      <Input
        placeholder={raw.model}
        value={data.model ?? raw.model}
        onInput={({ target }: any) => {
          data.model = target.value || raw.model;
          update();
        }}
      />

      <label>formFactors</label>
      <Input
        placeholder={formFactorsToStr(raw.formFactors)}
        value={data.formFactors ? formFactorsToStr(data.formFactors) : formFactorsToStr(raw.formFactors)}
        onInput={({ target }: any) => {
          data.formFactors = formFactorsToArr(target.value);
          update();
        }}
      />

      <label>uaFullVersion</label>
      <Input
        placeholder={raw.uaFullVersion}
        value={data.uaFullVersion ?? raw.uaFullVersion}
        onInput={({ target }: any) => {
          data.uaFullVersion = target.value || raw.uaFullVersion;
          update();
        }}
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
        value={data.versions ? versionsToStr(data.versions) : versionsToStr(raw.versions)}
        onInput={({ target }: any) => {
          data.versions = versionsToArr(target.value);
          update();
        }}
      />
    </div>
  </div>
}

export default ClientHintsConfigItem