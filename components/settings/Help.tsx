import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SidePanel from '../common/SidePanel';

type HelpProps = {
   closeHelp: Function,
   initialSection?: string,
}

type HelpSection = {
   id: string,
   title: string,
   body: React.ReactNode,
}

const Help = ({ closeHelp, initialSection = 'overview' }: HelpProps) => {
   const [activeSection, setActiveSection] = useState(initialSection);
   const contentRef = useRef<HTMLDivElement>(null);

   useLayoutEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
         document.body.style.overflow = 'auto';
      };
   }, []);

   useEffect(() => {
      setActiveSection(initialSection || 'overview');
   }, [initialSection]);

   useEffect(() => {
      if (contentRef.current) {
         contentRef.current.scrollTop = 0;
      }
   }, [activeSection]);

   const onClose = () => {
      document.body.style.overflow = 'auto';
      closeHelp();
   };

   const sections: HelpSection[] = useMemo(() => [
      {
         id: 'overview',
         title: 'Обзор',
         body: (
            <>
               <p>
                  SerpBear — внутренний сервис для отслеживания позиций сайта в Google,
                  работы с Google Search Console и подбора ключевых слов.
               </p>
               <ul>
                  <li><strong>Domains</strong> — список сайтов и быстрый обзор.</li>
                  <li><strong>Tracking</strong> — позиции выбранных вами ключевых слов.</li>
                  <li><strong>Discover</strong> — запросы, по которым сайт уже виден в GSC.</li>
                  <li><strong>Insight</strong> — клики, показы, CTR и средняя позиция из GSC.</li>
                  <li><strong>Ideas / Research</strong> — идеи ключей и объёмы через Google Ads.</li>
               </ul>
               <p>
                  Откройте нужный раздел слева в этом окне. Ссылка Help в верхнем меню всегда
                  ведёт сюда, а не на внешнюю документацию.
               </p>
            </>
         ),
      },
      {
         id: 'roles',
         title: 'Роли пользователей',
         body: (
            <>
               <p>В системе три роли. Логин и пароли управляются в приложении (Settings → Users), а не через `.env`.</p>
               <ul>
                  <li><strong>admin</strong> — полный доступ, включая управление пользователями.</li>
                  <li><strong>seo</strong> — те же права, что у admin, но без раздела Users.</li>
                  <li><strong>viewer</strong> — только просмотр доменов и позиций; Settings, Research и изменения недоступны.</li>
               </ul>
               <p>Первый admin создаётся при старте. Дальше пользователей добавляет администратор.</p>
            </>
         ),
      },
      {
         id: 'domains',
         title: 'Домены',
         body: (
            <>
               <p>На странице <strong>Domains</strong> видно все отслеживаемые сайты.</p>
               <ol>
                  <li>Нажмите <strong>+</strong> (или Add Domain).</li>
                  <li>Введите домен без `https://` (например `example.com`).</li>
                  <li>При необходимости укажите теги и настройки Search Console для этого домена.</li>
               </ol>
               <p>
                  Карточка домена показывает число ключей и среднюю позицию по вашему трекингу
                  (это не то же самое, что Avg Position из GSC).
               </p>
               <p>Клик по домену открывает вкладку Tracking.</p>
            </>
         ),
      },
      {
         id: 'tracking',
         title: 'Tracking — позиции',
         body: (
            <>
               <p>Вкладка Tracking хранит ключевые слова, которые вы сами добавили для мониторинга.</p>
               <ol>
                  <li>Откройте домен → Tracking.</li>
                  <li>Добавьте ключи (можно списком), укажите страну и устройство.</li>
                  <li>Нажмите обновление позиций (Refresh), чтобы скрапер снял выдачу Google.</li>
               </ol>
               <p>
                  Позиция <strong>0</strong> или очень высокое значение обычно значит:
                  ключ пока не обновлялся или сайт не найден в топе результатов скрапера.
               </p>
               <ul>
                  <li>Можно ставить теги, избранное, смотреть историю и график по ключу.</li>
                  <li>Экспорт CSV доступен из меню домена.</li>
                  <li>Колонки таблицы настраиваются в Settings.</li>
               </ul>
               <p className="help-note">
                  Важно: позиция из Tracking — это результат вашего скрапера.
                  Позиция из Search Console — усреднение Google по показам. Они часто отличаются.
               </p>
            </>
         ),
      },
      {
         id: 'scrapers',
         title: 'Скраперы и обновление',
         body: (
            <>
               <p>Чтобы Tracking обновлял позиции, в Settings → Scraper нужно выбрать провайдера SERP API и указать ключ.</p>
               <ul>
                  <li>Без скрапера (`none`) ручное и cron-обновление позиций не даст результатов.</li>
                  <li>Можно задать задержку между запросами и повтор при ошибках.</li>
                  <li>Cron-задача на сервере периодически обновляет ключи и при необходимости шлёт уведомления.</li>
               </ul>
               <p>
                  Если позиции «зависли», проверьте API-ключ скрапера, лимиты провайдера
                  и ошибки у конкретного ключа (иконка ошибки / last update error).
               </p>
            </>
         ),
      },
      {
         id: 'gsc',
         title: 'Google Search Console',
         body: (
            <>
               <p>Интеграция GSC нужна для вкладок Discover и Insight, а также для колонки Search Console в Tracking.</p>
               <ol>
                  <li>Откройте Settings → Search Console (или Integration).</li>
                  <li>Добавьте service account: Client Email и Private Key.</li>
                  <li>В Google Search Console выдайте этому аккаунту доступ к свойству сайта.</li>
                  <li>При необходимости укажите отдельные credentials в настройках конкретного домена.</li>
               </ol>
               <p>
                  Тип свойства важен: domain-свойство (`sc-domain:example.com`) или URL-prefix.
                  Если в GSC другой тип — цифры в SerpBear могут не совпасть с интерфейсом Google.
               </p>
               <p className="help-note">
                  Данные GSC кэшируются примерно на 24 часа. У Google также бывает задержка 1–3 дня.
               </p>
            </>
         ),
      },
      {
         id: 'discover',
         title: 'Discover',
         body: (
            <>
               <p>
                  Discover показывает запросы из Search Console, по которым сайт уже получает показы —
                  удобно находить ключи, которых ещё нет в Tracking.
               </p>
               <ul>
                  <li>Фильтр периода: 3 / 7 / 30 дней.</li>
                  <li>Можно добавлять найденные запросы в Tracking.</li>
                  <li>Без интеграции GSC раздел будет пустым.</li>
               </ul>
            </>
         ),
      },
      {
         id: 'insight',
         title: 'Insight и Avg Position',
         body: (
            <>
               <p>Insight — сводка по GSC за последние ~30 дней: статистика по дням, ключам, странам и страницам.</p>
               <ul>
                  <li>График: Visits (клики), Impressions (показы) и линия Avg Position.</li>
                  <li>Карточки сверху — итоги за период.</li>
               </ul>
               <p>
                  <strong>Avg Position</strong> считается как у Google: средневзвешенное по показам
                  `Σ(position × impressions) / Σ(impressions)`, а не простое среднее по дням.
               </p>
               <p>Почему цифры всё ещё могут отличаться от UI Google:</p>
               <ul>
                  <li>другие фильтры / тип поиска в интерфейсе GSC;</li>
                  <li>задержка данных или локальный кэш;</li>
                  <li>несовпадение типа свойства (domain vs URL-prefix);</li>
                  <li>округление позиций в таблицах.</li>
               </ul>
            </>
         ),
      },
      {
         id: 'ideas',
         title: 'Ideas и Research',
         body: (
            <>
               <p>
                  Ideas (на уровне домена) и Research (глобальный раздел) используют Google Ads API
                  для идей ключей, объёмов и конкуренции.
               </p>
               <ol>
                  <li>Подключите Google Ads в Settings (тестовый/developer аккаунт по инструкции интеграции).</li>
                  <li>В Ideas задайте seed-ключи или URL и получите список идей.</li>
                  <li>Избранные идеи можно добавить в Tracking.</li>
               </ol>
               <p>Без Google Ads эти разделы не заполнятся. Viewer их не видит.</p>
            </>
         ),
      },
      {
         id: 'settings',
         title: 'Settings',
         body: (
            <>
               <p>Основные вкладки настроек:</p>
               <ul>
                  <li><strong>Scraper</strong> — провайдер SERP, ключ API, задержки, retry.</li>
                  <li><strong>Notification</strong> — email-отчёты, SMTP.</li>
                  <li><strong>Search Console / Ads</strong> — интеграции Google.</li>
                  <li><strong>Users</strong> — только для admin: создание и роли пользователей.</li>
               </ul>
               <p>После смены скрапера или GSC credentials сохраните настройки и дождитесь следующего обновления данных.</p>
            </>
         ),
      },
      {
         id: 'faq',
         title: 'FAQ',
         body: (
            <>
               <p><strong>Позиции в Tracking и в GSC разные — это баг?</strong><br />
                  Обычно нет. Tracking = снимок выдачи скрапером. GSC = среднее по реальным показам пользователей Google.</p>
               <p><strong>Insight пустой / нет Visits.</strong><br />
                  Проверьте интеграцию GSC, доступ service account к свойству и тип свойства домена.</p>
               <p><strong>Ключи не обновляются.</strong><br />
                  Проверьте Scraper API key, лимиты провайдера и cron/ручной Refresh.</p>
               <p><strong>Viewer не видит Settings.</strong><br />
                  Так и задумано: роль только на просмотр.</p>
               <p><strong>Нужно добавить сотрудника.</strong><br />
                  Войдите как admin → Settings → Users.</p>
            </>
         ),
      },
   ], []);

   const current = sections.find((s) => s.id === activeSection) || sections[0];

   return (
      <SidePanel title="Справка — как пользоваться" closePanel={onClose} width="large">
         <div className="help-panel flex h-full min-h-0">
            <nav className="help-nav hidden sm:block w-48 shrink-0 border-r border-gray-100 bg-[#f8f9ff] overflow-y-auto styled-scrollbar py-3">
               {sections.map((section) => (
                  <button
                     key={section.id}
                     type="button"
                     className={`block w-full text-left px-4 py-2 text-sm ${
                        activeSection === section.id
                           ? 'bg-white text-indigo-700 font-semibold border-l-2 border-indigo-600'
                           : 'text-gray-600 hover:text-gray-900'
                     }`}
                     onClick={() => setActiveSection(section.id)}
                  >
                     {section.title}
                  </button>
               ))}
            </nav>
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
               <div className="sm:hidden border-b border-gray-100 px-4 py-2 overflow-x-auto whitespace-nowrap">
                  {sections.map((section) => (
                     <button
                        key={section.id}
                        type="button"
                        className={`inline-block mr-2 mb-1 px-3 py-1 rounded-full text-xs ${
                           activeSection === section.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'bg-gray-100 text-gray-600'
                        }`}
                        onClick={() => setActiveSection(section.id)}
                     >
                        {section.title}
                     </button>
                  ))}
               </div>
               <div ref={contentRef} className="help-body flex-1 overflow-y-auto styled-scrollbar px-5 py-4 text-sm text-gray-700">
                  <h4 className="text-base font-bold text-gray-900 mb-3">{current.title}</h4>
                  <div
                     className={`help-content space-y-3 leading-relaxed
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2
                        [&_.help-note]:bg-amber-50 [&_.help-note]:border [&_.help-note]:border-amber-100
                        [&_.help-note]:rounded [&_.help-note]:px-3 [&_.help-note]:py-2`}
                  >
                     {current.body}
                  </div>
               </div>
            </div>
         </div>
      </SidePanel>
   );
};

export default Help;
