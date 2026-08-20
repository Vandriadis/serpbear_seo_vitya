import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import Icon from '../common/Icon';
import { useRefreshDomainHealth } from '../../services/domains';

type DomainAliveStatusProps = {
   domain: DomainType,
   canRefresh?: boolean,
   compact?: boolean,
}

const DomainAliveStatus = ({ domain, canRefresh = true, compact = false }: DomainAliveStatusProps) => {
   const { mutate: refreshHealth, isLoading } = useRefreshDomainHealth();
   const checkedAt = domain.alive_checked_at || '';
   const hasCheck = !!checkedAt;
   const isAlive = hasCheck && !!domain.alive;
   const isDown = hasCheck && !domain.alive;

   let dotColor = 'bg-gray-300';
   let statusLabel = 'Not checked yet';
   if (isAlive) {
      dotColor = 'bg-emerald-500';
      statusLabel = 'Alive';
   } else if (isDown) {
      dotColor = 'bg-red-500';
      statusLabel = 'Down';
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

   return (
      <div
         className={`domain_alive_status relative group inline-flex items-center gap-1.5 ${compact ? '' : 'px-1'}`}
         title={tooltipLines}
         onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
         onKeyDown={(e) => e.stopPropagation()}
         role="presentation"
      >
         <span
            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${dotColor} ${isAlive ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.25)]' : ''}`}
            aria-label={statusLabel}
         />
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

         {/* Hover panel */}
         <div
            className="pointer-events-none absolute left-0 top-full mt-1 z-30 w-56 p-2.5 rounded border border-gray-200
               bg-white shadow-lg text-[11px] text-slate-600 leading-relaxed
               opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity"
         >
            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
               <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
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

         {canRefresh && (
            <button
               type="button"
               title="Recheck domain availability"
               disabled={isLoading}
               className="shrink-0 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition"
               onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  refreshHealth(domain.domain);
               }}
            >
               <Icon type={isLoading ? 'loading' : 'reload'} size={12} />
            </button>
         )}
      </div>
   );
};

export default DomainAliveStatus;
