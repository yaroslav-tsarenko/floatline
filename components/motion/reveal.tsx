"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children?: React.ReactNode;
}

/**
 * Fade-and-rise a block into view the first time it scrolls in. Respects
 * prefers-reduced-motion (renders in place, no transform). Duration stays in
 * the 150–300ms band with a small stagger offset via `delay`.
 */
export function Reveal({ children, delay = 0, ...rest }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    const { className } = rest;
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.28, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
