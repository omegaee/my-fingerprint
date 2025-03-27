import { Button, Popconfirm, Popover } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";

type PermissionStatus = 'on' | 'off' | 'unknown'

const isAuthorized = async (permission: string): Promise<PermissionStatus> => {
  try {
    return await chrome.permissions.contains({ permissions: [permission] }) ? 'on' : 'off'
  } catch (err) {
    return 'unknown'
  }
}

export const PermissionView = ({ className }: {
  className?: string
}) => {
  const [t] = useTranslation()
  const [perms, setPerms] = useState<Record<string, PermissionStatus>>({})
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const opts = chrome.runtime.getManifest().optional_permissions
    if (!opts?.length) return;

    const promises: Promise<PermissionStatus>[] = []
    for (const opt of opts) {
      promises.push(isAuthorized(opt))
    }

    Promise.all(promises).then((data) => {
      const res = opts.reduce((prev, value, index) => {
        prev[value] = data[index]
        return prev
      }, {} as Record<string, PermissionStatus>)
      setPerms(res)
    })
  }, [version])

  const permKeys = Object.keys(perms)

  return <section className={className}>
    {permKeys.length ?
      permKeys.map((perm) => <PermissionItem
        key={perm}
        name={perm}
        status={perms[perm]}
        onChange={() => setVersion(version + 1)}
      />) :
      <span className="text-[--ant-color-text-tertiary]">{t('tip.label.no-auth-required')}</span>}
  </section>
}

const PermissionItem = ({
  name, status, onChange
}: {
  name: string
  status: PermissionStatus
  onChange?: (status: PermissionStatus) => void
}) => {
  const [t] = useTranslation()
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const switchAuthStatus = useCallback(async () => {
    if (status === 'on') {
      if (await chrome.permissions.remove({ permissions: [name] })) {
        onChange?.('off')
      }
    } else if (status === 'off') {
      if (await chrome.permissions.request({ permissions: [name] })) {
        onChange?.('on')
      }
    }
  }, [])

  const btn = <Button
    className="font-mono font-bold"
    type={status === 'on' ? 'primary' : 'default'}
    danger={status === 'unknown'}
    onClick={status === 'off' ? switchAuthStatus : undefined}
    children={name} />

  return <Popover
    content={<div className="flex flex-col justify-center items-center">
      <div>{t('perm.status.' + status)}</div>
      <Markdown>{t('perm.desc.' + name)}</Markdown>
    </div>}
    trigger="hover"
    open={hovered}
    onOpenChange={(open: boolean) => {
      setHovered(open);
      setClicked(false);
    }}>{status === 'on' ?
      <Popconfirm
        title={t('tip.if.remove-permission')}
        okText={t('g.confirm')}
        cancelText={t('g.cancel')}
        open={clicked}
        onOpenChange={(open: boolean) => {
          setHovered(false);
          setClicked(open);
        }}
        onConfirm={switchAuthStatus}>{btn}
      </Popconfirm> : btn}
  </Popover>
}

export default PermissionView