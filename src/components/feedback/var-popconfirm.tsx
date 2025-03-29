import { Popconfirm, type PopconfirmProps, Tooltip, type TooltipProps } from "antd"
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type VariablePopconfirmProps = {
  tooltip?: string | TooltipProps
}

export const VariablePopconfirm = ({ tooltip, ...props }: VariablePopconfirmProps & PopconfirmProps) => {
  const [t] = useTranslation()
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const tooltipProps = useMemo<TooltipProps>(() => {
    let res: TooltipProps = {
      placement: props.placement,
    }
    if (tooltip === undefined) {
      return res
    } else if (typeof tooltip === 'string') {
      res.title = tooltip
      return res
    } else {
      return { ...res, ...tooltip }
    }
  }, [tooltip])

  return <Tooltip {...tooltipProps}
    open={hovered}
    onOpenChange={(open: boolean) => {
      setHovered(open);
      setClicked(false);
    }}>
    <Popconfirm
      open={clicked}
      onOpenChange={(open: boolean) => {
        setHovered(false);
        setClicked(open);
      }}
      okText={t('g.confirm')}
      cancelText={t('g.cancel')}
      {...props} />
  </Tooltip>
}

export default VariablePopconfirm