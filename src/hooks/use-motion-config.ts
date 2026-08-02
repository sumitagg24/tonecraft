import { useReducedMotion } from "framer-motion";

export const springConfig = {
  type: "spring",
  stiffness: 350,
  damping: 25,
  mass: 0.8,
};

export const gentleSpringConfig = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

export const hoverTiltVariants = {
  initial: { rotateX: 0, rotateY: 0, scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } },
  tap: { scale: 0.98 },
};

export const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const modalScaleVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export function useToneCraftMotion() {
  const shouldReduceMotion = useReducedMotion();

  return {
    shouldReduceMotion,
    spring: shouldReduceMotion ? { duration: 0 } : springConfig,
    gentleSpring: shouldReduceMotion ? { duration: 0 } : gentleSpringConfig,
    fadeInUp: shouldReduceMotion
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : fadeInUpVariants,
    staggerContainer: shouldReduceMotion
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : staggerContainerVariants,
    modalScale: shouldReduceMotion
      ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
      : modalScaleVariants,
  };
}
