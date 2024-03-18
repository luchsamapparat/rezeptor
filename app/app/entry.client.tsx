import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { getApplicationInsightsConnectionString } from './environment';
import { initTelemetry } from './infrastructure/telemetry';

initTelemetry(getApplicationInsightsConnectionString());

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
