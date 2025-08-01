export type IframeNoticeItemProps = {
  src: string
  count?: number
}

export const IframeNoticeItem = ({ src, count }: IframeNoticeItemProps) => {  
  return <div className="py-1 px-2 flex justify-between items-center font-bold rounded hover:bg-[--ant-color-primary-bg-hover] border-b border-b-[--ant-color-border] last:border-none">
    <div>{src}</div>
    <div className="">x {count}</div>
  </div>
}

export default IframeNoticeItem