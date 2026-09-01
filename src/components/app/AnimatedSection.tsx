import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

/* ─── Page transition wrapper ─── */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Fade-in with optional delay ─── */
export function FadeIn({
  children,
  delay = 0,
  className,
  ...props
}: { children: ReactNode; delay?: number } & Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "transition"
>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger container ─── */
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger item (child of StaggerList) ─── */
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Scale-on-hover wrapper ─── */
export function HoverScale({
  children,
  className,
  scale = 1.01,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animate a number counting up ─── */
export function AnimatedNumber({
  value,
  className,
  duration = 0.8,
  delay = 0,
}: {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1, duration, ease: "easeOut" }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

/* ─── Animate a progress bar filling ─── */
export function AnimatedBar({
  width,
  className,
  delay = 0,
}: {
  width: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      animate={{ width: `${width}%` }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
    />
  );
}
