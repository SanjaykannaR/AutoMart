/**
 * Hero — Full-Width Banner Carousel (Amazon-Style Auto-Slide Ads)
 *
 * Replaces the old split-screen layout (text left + 3D carousel right)
 * with a FULL-WIDTH banner carousel that auto-slides like Amazon's homepage.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │          [Full-Width Banner Ad - Auto Slides]        │
 *   │                                                      │
 *   │         ── Headline + Subtitle (centered) ──         │
 *   │         ── Search Bar (Gemini-style glow) ──         │
 *   │         ── CTA Buttons ──                            │
 *   │         ── Stats Row ──                              │
 *   │         ● ● ● ○ ○  (dot indicators)                 │
 *   └──────────────────────────────────────────────────────┘
 *
 * Features:
 *   - Auto-slides every 5 seconds with smooth fade transition
 *   - 6 automobile-themed ad banners (deals, sales, parts)
 *   - Search bar with gradient glow on focus (Google Gemini style)
 *   - All text center-aligned
 *   - Dot indicators for manual slide selection
 *   - Previous/Next arrow controls
 *
 * Ad Slides:
 *   1. Mega Brake Sale — up to 40% off
 *   2. Engine Oil Festival — buy 2 get 1 free
 *   3. New Arrivals — 2026 performance parts
 *   4. Monsoon Service Kit — waterproof parts
 *   5. Free Delivery Weekend — no minimum order
 *   6. Premium Exhaust Systems — limited stock
 */
'use client' // Next.js client component directive

import { useState, useEffect, useCallback, useRef } from 'react' // React hooks for state, effects, and refs
import { motion, AnimatePresence } from 'framer-motion' // Animation library for smooth transitions
import Link from 'next/link' // Next.js link for client-side navigation
import { SearchBar } from '@/components/SearchBar' // Reusable search bar component

/**
 * Banner slide data — each slide is a full-width ad
 * representing an automobile deal or special sale.
 * These are like Amazon's homepage promotional banners.
 */
const bannerSlides = [
  {
    id: 1, // Unique identifier for React key
    headline: 'Mega Brake Sale', // Main headline text displayed on the banner
    subtitle: 'Up to 40% off on all brake pads, rotors & calipers', // Subtitle below headline
    badge: 'Limited Time', // Small badge/tag shown above headline
    cta: 'Shop Brakes', // Call-to-action button text
    link: '/search?category=Brake+System', // CTA button destination
    gradient: 'from-red-600/80 via-red-900/60 to-transparent', // Tailwind gradient for overlay
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1920&h=600&fit=crop&q=80', // Wheel close-up — perfect for brake sale banner
    accent: '#EF4444', // Accent color for this slide (matches brake theme)
  },
  {
    id: 2, // Second slide
    headline: 'Engine Oil Festival', // Festival-themed sale for engine oils
    subtitle: 'Buy 2 Get 1 Free on all synthetic engine oils', // Free product offer
    badge: 'Best Seller', // Popularity badge
    cta: 'Shop Oils', // CTA text
    link: '/search?category=Engine+Parts', // Link to engine parts category
    gradient: 'from-amber-600/80 via-amber-900/60 to-transparent', // Amber gradient overlay
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&h=600&fit=crop&q=80', // Engine parts image
    accent: '#F59E0B', // Amber accent color
  },
  {
    id: 3, // Third slide
    headline: 'New Arrivals 2026', // Latest product arrivals
    subtitle: 'Performance parts for the new model year — check them out', // Teaser for new stock
    badge: 'Just In', // Freshness badge
    cta: 'Explore Now', // CTA text
    link: '/search', // Link to search/browse all
    gradient: 'from-blue-600/80 via-blue-900/60 to-transparent', // Blue gradient overlay
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=600&fit=crop&q=80', // Car headlight image
    accent: '#38B6FF', // Sky blue accent
  },
  {
    id: 4, // Fourth slide
    headline: 'Monsoon Service Kit', // Seasonal (monsoon/rain) themed
    subtitle: 'Waterproof parts, wiper blades & more — stay road-ready', // Seasonal products
    badge: 'Seasonal', // Seasonal tag
    cta: 'Get Kit', // CTA text
    link: '/search', // Link to browse
    gradient: 'from-cyan-600/80 via-cyan-900/60 to-transparent', // Cyan gradient overlay
    image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=1920&h=600&fit=crop&q=80', // Car maintenance image
    accent: '#06B6D4', // Cyan accent
  },
  {
    id: 5, // Fifth slide
    headline: 'Free Delivery Weekend', // Delivery promotion
    subtitle: 'No minimum order — free delivery on all parts this weekend', // No-threshold free delivery
    badge: 'This Weekend', // Time-limited badge
    cta: 'Order Now', // CTA text
    link: '/search', // Link to search
    gradient: 'from-green-600/80 via-green-900/60 to-transparent', // Green gradient overlay
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1920&h=600&fit=crop&q=80', // Delivery image
    accent: '#22C55E', // Green accent
  },
  {
    id: 6, // Sixth slide
    headline: 'Premium Exhaust Systems', // Premium product showcase
    subtitle: 'Limited stock — stainless steel performance exhausts', // Scarcity + quality
    badge: 'Premium', // Premium tag
    cta: 'Shop Now', // CTA text
    link: '/search?category=Exhaust', // Link to exhaust category
    gradient: 'from-orange-600/80 via-orange-900/60 to-transparent', // Orange gradient overlay
    image: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=1920&h=600&fit=crop&q=80', // Exhaust image
    accent: '#FF523B', // Coral/orange accent
  },
]

/** Props interface — Hero accepts a search callback */
interface HeroProps {
  onSearch: (query: string) => void // Callback fired when user submits a search query
}

/** Total number of banner slides for index wrapping */
const TOTAL_SLIDES = bannerSlides.length

/**
 * Hero Component
 * Full-width banner carousel with centered text and Gemini-style search bar.
 */
export function Hero({ onSearch }: HeroProps) {
  /** Current active slide index — starts at 0 */
  const [activeIndex, setActiveIndex] = useState(0)

  /** Track whether user is hovering to pause auto-slide */
  const [isPaused, setIsPaused] = useState(false)

  /** Reference to the auto-slide interval for cleanup */
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  /** Reference for slide transition direction (left/right) */
  const [direction, setDirection] = useState(0)

  /**
   * Navigate to the next slide.
   * Updates direction for animation and wraps around at the end.
   */
  const goToNext = useCallback(() => {
    setDirection(1) // Set direction to right for animation
    setActiveIndex((prev) => (prev + 1) % TOTAL_SLIDES) // Wrap to 0 after last slide
  }, [])

  /**
   * Navigate to the previous slide.
   * Updates direction for animation and wraps around at the start.
   */
  const goToPrev = useCallback(() => {
    setDirection(-1) // Set direction to left for animation
    setActiveIndex((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES) // Wrap to last from 0
  }, [])

  /**
   * Navigate to a specific slide by index.
   * Sets direction based on whether target is ahead or behind.
   */
  const goToSlide = useCallback((index: number) => {
    setDirection(index > activeIndex ? 1 : -1) // Determine slide direction
    setActiveIndex(index) // Set the target slide
  }, [activeIndex])

  /**
   * AUTO-SLIDE TIMER
   * Automatically advances slides every 5 seconds.
   * Pauses when user hovers over the banner.
   * Cleans up interval on unmount.
   */
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current) // Prevent duplicate intervals
    }

    // Only start auto-slide if not paused
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setDirection(1) // Always slide right for auto-advance
        setActiveIndex((prev) => (prev + 1) % TOTAL_SLIDES) // Next slide with wrap
      }, 5000) // 5-second interval between slides
    }

    // Cleanup function — clears interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Stop the timer
      }
    }
  }, [isPaused]) // Re-run when pause state changes

  /**
   * Framer Motion variants for slide transitions.
   * Fade in/out with a slight horizontal shift based on direction.
   */
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80, // Enter from right if going forward, left if backward
      opacity: 0, // Start transparent
    }),
    center: {
      x: 0, // Center position
      opacity: 1, // Fully visible
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80, // Exit to left if going forward, right if backward
      opacity: 0, // Fade out
    }),
  }

  /**
   * Current slide data — derived from activeIndex.
   * Used to populate the banner content and colors.
   */
  const currentSlide = bannerSlides[activeIndex]

  return (
    /* ─── HERO SECTION — Full-width banner carousel ─── */
    <section
      className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden" // Full viewport height, centered content
      onMouseEnter={() => setIsPaused(true)} // Pause auto-slide when user hovers
      onMouseLeave={() => setIsPaused(false)} // Resume auto-slide when user leaves
    >
      {/* ─── BANNER IMAGE LAYER ─── */}
      {/* Full-width background image that transitions with each slide */}
      <div className="absolute inset-0 z-0"> {/* Positioned behind all content */}
        <AnimatePresence mode="wait" custom={direction}> {/* Only one slide visible at a time */}
          <motion.div
            key={currentSlide.id} // Unique key forces re-mount for transition
            custom={direction} // Pass direction to variant function
            variants={slideVariants} // Use predefined slide animations
            initial="enter" // Starting state
            animate="center" // Active state
            exit="exit" // Leaving state
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }} // Smooth cubic-bezier easing
            className="absolute inset-0" // Fill entire parent
          >
            {/* Banner background image — covers entire section */}
            <img
              src={currentSlide.image} // Image URL from current slide data
              alt={currentSlide.headline} // Alt text for accessibility
              className="w-full h-full object-cover" // Cover entire area, maintain aspect ratio
              draggable={false} // Prevent drag interference
            />

            {/* Gradient overlay — darkens image and adds color theme */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${currentSlide.gradient}`} // Color overlay matching slide theme
              style={{ opacity: 0.85 }} // Slightly transparent to see image
            />

            {/* Secondary dark overlay — ensures text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── CONTENT LAYER ─── */}
      {/* All text and interactive elements centered over the banner */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge tag — shows "Limited Time", "Best Seller", etc. */}
        <AnimatePresence mode="wait"> {/* Animate badge change with slide */}
          <motion.span
            key={`badge-${currentSlide.id}`} // Unique key per slide
            initial={{ opacity: 0, y: -10 }} // Slide down + fade in
            animate={{ opacity: 1, y: 0 }} // Visible at normal position
            exit={{ opacity: 0, y: 10 }} // Slide up + fade out
            transition={{ duration: 0.4 }} // Quick transition
            className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase backdrop-blur-md border"
            style={{
              color: currentSlide.accent, // Text color matching slide theme
              borderColor: `${currentSlide.accent}33`, // 20% opacity border
              backgroundColor: `${currentSlide.accent}15`, // 8% opacity background
            }}
          >
            {currentSlide.badge} {/* Badge text from slide data */}
          </motion.span>
        </AnimatePresence>

        {/* Main headline — large bold text */}
        <AnimatePresence mode="wait"> {/* Animate headline change */}
          <motion.h1
            key={`headline-${currentSlide.id}`} // Unique key per slide
            initial={{ opacity: 0, y: 20 }} // Fade up from below
            animate={{ opacity: 1, y: 0 }} // Normal position
            exit={{ opacity: 0, y: -20 }} // Fade up out
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Smooth ease-out
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-3" // Responsive font sizes
            style={{ fontFamily: 'Outfit, sans-serif' }} // Outfit font for headings
          >
            {/* Split headline: first part normal, last word in accent color */}
            <span className="text-white">
              {currentSlide.headline.split(' ').slice(0, -1).join(' ')}{' '}
              {/* Everything except the last word */}
            </span>
            <span style={{ color: currentSlide.accent }}>
              {currentSlide.headline.split(' ').slice(-1)}{' '}
              {/* Last word in accent color */}
            </span>
          </motion.h1>
        </AnimatePresence>

        {/* Subtitle — descriptive text below headline */}
        <AnimatePresence mode="wait"> {/* Animate subtitle change */}
          <motion.p
            key={`subtitle-${currentSlide.id}`} // Unique key per slide
            initial={{ opacity: 0, y: 15 }} // Fade up
            animate={{ opacity: 1, y: 0 }} // Visible
            exit={{ opacity: 0, y: -15 }} // Fade out upward
            transition={{ duration: 0.4, delay: 0.1 }} // Slight delay after headline
            className="text-white/70 text-base sm:text-lg lg:text-xl mb-8 max-w-2xl mx-auto" // Centered, muted white
          >
            {currentSlide.subtitle} {/* Subtitle text from slide data */}
          </motion.p>
        </AnimatePresence>

        {/* ─── SEARCH BAR — Gemini-style drop shadow glow on focus ─── */}
        {/* Wrapped in a motion div for entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} // Fade up entrance
          animate={{ opacity: 1, y: 0 }} // Visible
          transition={{ duration: 0.5, delay: 0.2 }} // Delay after subtitle
          className="mb-6 max-w-2xl mx-auto" // Centered, max width constraint
        >
          {/* Search wrapper — applies soft drop shadow glow when input is focused */}
          <div className="search-glow-wrapper">
            {/* Actual search bar component — no extra divs, no layout disruption */}
            <SearchBar onSearch={onSearch} placeholder="Search by part name, brand, or vehicle..." />
          </div>
        </motion.div>

        {/* ─── CTA BUTTONS ─── */}
        {/* Two buttons: primary "Shop Now" and secondary "Browse All" */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} // Fade up entrance
          animate={{ opacity: 1, y: 0 }} // Visible
          transition={{ duration: 0.5, delay: 0.3 }} // Delay after search bar
          className="flex flex-wrap gap-3 justify-center mb-8" // Centered, responsive wrapping
        >
          {/* Primary CTA — links to current slide's category */}
          <Link
            href={currentSlide.link} // Dynamic link from slide data
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: currentSlide.accent, // Slide-themed button color
              color: '#0A0A0A', // Dark text on colored button
              boxShadow: `0 4px 20px ${currentSlide.accent}40`, // Colored shadow
            }}
          >
            {currentSlide.cta} {/* CTA text from slide data */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Right arrow icon */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Secondary CTA — browse all parts */}
          <Link
            href="/search" // Always links to full search page
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            Browse All Parts
          </Link>
        </motion.div>

        {/* ─── STATS ROW ─── */}
        {/* Three key stats displayed horizontally */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} // Fade up entrance
          animate={{ opacity: 1, y: 0 }} // Visible
          transition={{ duration: 0.5, delay: 0.4 }} // Delay after CTA buttons
          className="flex gap-8 sm:gap-12 justify-center" // Centered, responsive spacing
        >
          {/* Map through stat items */}
          {[
            { value: '10K+', label: 'Parts' }, // Number of parts available
            { value: '30min', label: 'Delivery' }, // Average delivery time
            { value: '24/7', label: 'Support' }, // Customer support availability
          ].map((stat) => (
            <div key={stat.label} className="text-center"> {/* Each stat block */}
              <p className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {stat.value} {/* Large stat number */}
              </p>
              <p className="text-xs text-white/50">{stat.label}</p> {/* Small label below */}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── SLIDE NAVIGATION CONTROLS ─── */}
      {/* Previous arrow — left side of banner */}
      <button
        onClick={goToPrev} // Go to previous slide on click
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:bg-black/50 hover:text-white hover:border-white/20 transition-all duration-300"
        aria-label="Previous slide" // Accessibility label
      >
        {/* Left chevron icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow — right side of banner */}
      <button
        onClick={goToNext} // Go to next slide on click
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:bg-black/50 hover:text-white hover:border-white/20 transition-all duration-300"
        aria-label="Next slide" // Accessibility label
      >
        {/* Right chevron icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ─── DOT INDICATORS ─── */}
      {/* Small dots below the banner showing current slide position */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {/* Map through each slide to create a dot */}
        {bannerSlides.map((slide, index) => (
          <button
            key={slide.id} // Unique key for each dot
            onClick={() => goToSlide(index)} // Click to jump to that slide
            className={`h-2 rounded-full transition-all duration-500 ${
              index === activeIndex
                ? 'w-8' // Active dot is wider (pill shape)
                : 'w-2 hover:bg-white/40' // Inactive dots are small circles
            }`}
            style={{
              backgroundColor: index === activeIndex ? slide.accent : 'rgba(255,255,255,0.25)',
              // Active dot uses slide's accent color; inactive is semi-transparent white
            }}
            aria-label={`Go to slide ${index + 1}`} // Accessibility
          />
        ))}
      </div>

      {/* ─── PROGRESS BAR ─── */}
      {/* Thin animated bar at the very top showing auto-slide progress */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-20 bg-white/5">
        {/* Progress fill bar — animates width during slide interval */}
        <div
          className="h-full transition-all duration-500 ease-linear"
          style={{
            width: `${((activeIndex + 1) / TOTAL_SLIDES) * 100}%`, // Width proportional to current slide
            backgroundColor: currentSlide.accent, // Color matches current slide
          }}
        />
      </div>
    </section>
  )
}
