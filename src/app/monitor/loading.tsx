import { AlgoLoader } from "@/components/algo/AlgoLoader";
import { ALGO_UI_LOADING } from "@/lib/copy/ui-strings";

export default function Loading() {
  return (
    <div className="algo-min-h-viewport-content flex items-center justify-center">
      <AlgoLoader message={ALGO_UI_LOADING.monitor} />
    </div>
  );
}
