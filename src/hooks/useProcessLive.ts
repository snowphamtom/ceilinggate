import { useEffect, useState } from "react";
import { EVIDENCE } from "../lib/evidenceConfig";
import { fetchProcessLive, type LiveProcess } from "../lib/processLive";

const POLL_MS = 4000;

/** Poll process:getLive from fleet-gerbil-682 (Evidence). Soft-fails offline. */
export function useProcessLive(): {
  live: LiveProcess | null;
  error: string | null;
  tick: number;
} {
  const [live, setLive] = useState<LiveProcess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!EVIDENCE.configured) {
      setError("Evidence URL unconfigured");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let got = false;

    const run = async () => {
      const row = await fetchProcessLive();
      if (cancelled) return;
      if (row) {
        setLive(row);
        setError(null);
        got = true;
      } else if (!got) {
        setError("process:getLive soft-fail");
      }
      setTick((t) => t + 1);
      timer = setTimeout(run, POLL_MS);
    };

    void run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { live, error, tick };
}
