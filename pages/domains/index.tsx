import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import toast, { Toaster } from 'react-hot-toast';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import CreateDomainTags from '../../components/domains/CreateDomainTags';
import AttachDomainTags from '../../components/domains/AttachDomainTags';
import Settings from '../../components/settings/Settings';
import { useCheckMigrationStatus, useFetchSettings } from '../../services/settings';
import { fetchDomainScreenshot, useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';
import Icon from '../../components/common/Icon';
import Footer from '../../components/common/Footer';

type thumbImages = { [domain:string] : string }

const Domains: NextPage = () => {
   const router = useRouter();
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [showCreateTags, setShowCreateTags] = useState(false);
   const [attachTagsDomain, setAttachTagsDomain] = useState<DomainType | null>(null);
   const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
   const [domainThumbs, setDomainThumbs] = useState<thumbImages>({});
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData, isLoading } = useFetchDomains(router, true);
   const { data: migrationStatus } = useCheckMigrationStatus();

   const appSettings:SettingsType = appSettingsData?.settings || {};
   const { scraper_type = '' } = appSettings;
   const availableTags: string[] = appSettings.domain_tags || [];

   const totalKeywords = useMemo(() => {
      let keywords = 0;
      if (domainsData?.domains) {
         domainsData.domains.forEach(async (domain:DomainType) => {
            keywords += domain?.keywordCount || 0;
         });
      }
      return keywords;
   }, [domainsData]);

   const domainSCAPiObj = useMemo(() => {
      const domainsSCAPI:{ [ID:string] : boolean } = {};
      if (domainsData?.domains) {
         domainsData.domains.forEach(async (domain:DomainType) => {
            const domainSc = domain?.search_console ? JSON.parse(domain.search_console) : {};
            domainsSCAPI[domain.ID] = domainSc.client_email && domainSc.private_key;
         });
      }
      return domainsSCAPI;
   }, [domainsData]);

   const filteredDomains = useMemo(() => {
      const domains = domainsData?.domains || [];
      if (selectedFilterTags.length === 0) return domains;
      return domains.filter((domain) => {
         const tags = domain.tags || [];
         return selectedFilterTags.some((tag) => tags.includes(tag));
      });
   }, [domainsData, selectedFilterTags]);

   useEffect(() => {
      if (domainsData?.domains && domainsData.domains.length > 0 && appSettings.screenshot_key) {
         domainsData.domains.forEach(async (domain:DomainType) => {
            if (domain.domain) {
               const domainThumb = await fetchDomainScreenshot(domain.domain, appSettings.screenshot_key || '');
               if (domainThumb) {
                  setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: domainThumb }));
               }
            }
         });
      }
   }, [domainsData, appSettings.screenshot_key]);

   const manuallyUpdateThumb = async (domain: string) => {
      if (domain && appSettings.screenshot_key) {
         const domainThumb = await fetchDomainScreenshot(domain, appSettings.screenshot_key, true);
         if (domainThumb) {
            toast(`${domain} Screenshot Updated Successfully!`, { icon: '✔️' });
            setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain]: domainThumb }));
         } else {
            toast(`Failed to Fetch ${domain} Screenshot!`, { icon: '⚠️' });
         }
      }
   };

   const toggleFilterTag = (tag: string) => {
      setSelectedFilterTags((prev) => (
         prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      ));
   };

   return (
      <div data-testid="domains" className="Domain flex flex-col min-h-screen">
         {((!scraper_type || (scraper_type === 'none')) && !isAppSettingsLoading) && (
               <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                  A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
               </div>
         )}
         {migrationStatus?.hasMigrations && (
               <div className=' p-3 bg-black text-white text-sm text-center'>
                  You need to Update your database. Stop Serpbear and run this command to update your database:
                  <code className=' bg-gray-700 px-2 py-0 ml-1'>npm run db:migrate</code>
               </div>
         )}
         <Head>
            <title>Domains - SerpBear</title>
         </Head>
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />

         <div className="flex flex-col w-full max-w-5xl mx-auto p-6 lg:mt-24 lg:p-0">
            <div className='flex justify-between mb-2 items-center gap-2 flex-wrap'>
               <div className=' text-sm text-gray-600'>
                  {filteredDomains.length}
                  {selectedFilterTags.length > 0 && domainsData?.domains ? ` / ${domainsData.domains.length}` : ''} Domains
                  <span className=' text-gray-300 ml-1 mr-1'>|</span> {totalKeywords} keywords
               </div>
               <div className="flex items-center gap-1">
                  <button
                     className="ml-2 inline-flex items-center py-2 text-slate-600 font-bold text-sm hover:text-indigo-600"
                     onClick={() => setShowCreateTags(true)}
                  >
                     <span className="text-center leading-4 mr-2 inline-flex items-center justify-center rounded-full w-7 h-7 bg-indigo-50 text-indigo-600">
                        <Icon type="tags" size={14} />
                     </span>
                     <i className="not-italic hidden lg:inline-block">Create Tags</i>
                  </button>
                  <button
                  data-testid="addDomainButton"
                  className={'ml-2 inline-block py-2 text-blue-700 font-bold text-sm'}
                  onClick={() => setShowAddDomain(true)}>
                     <span
                     className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Domain</i>
                  </button>
               </div>
            </div>

            {availableTags.length > 0 && (
               <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filter</span>
                  {availableTags.map((tag) => {
                     const active = selectedFilterTags.includes(tag);
                     return (
                        <button
                           key={tag}
                           type="button"
                           onClick={() => toggleFilterTag(tag)}
                           className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition
                              ${active
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-slate-500 hover:border-indigo-200'}`}
                        >
                           {tag}
                        </button>
                     );
                  })}
                  {selectedFilterTags.length > 0 && (
                     <button
                        type="button"
                        className="text-xs text-slate-400 hover:text-indigo-600 underline"
                        onClick={() => setSelectedFilterTags([])}
                     >
                        Clear
                     </button>
                  )}
               </div>
            )}

            <div className='flex w-full flex-col mb-8'>
               {filteredDomains.map((domain:DomainType) => {
                  return <DomainItem
                           key={domain.ID}
                           domain={domain}
                           selected={false}
                           isConsoleIntegrated={!!(appSettings && appSettings.search_console_integrated) || !!domainSCAPiObj[domain.ID] }
                           thumb={domainThumbs[domain.domain]}
                           updateThumb={manuallyUpdateThumb}
                           onAttachTags={(d: DomainType) => setAttachTagsDomain(d)}
                           />;
               })}
               {isLoading && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     <Icon type="loading" /> Loading Domains...
                  </div>
               )}
               {!isLoading && domainsData && domainsData.domains && domainsData.domains.length === 0 && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     No Domains Found. Add a Domain to get started!
                  </div>
               )}
               {!isLoading && domainsData && domainsData.domains.length > 0 && filteredDomains.length === 0 && (
                  <div className='noDomains mt-4 p-5 py-8 rounded border text-center bg-white text-sm text-gray-500'>
                     No domains match the selected tags.
                  </div>
               )}
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain
               closeModal={() => setShowAddDomain(false)}
               domains={domainsData?.domains || []}
               availableTags={availableTags}
            />
         </CSSTransition>
         <CSSTransition in={showCreateTags} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <CreateDomainTags closeModal={() => setShowCreateTags(false)} />
         </CSSTransition>
         {attachTagsDomain && (
            <AttachDomainTags
               domain={attachTagsDomain}
               availableTags={availableTags}
               closeModal={() => setAttachTagsDomain(null)}
            />
         )}
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
         <Footer currentVersion={appSettings?.version ? appSettings.version : ''} />
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default Domains;
