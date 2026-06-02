import { AnimatePresence, motion } from "motion/react";
import { useStore } from "../../lib/store";

export function BusyOverlay() {
  const msg = useStore((s) => s.busyMessage);
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--bd)",
              borderRadius: "0.625rem",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontFamily: "var(--mono)",
              fontSize: "var(--fs-13)",
              color: "var(--fg-1)",
              boxShadow: "0 0.75rem 2.5rem rgba(0,0,0,0.4)",
            }}
          >
            <Spinner />
            {msg}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      style={{
        width: "1rem",
        height: "1rem",
        border: "2px solid var(--bd)",
        borderTop: "2px solid var(--fg-0)",
        borderRadius: "50%",
      }}
    />
  );
}
