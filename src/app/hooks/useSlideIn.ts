/**
 * Shared motion variants for panel slide-in/out animations.
 * Used with `<motion.aside>` or `<motion.div>` from "motion/react".
 *
 * Usage:
 *   import { motion, AnimatePresence } from "motion/react";
 *   import { slideLeft } from "../hooks/useSlideIn";
 *
 *   <AnimatePresence>
 *     {open && <motion.aside {...slideLeft}> ... </motion.aside>}
 *   </AnimatePresence>
 */

const ease = [0.22, 1, 0.36, 1] as const;

// Shared easing curve, exported for components that animate inline (e.g. the
// resizable docks, which need a 0-duration transition while dragging).
export const EASE = ease;

export const slideLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease } },
};

export const slideRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease } },
  exit: { opacity: 0, x: 40, transition: { duration: 0.2, ease } },
};

export const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit: { opacity: 0, y: 24, transition: { duration: 0.18, ease } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, transition: { duration: 0.15, ease } },
};
