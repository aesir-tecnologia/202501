import * as Sentry from '@sentry/nuxt';
import { consola } from 'consola';

Sentry.init({
  dsn: 'https://5a5cbfb4beed2524e792c0fe58ce805b@o4504073906159616.ingest.us.sentry.io/4510676196392960',
  enabled: import.meta.env.PROD,
  tracesSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // If you don't want to use Session Replay, just remove the line below:
  integrations: [Sentry.replayIntegration()],

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending of user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Bridge consola logs to Sentry (only in production when Sentry is enabled)
if (import.meta.env.PROD) {
  const sentryReporter = Sentry.createConsolaReporter();
  consola.addReporter(sentryReporter);
}
