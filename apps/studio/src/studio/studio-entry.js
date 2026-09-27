import { createApp } from 'vue';
import { createHead } from '@vueuse/head';
import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
} from 'vue-router';
import { createAutomaUiPlugin } from '@automa/ui';
import '@automa/ui/dist/ui.css';
import StudioApp from './StudioApp.vue';
import pinia from '../lib/pinia';
import compsUi from '../lib/compsUi';
import vueI18n, { loadLocaleMessages, setI18nLanguage } from '../lib/vueI18n';
import vRemixicon, { icons } from '../lib/vRemixicon';
import vueToastification from '../lib/vue-toastification';
import { initFrontendSentry } from '../lib/sentry';
import { setupHostBridgeReceiver } from './adapters/host-bridge';
import { useStudioStore } from './stores/useStudioStore';

// Preload English Locales statically to ensure standalone 0-network-dependency
import commonLocale from '../locales/en/common.json';
import blocksLocale from '../locales/en/blocks.json';
import newtabLocale from '../locales/en/newtab.json';
import popupLocale from '../locales/en/popup.json';

// Styles
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';
import '../assets/css/flow.css';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';

const commonEn = commonLocale.default || commonLocale;
const blocksEn = blocksLocale.default || blocksLocale;
const newtabEn = newtabLocale.default || newtabLocale;
const popupEn = popupLocale.default || popupLocale;

// Initialize base EN messages with deep merge
vueI18n.global.setLocaleMessage('en', commonEn);
vueI18n.global.mergeLocaleMessage('en', popupEn);
vueI18n.global.mergeLocaleMessage('en', newtabEn);
vueI18n.global.mergeLocaleMessage('en', blocksEn);
vueI18n.global.locale.value = 'en';

// Expose dynamic locale switching for standalone and parent iframes
if (typeof window !== 'undefined') {
  window.setStudioLanguage = async (locale) => {
    if (locale === 'en') {
      setI18nLanguage('en');
      return;
    }
    await loadLocaleMessages(locale, 'newtab');
    setI18nLanguage(locale);
  };
}

function getRouterBase() {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname || '/';
  return pathname.endsWith('/')
    ? pathname
    : pathname.substring(0, pathname.lastIndexOf('/') + 1);
}

const history =
  typeof window !== 'undefined' &&
  window.location.protocol &&
  window.location.protocol.startsWith('http')
    ? createWebHistory(getRouterBase())
    : createMemoryHistory();

const router = createRouter({
  history,
  routes: [
    { path: '/:pathMatch(.*)*', component: { template: '<div></div>' } },
  ],
});

const head = createHead();
const app = createApp(StudioApp);
initFrontendSentry(app, router);

app.use(router);
app.use(head);
app.use(compsUi);
app.use(pinia);

// Initialize Host Bridge IPC receiver with the Pinia Store
setupHostBridgeReceiver(useStudioStore(pinia));

app.use(createAutomaUiPlugin({ baseUrl: 'http://127.0.0.1:8765' }));
app.use(vueI18n);
app.use(vueToastification, {
  maxToasts: 3,
  timeout: 2500,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  pauseOnHover: true,
});
app.use(vRemixicon, icons);

app.mount('#app');

if (module.hot) module.hot.accept();
