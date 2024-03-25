import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { isUndefined } from 'lodash-es';

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

  appInsights.addTelemetryInitializer(envelope => {
    envelope.tags ??= [];
    envelope.tags['ai.cloud.role'] = 'rezeptor-app';
  });


  appInsights.loadAppInsights();
  appInsights.trackPageView();
}