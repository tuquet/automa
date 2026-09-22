import * as Sentry from '@sentry/vue';

/**
 * Initializes Sentry in Vue 3 Frontend (Studio Canvas / Newtab)
 * Catches unhandled errors, Vue component lifecycle crashes, and reactivity errors.
 *
 * @param {import('vue').App} app - Vue application instance
 * @param {import('vue-router').Router} [router] - Optional Vue Router instance for route tracing
 */
export function initFrontendSentry(app, router) {
  const dsn =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN) ||
    (typeof window !== 'undefined' && window.__AUTOMA_SENTRY_DSN__) ||
    '';

  const isDev =
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ?? true;

  const isExtension =
    typeof chrome !== 'undefined' && Boolean(chrome?.runtime?.id);

  // If no remote Sentry DSN is configured, avoid calling Sentry.init()
  // to prevent extension warnings while maintaining full Vue errorHandler & Vite HMR error reporting.
  if (!dsn) {
    app.config.errorHandler = (err, instance, info) => {
      const errMsg =
        err?.message ||
        (typeof err === 'string' ? err : 'Unhandled Frontend Exception');

      // 1. Forward browser error to Dev Orchestrator via Vite HMR WebSocket
      if (typeof import.meta !== 'undefined' && import.meta.hot) {
        try {
          import.meta.hot.send('automa:client-error', {
            service: 'STUDIO',
            message: errMsg,
            stack: err?.stack || '',
            breadcrumbs: [{ category: 'vue', message: info, level: 'error' }],
          });
        } catch {
          // Ignore HMR socket communication error
        }
      }

      // 2. High-signal console card for dev inspection
      if (isDev) {
        /* eslint-disable no-console */
        console.groupCollapsed(
          `%c🚨 [FRONTEND ERROR] ${errMsg}`,
          'color: #ef4444; font-weight: bold; font-size: 11px;'
        );
        console.log(
          '%cService:%c automa-webe (Studio Canvas)',
          'font-weight: bold;',
          'color: #10b981;'
        );
        if (err) {
          console.log('%cException:%c', 'font-weight: bold;', '', err);
        }
        if (info) {
          console.log('%cInfo:%c', 'font-weight: bold;', '', info);
        }
        console.groupEnd();
        /* eslint-enable no-console */
      }
    };
    return Sentry;
  }

  Sentry.init({
    app,
    dsn,
    defaultIntegrations: !isExtension,
    environment:
      (typeof import.meta !== 'undefined' && import.meta.env?.MODE) ||
      'development',
    release: 'automa-webe@1.0.0',
    integrations:
      router && !isExtension
        ? [Sentry.browserTracingIntegration({ router })]
        : [],
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      const errMsg =
        event.message ||
        event.exception?.values?.[0]?.value ||
        'Unhandled Frontend Exception';

      // 1. Forward browser error to Dev Orchestrator via Vite HMR WebSocket
      if (typeof import.meta !== 'undefined' && import.meta.hot) {
        try {
          import.meta.hot.send('automa:client-error', {
            service: 'STUDIO',
            message: errMsg,
            stack: hint?.originalException?.stack || '',
            breadcrumbs: event.breadcrumbs?.slice(-5) || [],
          });
        } catch {
          // Ignore HMR socket communication error
        }
      }

      // 2. High-signal console card for dev inspection
      if (isDev) {
        /* eslint-disable no-console */
        console.groupCollapsed(
          `%c🚨 [SENTRY FRONTEND] ${errMsg}`,
          'color: #ef4444; font-weight: bold; font-size: 11px;'
        );
        console.log(
          '%cService:%c automa-webe (Studio Canvas)',
          'font-weight: bold;',
          'color: #10b981;'
        );
        if (hint?.originalException) {
          console.log(
            '%cException:%c',
            'font-weight: bold;',
            '',
            hint.originalException
          );
        }
        if (event.breadcrumbs?.length) {
          console.log(
            '%cRecent Breadcrumbs:%c',
            'font-weight: bold;',
            '',
            event.breadcrumbs.slice(-5)
          );
        }
        console.groupEnd();
        /* eslint-enable no-console */
      }
      return event;
    },
  });

  return Sentry;
}
