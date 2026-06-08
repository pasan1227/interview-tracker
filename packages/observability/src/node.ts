// packages/observability/src/node.ts
//
// Boot-once observability for Node processes (workers, api). Call
// `initNodeObservability()` at the TOP of the process entry, BEFORE
// requiring any instrumented module. Sentry and OTel both hook
// requires under the hood — instrument too late and you get partial
// traces.
//
// OTel imports are LAZY (dynamic import inside init()) for two
// reasons:
//   1. The package surface changes across minor versions — keeping
//      the import out of module-evaluation means a wrong API name
//      doesn't crash the whole app at boot, only the OTel path.
//   2. Most processes won't run with OTel enabled (the env var
//      OTEL_EXPORTER_OTLP_ENDPOINT is unset). Lazy import means we
//      pay zero cost on those processes.

import * as Sentry from '@sentry/node';
import { baseLogger } from './logger';

let _otelSdk: { shutdown: () => Promise<unknown> } | null = null;
let _sentryInit = false;

export type NodeObservabilityOptions = {
  serviceName: string;
  release?: string;
};

export function initNodeObservability(opts: NodeObservabilityOptions): void {
  // ── Sentry ──────────────────────────────────────────────────────
  if (!_sentryInit && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      release: opts.release,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.SENTRY_PROFILES === '1' ? 0.05 : 0,
      sendDefaultPii: false,
      beforeSend: (event) => {
        if (event.request?.headers) {
          delete event.request.headers['cookie'];
          delete event.request.headers['authorization'];
        }
        return event;
      },
    });
    _sentryInit = true;
  }

  // ── OpenTelemetry — lazy ─────────────────────────────────────────
  if (!_otelSdk && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    void (async () => {
      try {
        const [
          { NodeSDK },
          { Resource },
          { HttpInstrumentation },
          { PinoInstrumentation },
        ] = await Promise.all([
          import('@opentelemetry/sdk-node'),
          import('@opentelemetry/resources'),
          import('@opentelemetry/instrumentation-http'),
          import('@opentelemetry/instrumentation-pino'),
        ]);

        // Use string attribute keys — semantic-conventions has
        // shuffled the constant names across versions
        // (SEMRESATTRS_SERVICE_NAME → ATTR_SERVICE_NAME). The string
        // keys are the stable spec.
        const sdk = new NodeSDK({
          resource: new Resource({
            'service.name': opts.serviceName,
            'service.version': opts.release ?? 'dev',
            'deployment.environment': process.env.NODE_ENV ?? 'development',
          }),
          instrumentations: [
            new HttpInstrumentation(),
            new PinoInstrumentation(),
          ],
        });
        sdk.start();
        _otelSdk = sdk;
      } catch (err) {
        baseLogger.warn(
          { err },
          'OTel boot failed — continuing without distributed tracing'
        );
      }
    })();
  }

  // Process-wide guard rails. Unhandled errors bubble up to Sentry +
  // logger and then we let the runtime decide (PM2 / supervisord
  // restart the process on crash).
  process.on('uncaughtException', (err) => {
    baseLogger.fatal({ err }, 'uncaughtException');
    if (_sentryInit) Sentry.captureException(err);
  });
  process.on('unhandledRejection', (err) => {
    baseLogger.error({ err }, 'unhandledRejection');
    if (_sentryInit) Sentry.captureException(err);
  });
}

export async function shutdownNodeObservability(): Promise<void> {
  if (_otelSdk) {
    await _otelSdk.shutdown().catch(() => {});
  }
  if (_sentryInit) {
    await Sentry.close(2000);
  }
}

export { Sentry };
