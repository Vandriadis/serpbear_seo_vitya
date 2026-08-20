/* eslint-disable @next/next/no-img-element */
import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import Link from 'next/link';
import Icon from '../common/Icon';
import DomainAliveStatus from './DomainAliveStatus';

type DomainItemProps = {
   domain: DomainType,
   selected: boolean,
   isConsoleIntegrated: boolean,
   thumb: string,
   updateThumb: Function,
   onAttachTags: Function,
   canRefreshHealth?: boolean,
}

const DomainItem = ({
   domain, selected, isConsoleIntegrated = false, thumb, updateThumb, onAttachTags, canRefreshHealth = true,
}: DomainItemProps) => {
   const {
      keywordsUpdated, slug, keywordCount = 0, avgPosition = 0,
      scVisits = 0, scImpressions = 0, scPosition = 0, tags = [],
   } = domain;

   return (
      <div className={`domItem bg-white border rounded w-full text-sm mb-3 hover:border-indigo-200 ${selected ? '' : ''}`}>
         <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className={`flex flex-1 p-3 items-center min-w-0 ${!isConsoleIntegrated ? 'lg:basis-2/5' : ''}`}>
               <Link href={`/domain/${slug}`} passHref={true}>
                  <a className="group domain_thumb w-12 h-12 mr-3 bg-slate-100 rounded
                     border border-gray-200 overflow-hidden flex justify-center relative shrink-0">
                     <button
                        className="absolute right-0 top-0 text-gray-400 p-0.5 transition-all
                        invisible opacity-0 group-hover:visible group-hover:opacity-100 hover:text-gray-600 z-10"
                        title="Reload Website Screenshot"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateThumb(domain.domain); }}
                     >
                        <Icon type="reload" size={10} />
                     </button>
                     <img
                        className={`self-center ${!thumb ? 'max-w-[28px]' : ''}`}
                        src={thumb || `https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                        alt={domain.domain}
                     />
                  </a>
               </Link>
               <div className="domain_details flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 min-w-0">
                     <Link href={`/domain/${slug}`} passHref={true}>
                        <a className="font-semibold text-sm truncate min-w-0" title={domain.domain}>{domain.domain}</a>
                     </Link>
                     <DomainAliveStatus domain={domain} canRefresh={canRefreshHealth} compact={true} />
                  </div>
                  <Link href={`/domain/${slug}`} passHref={true}>
                     <a className="block">
                        {keywordsUpdated && (
                           <span className="text-gray-500 text-xs">
                              Updated <TimeAgo title={dayjs(keywordsUpdated).format('DD-MMM-YYYY, hh:mm:ss A')} date={keywordsUpdated} />
                           </span>
                        )}
                        {tags.length > 0 && (
                           <div className="mt-1.5 flex flex-wrap gap-1">
                              {tags.map((tag) => (
                                 <span
                                    key={tag}
                                    className="inline-flex items-center text-[10px] leading-none px-1.5 py-0.5
                                       rounded bg-indigo-50 text-indigo-600 border border-indigo-100"
                                 >
                                    {tag}
                                 </span>
                              ))}
                           </div>
                        )}
                     </a>
                  </Link>
               </div>
            </div>

            <div className="flex items-center gap-2 px-3 pb-3 lg:pb-0 lg:pr-2 self-center">
               <button
                  type="button"
                  title="Attach tags"
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded border border-gray-200
                     text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition"
                  onClick={(e) => { e.preventDefault(); onAttachTags(domain); }}
               >
                  <Icon type="tags" size={13} />
                  <span className="hidden sm:inline">Tags</span>
               </button>
            </div>

            <Link href={`/domain/${slug}`} passHref={true}>
               <a className="flex flex-1 p-3 pt-0 lg:pt-3 lg:pl-0">
                  <div className="relative flex-1">
                     <div className="bg-indigo-50 p-0.5 px-1.5 text-[10px] rounded-full absolute ml-2 mt-[-6px] z-[1]">
                        <Icon type="tracking" size={11} color="#364aff" /> Tracker
                     </div>
                     <div
                        className="dom_stats flex flex-1 font-semibold text-lg p-2.5 pt-3.5
                           rounded border border-[#E9EBFF] text-center h-full items-center"
                     >
                        <div className="flex-1 relative">
                           <span className="block text-[10px] lg:text-xs text-gray-500 mb-0.5">Keywords</span>
                           {keywordCount}
                        </div>
                        <div className="flex-1 relative">
                           <span className="block text-[10px] lg:text-xs text-gray-500 mb-0.5">Avg position</span>
                           {avgPosition}
                        </div>
                     </div>
                  </div>
               </a>
            </Link>

            {isConsoleIntegrated && (
               <Link href={`/domain/${slug}`} passHref={true}>
                  <a className="flex flex-1 p-3 pt-0 lg:pt-3 lg:pl-0 lg:basis-52">
                     <div className="relative flex-1">
                        <div className="bg-indigo-50 p-0.5 px-1.5 text-[10px] rounded-full absolute ml-2 mt-[-6px] z-[1]">
                           <Icon type="google" size={11} /> Search Console (7d)
                        </div>
                        <div
                           className="dom_sc_stats flex flex-1 h-full font-semibold text-lg p-2.5 pt-3.5
                              rounded border border-[#E9EBFF] text-center items-center"
                        >
                           <div className="flex-1 relative">
                              <span className="block text-[10px] lg:text-xs text-gray-500 mb-0.5">Visits</span>
                              {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' })
                                 .format(scVisits).replace('T', 'K')}
                           </div>
                           <div className="flex-1 relative">
                              <span className="block text-[10px] lg:text-xs text-gray-500 mb-0.5">Impr.</span>
                              {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' })
                                 .format(scImpressions).replace('T', 'K')}
                           </div>
                           <div className="flex-1 relative">
                              <span className="block text-[10px] lg:text-xs text-gray-500 mb-0.5">Avg pos</span>
                              {scPosition}
                           </div>
                        </div>
                     </div>
                  </a>
               </Link>
            )}
         </div>
      </div>
   );
};

export default DomainItem;
