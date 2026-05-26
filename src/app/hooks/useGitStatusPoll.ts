import { useEffect } from "react";
import { ipc } from "../lib/ipc";
import { activeWorkspace, useStore } from "../lib/store";

// Single app-wide poll of container_git_status (/workspace branch + ahead/behind
// + uncommitted count) into the store while the runtime is up. Centralized for
// the same reason as useContainerStatsPoll: the activity rail's Changes list and
// the Hub meta strip both read `gitStatus` from the store instead of each firing
// its own poll. Mount ONCE at the app root. Clears to null when the runtime goes
// down so consumers fall back to an honest empty state, not a stale snapshot.
const GIT_POLL_MS = 5000;

export function useGitStatusPoll() {
  const running = useStore((s) => s.status?.state === "running");
  const setGitStatus = useStore((s) => s.setGitStatus);
  // The /workspace shown belongs to the ACTIVE workspace's container; re-poll
  // when it changes. Always defined when a workspace tab is open.
  const containerKey = useStore((s) => activeWorkspace(s)?.containerKey);

  useEffect(() => {
    if (!running) {
      setGitStatus(null);
      return;
    }
    let alive = true;
    const tick = () => {
      ipc
        .containerGitStatus(containerKey)
        .then((g) => alive && setGitStatus(g))
        .catch(() => alive && setGitStatus(null));
    };
    tick();
    const h = setInterval(tick, GIT_POLL_MS);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running, setGitStatus, containerKey]);
}
