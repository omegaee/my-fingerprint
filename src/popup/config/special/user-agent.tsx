import { useStorageStore } from "@/popup/stores/storage"
import { ConfigItemY, HookModeContent } from "../item"
import { selectStatusDotStyles as dotStyles } from "../styles"
import Markdown from "react-markdown"
import TipIcon from "@/components/data/tip-icon"
import { useTranslation } from "react-i18next"
import { Collapse, CollapseProps, Input, Select, Spin, Switch } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { HookModeHandler } from "@/utils/hooks"
import { cn } from "@/utils/style"
import { useEffect, useMemo, useState } from "react"
import { HookType } from '@/types/enum'

const userAgentData: any = (navigator as any).userAgentData;

type OptionType = (string & {}) | HookType

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

const UserAgentConfigItem = ({ }: {}) => {
  const { t, i18n } = useTranslation()
  const [uaInfo, setUaInfo] = useState<UserAgentInfo>()

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
    <HookModeContent<UserAgentInfo, UserAgentInfo>
      isMakeSelect={false}
      mode={fp.navigator.ua}
      parser={{
        toInput: (value) => value ?? { ...uaInfo },
        toValue: (input) => input,
      }}
    >{(mode) => (
      <ConfigItemY
        label={t('item.title.ua')}
        className={cn(!mode.isDefault && dotStyles.warning)}
        endContent={<TipIcon.Question content={<Markdown>{t('item.desc.ua')}</Markdown>} />}
      >
        <Select<OptionType>
          className={dotStyles.base}
          options={options}
          value={mode.type}
          onChange={(v) => {
            if (v === HookType.default || v === HookType.value) {
              mode.setType(v);
            }
          }}
        />
        {mode.isValue && <ConfigContentView mode={mode} defaultValues={uaInfo} />}
      </ConfigItemY>
    )}</HookModeContent>
  </> : <Spin indicator={<LoadingOutlined spin />} />
}

const ConfigContentView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInfo>
  defaultValues: UserAgentInfo
}) => {
  const items = useMemo<CollapseProps['items']>(() => [
    {
      key: '1',
      label: 'UserAgent',
      children: <UserAgentView mode={mode} defaultValues={defaultValues} />,
    },
    {
      key: '2',
      label: 'UserAgentData',
      children: <UserAgentDataView mode={mode} defaultValues={defaultValues} />,
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

const UserAgentView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInfo>
  defaultValues: UserAgentInfo
}) => {
  const { t } = useTranslation()
  const data = mode.input.ua

  return <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center">
    <label>userAgent</label>
    <Input
      value={data.userAgent}
      onInput={({ target }: any) => {
        data.userAgent = target.value
        mode.update()
      }}
    />

    <label>appVersion</label>
    <Input
      value={data.appVersion}
      onInput={({ target }: any) => {
        data.appVersion = target.value
        mode.update()
      }}
    />

    <label>platform</label>
    <Input
      value={data.platform}
      onInput={({ target }: any) => {
        data.platform = target.value
        mode.update()
      }}
    />
  </div>
}

const parseVersions = (v: string) => {
  const arr = v.split(',').map(v => v.trim()).filter(v => !!v)
  return arr.map(v => {
    const [brand, version] = v.split('=').map(v => v.trim())
    return {
      brand,
      version,
    }
  })
}

const UserAgentDataView = ({ mode, defaultValues }: {
  mode: HookModeHandler<UserAgentInfo>
  defaultValues: UserAgentInfo
}) => {
  const data = mode.input.uaData
  const versions = data.versions.map(v => `${v.brand}=${v.version}`).join(',\n')

  return <div className="flex flex-col gap-1">
    <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2 items-center">
      <label>mobile</label>
      <div>
        <Switch
          checked={data.mobile}
          onChange={(checked) => {
            data.mobile = checked
            mode.update()
          }}
        />
      </div>

      <label>arch</label>
      <Input
        value={data.arch}
        onInput={({ target }: any) => {
          data.arch = target.value
          mode.update()
        }}
      />

      <label>bitness</label>
      <Input
        value={data.bitness}
        onInput={({ target }: any) => {
          data.bitness = target.value
          mode.update()
        }}
      />

      <label>platform</label>
      <Input
        value={data.platform}
        onInput={({ target }: any) => {
          data.platform = target.value
          mode.update()
        }}
      />

      <label>platformVersion</label>
      <Input
        value={data.platformVersion}
        onInput={({ target }: any) => {
          data.platformVersion = target.value
          mode.update()
        }}
      />

      <label>model</label>
      <Input
        value={data.model}
        onInput={({ target }: any) => {
          data.model = target.value
          mode.update()
        }}
      />

      <label>formFactors</label>
      <Input
        value={data.formFactors.join(', ')}
        onInput={(e: any) => {
          const value = e.target.value as string
          data.formFactors = value.split(',').map(v => v.trim()).filter(v => !!v)
          mode.update()
        }}
      />

      <label>uaFullVersion</label>
      <Input
        value={data.uaFullVersion}
        onInput={({ target }: any) => {
          data.uaFullVersion = target.value
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
        value={versions}
        onInput={({ target }: any) => {
          data.versions = parseVersions(target.value)
          mode.update()
        }}
      />
    </div>
  </div>
}

export default UserAgentConfigItem