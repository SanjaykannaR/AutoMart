/**
 * GlassCard → now renders as a standard dark card
 * 
 * Retained as a backward-compatible wrapper so existing imports don't break.
 * Internally uses the new "card" class from globals.css (solid dark surface
 * with subtle border, no glassmorphism blur).
 * 
 * Props:
 *   - children: card content
 *   - className: additional Tailwind classes
 *   - glow: adds a subtle lime glow shadow (kept for emphasis cases)
 */
'use client'

import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function GlassCard({ children, className = '', glow }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`card p-6 ${glow ? 'shadow-[0_0_30px_rgba(57,255,20,0.06)]' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
