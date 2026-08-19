import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../../components/common/Sidebar';
import TopBar from '../../../../components/common/TopBar';
import DomainHeader from '../../../../components/domains/DomainHeader';
import AddDomain from '../../../../components/domains/AddDomain';
import DomainSettings from '../../../../components/domains/DomainSettings';
import exportCSV from '../../../../utils/client/exportcsv';
import Settings from '../../../../components/settings/Settings';
import { useFetchDomains } from '../../../../services/domains';
import { useFetchSCInsight } from '../../../../services/searchConsole';
import SCInsight from '../../../../components/insight/Insight';
import { useFetchSettings } from '../../../../services/settings';
import Footer from '../../../../components/common/Footer';
import { canWriteRole, useCurrentUser } from '../../../../services/auth';

const InsightPage: NextPage = () => {
   const router = useRouter();
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [scDateFilter, setSCDateFilter] = useState('thirtyDays');
   const [insightPeriod, setInsightPeriod] = useState(30);
   const [compareEnabled, setCompareEnabled] = useState(false);
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const { data: currentUserData } = useCurrentUser();
   const readOnly = !canWriteRole(currentUserData?.user?.role);
   const scConnected = !!(appSettings && appSettings?.settings?.search_console_integrated);
   const domainLoaded = !!(domainsData?.domains?.length) && scConnected;
   const { data: insightData, isLoading: insightLoading } = useFetchSCInsight(
      router, domainLoaded, insightPeriod,
   );
   // Previous period: e.g. if period=30, fetch days 31-60 via period=60 then slice
   // Simpler: use a dedicated offset-based approach — fetch previous N days by
   // passing period * 2 and splitting. But GSC API doesn't support offset.
   // Instead, we fetch the same period but shifted — not supported by our API.
   // Simplest approach: fetch period*2 and split stats in half on the frontend.
   const { data: compareData } = useFetchSCInsight(
      router, domainLoaded && compareEnabled, insightPeriod * 2,
   );

   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
   const theInsight: InsightDataType = insightData && insightData.data ? insightData.data : {};

   // Split the double-period stats into previous period (first half)
   const prevPeriodStats = useMemo(() => {
      if (!compareEnabled || !compareData?.data?.stats) return null;
      const allStats: SearchAnalyticsStat[] = compareData.data.stats;
      const halfIdx = Math.max(0, allStats.length - insightPeriod);
      return allStats.slice(0, halfIdx);
   }, [compareEnabled, compareData, insightPeriod]);

   const activDomain: DomainType|null = useMemo(() => {
      let active:DomainType|null = null;
      if (domainsData?.domains && router.query?.slug) {
         active = domainsData.domains.find((x:DomainType) => x.slug === router.query.slug) || null;
      }
      return active;
   }, [router.query.slug, domainsData]);

   const domainHasScAPI = useMemo(() => {
      const domainSc = activDomain?.search_console ? JSON.parse(activDomain.search_console) : {};
      return !!(domainSc?.client_email && domainSc?.private_key);
   }, [activDomain]);

   return (
      <div className="Domain ">
         {activDomain && activDomain.domain
         && <Head>
               <title>{`${activDomain.domain} - SerpBear` } </title>
            </Head>
         }
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto">
            <Sidebar domains={theDomains} showAddModal={() => setShowAddDomain(true)} readOnly={readOnly} />
            <div className="domain_keywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
               {activDomain && activDomain.domain
               ? <DomainHeader
                  domain={activDomain}
                  domains={theDomains}
                  showAddModal={() => console.log('XXXXX')}
                  showSettingsModal={setShowDomainSettings}
                  exportCsv={() => exportCSV([], activDomain.domain, scDateFilter)}
                  scFilter={scDateFilter}
                  setScFilter={(item:string) => setSCDateFilter(item)}
                  readOnly={readOnly}
                  />
                  : <div className='w-full lg:h-[100px]'></div>
               }
               <SCInsight
               isLoading={insightLoading}
               domain={activDomain}
               insight={theInsight}
               isConsoleIntegrated={scConnected || domainHasScAPI}
               period={insightPeriod}
               onPeriodChange={setInsightPeriod}
               compareEnabled={compareEnabled}
               onCompareToggle={setCompareEnabled}
               prevPeriodStats={prevPeriodStats}
               />
            </div>
         </div>

         {!readOnly && (
            <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
               <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
            </CSSTransition>
         )}

         {!readOnly && (
            <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
               <DomainSettings
               domain={showDomainSettings && theDomains && activDomain && activDomain.domain ? activDomain : false}
               closeModal={setShowDomainSettings}
               />
            </CSSTransition>
         )}
         {!readOnly && (
            <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
                <Settings closeSettings={() => setShowSettings(false)} />
            </CSSTransition>
         )}
         <Footer currentVersion={appSettings?.settings?.version ? appSettings.settings.version : ''} />
      </div>
   );
};

export default InsightPage;
