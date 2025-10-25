import { useStorageStore } from "@/popup/stores/storage"
import { ConfigDesc, ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import TipIcon from "@/components/data/tip-icon"
import { useTranslation } from "react-i18next"
import { Button, Checkbox, Collapse, CollapseProps, Input, Select, Spin, Tooltip } from "antd"
import { LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { HookModeHandler } from "@/utils/hooks"
import { cn } from "@/utils/style"
import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'

const unstableTag = ['unstable']

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

const ClientHintsConfigItem = ({ }: {}) => {
  const { t, i18n } = useTranslation()
  const [uaInfo, setUaInfo] = useState<ClientHintsInfo>()

  const config = useStorageStore((state) => state.config)
  const fp = config?.fp

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
    })
  }, [])

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
    ].filter(v => !!v)
  }, [i18n.language])

  if (!userAgentData) {
    return <></>
  }

  return (fp && uaInfo) ? <>
    <HookModeContent<ClientHintsInfo, UserAgentInput>
      isMakeSelect={false}
      mode={fp.navigator.clientHints}
      parser={{
        toInput: (value) => {
          const input = value ?? { ...uaInfo }
          return {
            ua: input.ua,
            uaData: {
              ...input.uaData,
              formFactors: input.uaData.formFactors.join(', '),
              versions: versionsToStr(input.uaData.versions),
            }
          }
        },
        toValue: (input) => {
          const formFactors = formFactorsToArr(input.uaData.formFactors);
          const versions = versionsToArr(input.uaData.versions);
          return {
            ua: input.ua,
            uaData: {
              ...input.uaData,
              formFactors: formFactors.length ? formFactors : [...uaInfo.uaData.formFactors],
              versions: versions.length ? versions : [...uaInfo.uaData.versions],
            }
          }
        },
      }}
    >{(mode) => (
      <ConfigItemY
        label={t('item.title.clientHints')}
        className={cn(!mode.isDefault && dotStyles.warning)}
        endContent={<TipIcon.Question content={<ConfigDesc tags={unstableTag} desc={t('item.desc.clientHints', { joinArrays: '\n\n' })} />} />}
      >
        <Select<OptionType>
          className={dotStyles.base}
          options={options}
          value={mode.type}
          onChange={(v) => {
            if (v === HookType.default || v === HookType.value) {
              mode.setType(v);
              mode.update();
            }
          }}
        />
        {mode.isValue && <ConfigContentView mode={mode} defaultValues={uaInfo} />}
      </ConfigItemY>
    )}</HookModeContent>
  </> : <Spin indicator={<LoadingOutlined spin />} />
}

const ConfigContentView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInput>
  defaultValues: ClientHintsInfo
}) => {
  const resetUserAgent = () => {
    mode.input.ua = { ...defaultValues.ua }
    mode.update()
  }

  const resetUserAgentData = () => {
    mode.input.uaData = {
      ...defaultValues.uaData,
      formFactors: defaultValues.uaData.formFactors.join(', '),
      versions: versionsToStr(defaultValues.uaData.versions),
    }
    mode.update()
  }

  const items = useMemo<CollapseProps['items']>(() => [
    {
      key: '1',
      label: 'UserAgent',
      children: <UserAgentView mode={mode} defaultValues={defaultValues} />,
      extra: <ResetButton onPress={resetUserAgent} />,
    },
    {
      key: '2',
      label: 'UserAgentData',
      children: <UserAgentDataView mode={mode} defaultValues={defaultValues} />,
      extra: <ResetButton onPress={resetUserAgentData} />,
    },
  ].map((v) => ({
    ...v,
    className: 'mb-2 last:mb-0 bg-default-100 !border-none !rounded [&_.ant-collapse-content]:bg-default-100',
  })), [mode]);

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

const UserAgentView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInput>
  defaultValues: ClientHintsInfo
}) => {
  const raw = defaultValues.ua;
  const data = mode.input.ua;

  return <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
    <label>userAgent</label>
    <Input
      placeholder={raw.userAgent}
      value={data.userAgent}
      onInput={({ target }: any) => {
        data.userAgent = target.value || raw.userAgent;
        mode.update()
      }}
    />

    <label>appVersion</label>
    <Input
      placeholder={raw.appVersion}
      value={data.appVersion}
      onInput={({ target }: any) => {
        data.appVersion = target.value || raw.appVersion;
        mode.update()
      }}
    />

    <label>platform</label>
    <Input
      placeholder={raw.platform}
      value={data.platform}
      onInput={({ target }: any) => {
        data.platform = target.value || raw.platform;
        mode.update()
      }}
    />
  </div>
}

const UserAgentDataView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInput>
  defaultValues: ClientHintsInfo
}) => {
  const raw = defaultValues.uaData;
  const data = mode.input.uaData;

  return <div className="flex flex-col gap-1">
    <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center [&>label]:text-right">
      <label>mobile</label>
      <div>
        <Checkbox
          checked={data.mobile}
          onChange={({ target }: any) => {
            data.mobile = target.checked
            mode.update()
          }}
        />
      </div>

      <label>arch</label>
      <Input
        placeholder={raw.arch}
        value={data.arch}
        onInput={({ target }: any) => {
          data.arch = target.value || raw.arch;
          mode.update()
        }}
      />

      <label>bitness</label>
      <Input
        placeholder={raw.bitness}
        value={data.bitness}
        onInput={({ target }: any) => {
          data.bitness = target.value || raw.bitness;
          mode.update()
        }}
      />

      <label>platform</label>
      <Input
        placeholder={raw.platform}
        value={data.platform}
        onInput={({ target }: any) => {
          data.platform = target.value || raw.platform;
          mode.update()
        }}
      />

      <label>platformVersion</label>
      <Input
        placeholder={raw.platformVersion}
        value={data.platformVersion}
        onInput={({ target }: any) => {
          data.platformVersion = target.value || raw.platformVersion;
          mode.update()
        }}
      />

      <label>model</label>
      <Input
        placeholder={raw.model}
        value={data.model}
        onInput={({ target }: any) => {
          data.model = target.value || raw.model;
          mode.update()
        }}
      />

      <label>formFactors</label>
      <Input
        placeholder={raw.formFactors.join(', ')}
        value={data.formFactors}
        onInput={({ target }: any) => {
          data.formFactors = target.value;
          mode.update()
        }}
      />

      <label>uaFullVersion</label>
      <Input
        placeholder={raw.uaFullVersion}
        value={data.uaFullVersion}
        onInput={({ target }: any) => {
          data.uaFullVersion = target.value || raw.uaFullVersion;
          mode.update()
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
        value={data.versions}
        onInput={({ target }: any) => {
          data.versions = target.value;
          mode.update()
        }}
      />
    </div>
  </div>
}

export default ClientHintsConfigItem