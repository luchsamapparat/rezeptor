import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { isUndefined } from "lodash-es";

export function initTelemetry(connectionString: string | undefined) {
  if (isUndefined(connectionString)) {
    return
  }

  const appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true
    }
  });

  appInsights.loadAppInsights();
  appInsights.trackPageView();
}