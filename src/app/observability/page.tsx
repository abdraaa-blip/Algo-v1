import { isObservabilityDashboardEnabled } from "@/core/observability/guard";
import { ObservabilityDashboard } from "./ObservabilityDashboard";
import { ObservabilityDisabled } from "./ObservabilityDisabled";

export default function ObservabilityPage() {
  if (!isObservabilityDashboardEnabled()) {
    return <ObservabilityDisabled />;
  }
  return <ObservabilityDashboard />;
}
