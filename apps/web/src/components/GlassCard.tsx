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
      className={`glass-card p-6 ${glow ? 'shadow-[0_0_40px_rgba(79,140,255,0.1)]' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
