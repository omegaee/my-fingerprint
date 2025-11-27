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

  return <div className="h-full overflow-y-auto no-scrollbar flex flex-col gap-2">
    <div className="p-2 bg-[--ant-color-bg-container] rounded-lg">
      <h3 className="mb-3 text-center text-sm">{t('label.config-file')}</h3>
      <MoreConfigView className="flex flex-wrap justify-center items-center gap-2" />
    </div>
    <div className="p-2 bg-[--ant-color-bg-container] rounded-lg">
      <div className="mb-3 flex justify-center items-center gap-2">
        <h3 className="text-sm">{t('label.subscribe')}</h3>
        <TipIcon.Question content={<Md>{t('desc.subscribe', { joinArrays: '\n\n' })}</Md>} />
      </div>
      <SubscribeView />
    </div>
    <div className="p-2 bg-[--ant-color-bg-container] rounded-lg">
      <h3 className="mb-2 text-center text-sm">{t('label.preset-panel')}</h3>
      <Divider className="m-0" />
      <PresetPanel />
    </div>
  </div>
}

export default MoreView