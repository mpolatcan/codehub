import { useEffect } from "react";
import { ipc } from "../lib/ipc";
import { useStore } from "../lib/store";

// Polls session_activity (working/idle per session, from pane output flow) into
// the store while the runtime is up. Cadence matches the backend's grace window
// so a session reads "idle" within ~one poll of falling quiet. One-shot reads
// with an alive guard + clearInterval cleanup — same contract as the other Hub
// polls; clears the map when the runtime is down. Mount once (in the Hub view).
const ACTIVITY_POLL_MS = 1500;

export function useActivityPoll() {
  const running = useStore((s) => s.status?.state === "running");
  const setSessionActivity = useStore((s) => s.setSessionActivity);

  useEffect(() => {
    if (!running) {
      setSessionActivity([]);
      return;
    }
    let alive = true;
    const tick = () => {
      ipc
        .sessionActivity()
        .then((a) => alive && setSessionActivity(a))
        .catch(() => alive && setSessionActivity([]));
    };
    tick();
    const h = setInterval(tick, ACTIVITY_POLL_MS);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running, setSessionActivity]);
}
