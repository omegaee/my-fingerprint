import { DownOutlined, MinusOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';

const fKeys: string[] = ['appVersion', 'platform', 'userAgent', 'language', 'languages', 'hardwareConcurrency', 'height', 'width', 'colorDepth', 'pixelDepth', 'glVendor', 'glRenderer', 'timezone', 'canvas', 'audio', 'font', 'webgl', 'webgpu', 'webrtc']

export type FHookRecordProps = {
  records?: Partial<Record<string, number>>
}

export const FHookRecord = function ({ records }: FHookRecordProps) {
  const arrowRef = useRef<HTMLDivElement>(null)
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!arrowRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = arrowRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      if (atBottom && !isBottom) {
        setIsBottom(true);
      } else if (!atBottom && isBottom) {
        setIsBottom(false);
      }
    };
    arrowRef.current?.addEventListener("scroll", handleScroll);
    return () => arrowRef.current?.removeEventListener("scroll", handleScroll);
  }, [arrowRef.current, isBottom])

  return <section className="relative h-full [--arrow-h:18px]">
    <div ref={arrowRef} className="h-full overflow-y-auto no-scrollbar">
      {fKeys.map((key) =>
        <div key={key}
          className="p-1 rounded-sm flex justify-between items-center hover:bg-[--ant-color-primary-bg-hover] duration-300">
          <span>{key}</span>
          <span className="font-bold">× {records?.[key] ?? 0}</span>
        </div>)}
      <div className='h-[--arrow-h]'></div>
    </div>
    <div className="h-[--arrow-h] absolute bottom-0 left-0 right-0 flex justify-center items-end bg-gradient-to-b from-transparent to-70% to-[--ant-color-bg-layout]">
      {isBottom ?
        <MinusOutlined className='text-xs' /> :
        <DownOutlined className='animate-pulse text-xs' />}
    </div>
  </section>
}
export default FHookRecord