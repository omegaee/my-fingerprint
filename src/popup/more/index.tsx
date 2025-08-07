import { Divider } from "antd"
import { useTranslation } from "react-i18next";
import MoreConfigView from "./config";
import SubscribeView from "./subscribe";
import TipIcon from "@/components/data/tip-icon";
import Markdown from "react-markdown";

export type MoreViewProps = {
}

export const MoreView = ({ }: MoreViewProps) => {
  const [t] = useTranslation()

  return <section>
    <Divider rootClassName="!mt-0 !mb-3" orientation='center'>{t('label.config-file')}</Divider>
    <MoreConfigView className="flex flex-wrap justify-center items-center gap-2" />
    <Divider rootClassName="!my-3" orientation='center'>
      <div className="flex justify-center items-center gap-2">
        {t('label.subscribe')}
        <TipIcon.Question content={<Markdown className='max-h-[220px] overflow-auto [&_ul]:list-disc [&_ul]:ml-3' children={t('desc.subscribe')} />} />
      </div>
    </Divider>
    <SubscribeView />
    {/* <Divider rootClassName="!my-3" orientation='center'>{t('label.permission')}</Divider>
    <PermissionView className="flex flex-wrap justify-center items-center gap-2" /> */}
    <Divider rootClassName="!mt-3 !mb-0" />
  </section>
}

export default MoreView