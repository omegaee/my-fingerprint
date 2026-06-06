import { useTranslation } from "react-i18next";
import MoreConfigView from "./config";
import SubscribeView from "./subscribe";
import TipIcon from "@/components/data/tip-icon";
import { Md } from "@/components/data/markdown";
import PresetPanel from "./preset";
import SiteCleanupView from "./site-cleanup";
import { cn } from "@/utils/style";

export type MoreViewProps = {
}

export const MoreView = ({ }: MoreViewProps) => {
  const [t] = useTranslation()

  return <div className="h-full overflow-y-auto no-scrollbar flex flex-col gap-4">
    <ItemView label={t('label.config-file')}>
      <MoreConfigView className="flex flex-wrap justify-center items-center gap-2" />
    </ItemView>

    <ItemView label={<>
      {t('label.subscribe')}
      <TipIcon.Question content={<Md>{t('desc.subscribe', { joinArrays: '\n\n' })}</Md>} />
    </>}>
      <SubscribeView />
    </ItemView>

    <ItemView
      label={<>
        {t('label.site-cleanup')}
        <TipIcon.Question content={<Md>{t('desc.site-cleanup', { joinArrays: '\n\n' })}</Md>} />
      </>}
      className="p-0"
    >
      <SiteCleanupView />
    </ItemView>

    <ItemView label={t('label.preset-panel')}>
      <PresetPanel />
    </ItemView>
  </div>
}

const ItemView = ({ label, className, children }: {
  label: React.ReactNode
  className?: string
  children: React.ReactNode
}) => {
  return <section className="flex flex-col justify-center items-center gap-2">
    <h3 className="text-sm flex items-center justify-center gap-1">{label}</h3>
    <div className={cn("bg-[--ant-color-bg-container] w-full p-2 rounded-lg overflow-hidden", className)}>
      {children}
    </div>
  </section>
}

export default MoreView
