/**
 * ScrollReveal — Reusable scroll-triggered animation wrapper
 *
 * Different elements get different animations based on their type:
 *   - "text"    → fades up + slight vertical slide (headings, paragraphs)
 *   - "card"    → fades up + subtle scale from 0.96 → 1.0 (cards, panels)
 *   - "image"   → fades in + scales from 0.9 → 1.0 (images, thumbnails)
 *   - "slide-left"  → slides in from left (sidebar panels)
 *   - "slide-right" → slides in from right (order summaries)
 *   - "pop"     → scales up with slight bounce (badges, CTAs)
 *   - "fade"    → simple opacity fade (subtle elements)
 *
 * Props:
 *   - variant  — animation preset name (default: "text")
 *   - delay    — delay before animation starts in seconds (default: 0)
 *   - duration — animation duration in seconds (default: 0.6)
 *   - className — additional CSS classes applied to the wrapper
 *   - children — the content to animate
 *
 * Usage:
 *   <ScrollReveal variant="card" delay={0.1}>
 *     <div className="card">...</div>
 *   </ScrollReveal>
 *
 * Stagger pattern — wrap a grid and each child animates sequentially:
 *   <div className="grid grid-cols-3 gap-4">
 *     {items.map((item, i) => (
 *       <ScrollReveal key={i} variant="card" delay={i * 0.08}>
 *         <ItemCard item={item} />
 *       </ScrollReveal>
 *     ))}
 *   </div>
 */
'use client' // Next.js client component directive

import { motion } from 'framer-motion' // Framer Motion for declarative animations

/**
 * Animation variant definitions.
 * Each variant defines the initial, animate, and optional exit states.
 * Using cubic-bezier [0.16, 1, 0.3, 1] for a smooth deceleration curve.
 */
const variants = {
  /** Text fade-up — subtle vertical movement, no scale change */
  text: {
    initial: {
      opacity: 0,      // Start fully transparent
      y: 24,           // Slide down 24px from final position
    },
    animate: {
      opacity: 1,      // Fade to fully visible
      y: 0,            // Slide to final position
    },
  },

  /** Card fade-up + subtle scale — slightly larger motion than text */
  card: {
    initial: {
      opacity: 0,      // Start transparent
      y: 30,           // Slide down 30px
      scale: 0.96,     // Start 4% smaller
    },
    animate: {
      opacity: 1,      // Fully visible
      y: 0,            // Final position
      scale: 1,        // Full size
    },
  },

  /** Image scale-in — more dramatic scale effect for visual impact */
  image: {
    initial: {
      opacity: 0,      // Start transparent
      scale: 0.92,     // Start 8% smaller
    },
    animate: {
      opacity: 1,      // Fully visible
      scale: 1,        // Full size
    },
  },

  /** Slide from left — for sidebar/panel elements */
  'slide-left': {
    initial: {
      opacity: 0,      // Start transparent
      x: -40,          // Start 40px to the left
    },
    animate: {
      opacity: 1,      // Fully visible
      x: 0,            // Final horizontal position
    },
  },

  /** Slide from right — for summary/checkout panels */
  'slide-right': {
    initial: {
      opacity: 0,      // Start transparent
      x: 40,           // Start 40px to the right
    },
    animate: {
      opacity: 1,      // Fully visible
      x: 0,            // Final horizontal position
    },
  },

  /** Pop scale — for badges, buttons, small UI elements */
  pop: {
    initial: {
      opacity: 0,      // Start transparent
      scale: 0.8,      // Start 20% smaller
    },
    animate: {
      opacity: 1,      // Fully visible
      scale: 1,        // Full size
    },
  },

  /** Simple fade — no movement, just opacity */
  fade: {
    initial: {
      opacity: 0,      // Start transparent
    },
    animate: {
      opacity: 1,      // Fully visible
    },
  },
}

/**
 * Props interface for the ScrollReveal component.
 */
interface ScrollRevealProps {
  variant?: keyof typeof variants  // Animation preset name
  delay?: number                   // Delay before animation starts (seconds)
  duration?: number                // Animation duration (seconds)
  className?: string               // Additional CSS classes
  children: React.ReactNode        // Content to animate
}

/**
 * ScrollReveal Component
 * Wraps any content and animates it when it scrolls into view.
 * Uses framer-motion's whileInView for scroll-triggered animation.
 */
export function ScrollReveal({
  variant = 'text',   // Default to text animation
  delay = 0,          // No delay by default
  duration = 0.6,     // 0.6s duration by default
  className = '',     // No extra classes by default
  children,           // The content to wrap
}: ScrollRevealProps) {
  /** Get the animation states for the selected variant */
  const v = variants[variant]

  return (
    <motion.div
      // Initial state — what the element looks like before it's in view
      initial={v.initial}

      // While in viewport — animate to this state
      whileInView={v.animate}

      // Viewport config — animate once when 15% visible, don't reverse
      viewport={{ once: true, margin: '-10%' }}

      // Transition — smooth ease-out with custom duration and delay
      transition={{
        duration: duration,  // Animation duration
        delay: delay,        // Stagger delay
        ease: [0.16, 1, 0.3, 1], // Custom deceleration curve (snappy start, smooth end)
      }}

      // Additional classes passed through
      className={className}
    >
      {children} {/* Render the wrapped content */}
    </motion.div>
  )
}
