import dayjs from 'dayjs';
import type { MouseEvent } from 'react';
import TimeAgo from 'react-timeago';
import { useRefreshDomainHealth } from '../../services/domains';
import { ActivityIcon } from '../icons/activity';
import { CircleXIcon } from '../icons/circle-x';
import { LoaderCircleIcon } from '../icons/loader-circle';
import { RefreshCWIcon } from '../icons/refresh-cw';

type DomainAliveStatusProps = {
   domain: DomainType,
   canRefresh?: boolean,
   compact?: boolean,
   /** Place under domain thumbnail: stacked icon + refresh. */
   underThumb?: boolean,
}

const StatusGlyph = ({
   isAlive, isDown, hasCheck, iconSize, iconColor,
}: {
   isAlive: boolean,
   isDown: boolean,
   hasCheck: boolean,
   iconSize: number,
   iconColor: string,
}) => {
   if (isAlive) {
      return <ActivityIcon size={iconSize} className={iconColor} loop={true} />;
   }
   if (isDown) {
      return <CircleXIcon size={iconSize} className={iconColor} />;
   }
   return <LoaderCircleIcon size={iconSize} className={iconColor} spinning={!hasCheck} />;
};

const DomainAliveStatus = ({
   domain, canRefresh = true, compact = false, underThumb = false,
}: DomainAliveStatusProps) => {
   const { mutate: refreshHealth, isLoading } = useRefreshDomainHealth();
   const checkedAt = domain.alive_checked_at || '';
   const hasCheck = !!checkedAt;
   const isAlive = hasCheck && !!domain.alive;
   const isDown = hasCheck && !domain.alive;

   let statusLabel = 'Not checked yet';
   let iconColor = 'text-gray-400';
   if (isAlive) {
      statusLabel = 'Alive';
      iconColor = 'text-emerald-500';
   } else if (isDown) {
      statusLabel = 'Down';
      iconColor = 'text-red-500';
   }

   const checkedLabel = checkedAt
      ? dayjs(checkedAt).format('DD-MMM-YYYY, hh:mm:ss A')
      : 'Never';

   const tooltipLines = [
      `Status: ${statusLabel}`,
      `Checked: ${checkedLabel}`,
      domain.alive_status_code != null ? `HTTP: ${domain.alive_status_code}` : null,
      domain.alive_error ? `Error: ${domain.alive_error}` : null,
   ].filter(Boolean).join('\n');

   const iconSize = underThumb ? 16 : 15;

   const onRefresh = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      refreshHealth(domain.domain);
   };

   const tooltipPanel = (
      <div
         className={`pointer-events-none absolute z-30 w-56 p-2.5 rounded border border-gray-200
            bg-white shadow-lg text-[11px] text-slate-600 leading-relaxed
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity
            ${underThumb ? 'left-1/2 -translate-x-1/2 top-full mt-1.5' : 'left-0 top-full mt-1'}`}
      >
         <div className="font-semibold mb-1 flex items-center gap-1.5 text-slate-800">
            <StatusGlyph
               isAlive={isAlive}
               isDown={isDown}
               hasCheck={hasCheck}
               iconSize={12}
               iconColor={iconColor}
            />
            {statusLabel}
         </div>
         <div><span className="text-gray-400">Checked:</span> {checkedLabel}</div>
         {domain.alive_status_code != null && (
            <div><span className="text-gray-400">HTTP:</span> {domain.alive_status_code}</div>
         )}
         {domain.alive_error && (
            <div className="text-red-500 break-words"><span className="text-gray-400">Error:</span> {domain.alive_error}</div>
         )}
         {!hasCheck && (
            <div className="text-gray-400 mt-1">Auto-check runs every 30 minutes.</div>
         )}
      </div>
   );

   const refreshButton = canRefresh ? (
      <button
         type="button"
         title="Recheck domain availability"
         disabled={isLoading}
         className="text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition"
         onClick={onRefresh}
      >
         <RefreshCWIcon size={12} spinning={isLoading} />
      </button>
   ) : null;

   if (underThumb) {
      return (
         <div
            className="domain_alive_status relative group flex flex-col items-center gap-0.5 mt-1.5"
            title={tooltipLines}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
         >
            <div className={`${iconColor} drop-shadow-sm`} aria-label={statusLabel}>
               <StatusGlyph
                  isAlive={isAlive}
                  isDown={isDown}
                  hasCheck={hasCheck}
                  iconSize={iconSize}
                  iconColor={iconColor}
               />
            </div>
            {refreshButton}
            {tooltipPanel}
         </div>
      );
   }

   return (
      <div
         className={`domain_alive_status relative group inline-flex items-center gap-1.5 ${compact ? '' : 'px-1'}`}
         title={tooltipLines}
         onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
         onKeyDown={(e) => e.stopPropagation()}
         role="presentation"
      >
         <div className={iconColor} aria-label={statusLabel}>
            <StatusGlyph
               isAlive={isAlive}
               isDown={isDown}
               hasCheck={hasCheck}
               iconSize={iconSize}
               iconColor={iconColor}
            />
         </div>
         {!compact && (
            <span className="text-[11px] text-gray-500 hidden sm:inline">
               {hasCheck ? (
                  <>
                     {statusLabel} · <TimeAgo title={checkedLabel} date={checkedAt} />
                  </>
               ) : (
                  statusLabel
               )}
            </span>
         )}
         {tooltipPanel}
         {refreshButton}
      </div>
   );
};

export default DomainAliveStatus;
