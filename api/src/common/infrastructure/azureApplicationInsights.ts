import { DistributedTracingModes, defaultClient, setup } from 'applicationinsights';

export function setupApplicationInsights(connectionString?: string) {
    if (connectionString === undefined) {
        console.warn(`Connection string for Application Insights missing. Telemetry disabled.`);
        return;
    }

    setup()
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false)
        .setUseDiskRetryCaching(true)
        .setAutoCollectPreAggregatedMetrics(true)
        .setSendLiveMetrics(false)
        .setAutoCollectHeartbeat(false)
        .setAutoCollectIncomingRequestAzureFunctions(true)
        .setInternalLogging(false, true)
        .setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
        .enableWebInstrumentation(false)
        .start();

    return defaultClient;
}
