import { Divider } from "antd"
import { useTranslation } from "react-i18next";
import MoreConfigView from "./config";
import SubscribeView from "./subscribe";
import TipIcon from "@/components/data/tip-icon";
import { Md } from "@/components/data/markdown";
import PresetPanel from "./preset";

export type MoreViewProps = {
}

export const MoreView = ({ }: MoreViewProps) => {
  const [t] = useTranslation()

  return <div className="h-full overflow-y-auto no-scrollbar">
    <div className="mb-3">
      <Divider rootClassName="!mt-0 !mb-3" orientation='center'>{t('label.config-file')}</Divider>
      <MoreConfigView className="flex flex-wrap justify-center items-center gap-2" />
    </div>
    <div className="my-3">
      <Divider rootClassName="!my-3" orientation='center'>
        <div className="flex justify-center items-center gap-2">
          {t('label.subscribe')}
          <TipIcon.Question content={<Md>{t('desc.subscribe', { joinArrays: '\n\n' })}</Md>} />
        </div>
      </Divider>
      <SubscribeView />
    </div>
    <div className="mt-3">
      <Divider rootClassName="!mb-3" orientation='center'>{t('label.preset-panel')}</Divider>
      <PresetPanel />
    </div>
  </div>
}

export default MoreView