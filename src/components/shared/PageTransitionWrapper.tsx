"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

interface PageTransitionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageTransitionWrapper({ children, className }: PageTransitionWrapperProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
