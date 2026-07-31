"use client";

import {
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Counts from 0 to `value` the first time it enters view. Falls back to the
 * final value immediately for reduced-motion users.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  separator = false,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  const rounded = Math.round(display);
  const num = separator ? rounded.toLocaleString("en-US") : String(rounded);
  const text = `${prefix}${num}${suffix}`;
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
