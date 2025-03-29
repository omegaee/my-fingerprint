import { Divider } from "antd"
import { type MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import PermissionView from "./permission";
import MoreConfigView from "./config";

export type MoreViewProps = {
  msgApi?: MessageInstance
}

export const MoreView = ({ msgApi }: MoreViewProps) => {
  const [t] = useTranslation()

  return <section>
    <Divider rootClassName="!mt-0 !mb-2" orientation='center'>{t('label.config-file')}</Divider>
    <MoreConfigView className="flex flex-wrap justify-center items-center gap-2"/>
    <Divider rootClassName="!my-2" orientation='center'>{t('label.permission')}</Divider>
    <PermissionView className="flex flex-wrap justify-center items-center gap-2" />
    <Divider rootClassName="!my-3" />
  </section>
}

export default MoreView