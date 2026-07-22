/**
 * Navbar — Centered menu with icons + text labels
 * 
 * Features:
 *   - Camera icon → search by image (file picker for auto part photo)
 *   - Microphone icon → search by voice (Web Speech API)
 *   - Settings gear VISIBLE FOR ALL USERS (routes to /account or /login)
 *   - Active tab uses trending pill/capsule background style
 *   - Search bar glows with rotating gradient border on focus
 *   - Glass circle buttons for wishlist, cart, settings
 * 
 * Layout:
 *   [Logo] ——— [🏠 Home] [📁 Categories] [🔧 Browse] [📦 Orders] [🔍 🔎 _search_ 🎤 📷] ——— [♡] [🛒] [⚙️]
 */
'use client' // Next.js client component directive — enables hooks + browser APIs

// ─── React + Next.js imports ───
import Link from 'next/link' // Declarative routing — renders <a> tags with prefetch
import { useState, useEffect, useRef } from 'react' // React hooks for state, side effects, and DOM refs
import { usePathname, useRouter } from 'next/navigation' // Next.js App Router hooks — current path + programmatic navigation

// ─── Heroicons imports (24/outline set for lightweight SVG icons) ───
import {
  ShoppingCartIcon,      // Shopping cart icon — used for cart button
  MagnifyingGlassIcon,   // Magnifying glass — used inside search input
  HeartIcon,             // Outline heart — empty wishlist state
  Cog6ToothIcon,         // Settings gear — always visible in navbar
  HomeIcon,              // House icon — Home nav link
  Squares2X2Icon,        // Grid icon — Categories nav link
  WrenchIcon,            // Wrench icon — Browse Parts nav link
  ClipboardDocumentListIcon, // Clipboard — My Orders nav link
  CameraIcon,            // Camera — search by image button
  MicrophoneIcon,        // Mic — search by voice button
  XMarkIcon              // X close — clear search text button
} from '@heroicons/react/24/outline'

// ─── Solid heart icon for filled wishlist state (when count > 0) ───
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

// ─── Navigation link definitions ───
// Each link has: href (route), label (display text), icon (Heroicon component)
const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon }, // Home page — exact match only
  { href: '/categories', label: 'Categories', icon: Squares2X2Icon }, // Category browsing
  { href: '/search', label: 'Browse Parts', icon: WrenchIcon }, // Part search/explore
  { href: '/orders', label: 'My Orders', icon: ClipboardDocumentListIcon }, // Order history
]

export function Navbar() {
  // ─── Core hooks ───
  const pathname = usePathname() // Current URL path — used for active link detection
  const router = useRouter() // Programmatic navigation — used after search submit
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref to hidden file input — triggered by camera icon click

  // ─── State declarations ───
  const [cartCount, setCartCount] = useState(0) // Number of items in cart — read from localStorage
  const [wishlistCount, setWishlistCount] = useState(0) // Number of wishlist items — read from localStorage
  const [searchQuery, setSearchQuery] = useState('') // Current search input value
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Whether user has valid session — checked via localStorage
  const [isListening, setIsListening] = useState(false) // Whether voice recognition is active

  /* ───────────────────────────────────────────────────────────────
   * LOGIN STATE DETECTION
   * 
   * Checks for 'user' OR 'token' in localStorage.
   * The 'token' fallback handles:
   *   - Users who logged in before 'user' key was added
   *   - Sessions restored from API token only
   * ─────────────────────────────────────────────────────────────── */
  const checkLogin = () => {
    try {
      const user = localStorage.getItem('user') // Try to get stored user object
      const token = localStorage.getItem('token') // Try to get stored JWT token
      const loggedIn =
        (!!user && user !== 'null' && user !== '') || // User exists and is not empty/null string
        (!!token && token !== 'null' && token !== '') // OR token exists and is valid
      setIsLoggedIn(loggedIn) // Update state — triggers re-render
    } catch {
      setIsLoggedIn(false) // localStorage unavailable (SSR/incognito) — assume logged out
    }
  }

  useEffect(() => {
    checkLogin() // Initial check on component mount
    window.addEventListener('storage', checkLogin) // Re-check when localStorage changes (cross-tab sync)
    window.addEventListener('user-updated', checkLogin) // Re-check when login page dispatches custom event
    return () => {
      window.removeEventListener('storage', checkLogin) // Cleanup listener on unmount
      window.removeEventListener('user-updated', checkLogin) // Cleanup custom event listener
    }
  }, []) // Empty deps — runs once on mount

  // Re-check on every navigation (handles redirect after login/logout)
  useEffect(() => {
    checkLogin() // Re-verify login state when URL changes
  }, [pathname]) // Re-run whenever pathname changes

  /* ───────────────────────────────────────────────────────────────
   * CART + WISHLIST COUNTS
   * Read from localStorage and update state.
   * Listen for custom events to re-count after cart/wishlist changes.
   * ─────────────────────────────────────────────────────────────── */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') // Parse cart array (default empty)
      setCartCount(cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)) // Sum all item quantities
    } catch { setCartCount(0) } // If parsing fails, set count to 0
  }

  const updateWishlistCount = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]') // Parse wishlist array (default empty)
      setWishlistCount(wishlist.length) // Count number of wishlist items
    } catch { setWishlistCount(0) } // If parsing fails, set count to 0
  }

  useEffect(() => {
    updateCartCount() // Initial cart count on mount
    updateWishlistCount() // Initial wishlist count on mount

    const h1 = () => updateCartCount() // Handler for cart changes
    const h2 = () => updateWishlistCount() // Handler for wishlist changes

    window.addEventListener('cart-updated', h1) // Custom event from cart page/actions
    window.addEventListener('wishlist-updated', h2) // Custom event from wishlist page/actions
    window.addEventListener('storage', h1) // Cross-tab localStorage sync for cart
    window.addEventListener('storage', h2) // Cross-tab localStorage sync for wishlist

    return () => {
      window.removeEventListener('cart-updated', h1) // Cleanup cart listener
      window.removeEventListener('wishlist-updated', h2) // Cleanup wishlist listener
      window.removeEventListener('storage', h1) // Cleanup storage listener for cart
      window.removeEventListener('storage', h2) // Cleanup storage listener for wishlist
    }
  }, []) // Empty deps — runs once on mount

  /* ───────────────────────────────────────────────────────────────
   * ACTIVE LINK DETECTION
   * 
   * Exact match for Home ("/"), prefix match for others.
   * e.g. "/categories/shocks" matches "/categories"
   * ─────────────────────────────────────────────────────────────── */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' // Home — exact match only (not /orders, /cart, etc.)
    return pathname.startsWith(href) // Other links — prefix match
  }

  /* ───────────────────────────────────────────────────────────────
   * TEXT SEARCH
   * 
   * On form submit, navigate to /search?q=<query>.
   * Clears the input after navigation.
   * ─────────────────────────────────────────────────────────────── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault() // Prevent default form submission (page reload)
    if (searchQuery.trim()) { // Only search if there's actual text
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`) // Navigate to search page with query
      setSearchQuery('') // Clear input after search
    }
  }

  /* ───────────────────────────────────────────────────────────────
   * SEARCH BY IMAGE
   * 
   * Opens a file picker for camera/photo.
   * Converts the selected image to base64 and navigates to
   * the search page with the image data as a query param.
   * 
   * In production, you'd send this to a backend vision API
   * (e.g., Google Lens, Clarifai) for part identification.
   * ─────────────────────────────────────────────────────────────── */
  const handleImageSearch = () => {
    fileInputRef.current?.click() // Programmatically click the hidden file input
  }

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] // Get the first selected file
    if (!file) return // User cancelled — no file selected

    // Validate file type — only accept image files
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file') // Wrong file type
      return
    }

    // Validate file size (max 5MB) — prevent large uploads
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB') // File too large
      return
    }

    // Convert to base64 and pass to search page
    const reader = new FileReader() // FileReader API — reads file contents
    reader.onload = () => {
      const base64 = reader.result as string // Get base64-encoded string
      sessionStorage.setItem('imageSearch', base64) // Store in sessionStorage for search page to pick up
      router.push('/search?mode=image') // Navigate to search page in image mode
    }
    reader.readAsDataURL(file) // Start reading file as data URL (base64)

    // Reset input so same file can be selected again (onChange won't fire for same file)
    e.target.value = ''
  }

  /* ───────────────────────────────────────────────────────────────
   * SEARCH BY VOICE (Web Speech API)
   * 
   * Uses the browser's built-in speech recognition.
   * Supported in Chrome, Edge, Safari.
   * Falls back gracefully if not supported.
   * ─────────────────────────────────────────────────────────────── */
  const handleVoiceSearch = () => {
    // Check browser support — SpeechRecognition is vendor-prefixed in some browsers
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome or Edge.') // Unsupported browser
      return
    }

    // If already listening, stop (toggle behavior)
    if (isListening) {
      setIsListening(false) // Stop listening — will need stop() on recognition object
      return
    }

    const recognition = new SpeechRecognition() // Create new speech recognition instance
    recognition.lang = 'en-US' // Set language to English (US)
    recognition.interimResults = false // Only return final results (not partial)
    recognition.maxAlternatives = 1 // Only return the top result

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript // Get the recognized text
      setSearchQuery(transcript) // Set search input to recognized text
      // Auto-search after voice input — navigate immediately
      router.push(`/search?q=${encodeURIComponent(transcript)}`)
      setIsListening(false) // Stop listening indicator
    }

    recognition.onerror = () => {
      setIsListening(false) // Error occurred — stop listening indicator
    }

    recognition.onend = () => {
      setIsListening(false) // Recognition ended — stop listening indicator
    }

    setIsListening(true) // Show listening animation
    recognition.start() // Start capturing audio
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-white/[0.06]"> {/* FIXED NAVBAR — sits on top of all content, translucent glass background */}
      {/* ─── Inner container — max width 2560px for ultra-wide screens, responsive padding ─── */}
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Flex row — logo left, nav+search center, actions right ─── */}
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ═══════════════════════════════════════════════════════
              LOGO — "AutoMart" brand text, links to home
              ═══════════════════════════════════════════════════════ */}
          <Link href="/" className="flex items-center gap-1 shrink-0"> {/* shrink-0 prevents logo from shrinking */}
            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}> {/* Outfit font for brand identity */}
              <span className="text-[var(--color-accent)]">Auto</span> {/* Lime green accent — "Auto" */}
              <span className="text-[var(--color-text)]">Mart</span> {/* White text — "Mart" */}
            </span>
          </Link>

          {/* ═══════════════════════════════════════════════════════
              CENTER SECTION: Nav Links + Search Bar
              Hidden on mobile (md:flex), shows on tablet/desktop
              ═══════════════════════════════════════════════════════ */}
          <div className="hidden md:flex items-center gap-5 flex-1 justify-center"> {/* flex-1 = takes remaining space, justify-center = centers content */}

            {/* ─── NAV LINKS — horizontal list with active state detection ─── */}
            <div className="flex items-center gap-1"> {/* gap-1 = tight spacing between links */}
              {navLinks.map((link) => { // Loop through each nav link definition
                const Icon = link.icon // Extract the Heroicon component for this link
                const active = isActive(link.href) // Check if this link matches current URL
                return (
                  <Link
                    key={link.href} // React key — unique identifier for list rendering
                    href={link.href} // Route path for this link
                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      active
                        ? 'text-[var(--color-text)]' // ACTIVE: bright text color
                        : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]' // INACTIVE: dim text, brightens on hover
                    }`}
                  >
                    {/* Icon + label inline */}
                    <span className="flex items-center gap-1.5"> {/* Flex row: icon then text */}
                      <Icon className="w-4 h-4" /> {/* 16x16 icon */}
                      {link.label} {/* Text label: "Home", "Categories", etc. */}
                    </span>

                    {/* ─── ACTIVE INDICATOR — Trending pill/capsule style ─── */}
                    {/* Replaces the old thin line (h-0.5) with a modern rounded pill background */}
                    {active && (
                      <span className="absolute inset-0 -z-10 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,20,0.1)]" />
                      /* inset-0 = fills entire link area    */
                      /* -z-10 = sits behind text + icon     */
                      /* rounded-xl = rounded rectangle shape */
                      /* bg accent/10 = subtle lime tint fill */
                      /* border accent/20 = subtle lime border */
                      /* shadow = soft lime glow around pill  */
                    )}
                  </Link>
                )
              })}
            </div>

            {/* ─── SEARCH BAR — drop shadow glow wrapper with voice + camera buttons ─── */}
            {/* Uses .search-glow-wrapper from globals.css for the soft box-shadow glow on focus */}
            <div className="search-glow-wrapper flex-1 max-w-sm"> {/* search-glow-wrapper: adds drop shadow glow on focus */}
              <form onSubmit={handleSearch} className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] focus-within:border-[var(--color-accent)]/40 focus-within:bg-white/[0.1] transition-all">
                {/* Magnifying glass icon — always visible on left side of search */}
                <MagnifyingGlassIcon className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" /> {/* shrink-0 = don't compress the icon */}

                {/* Text input — transparent bg, no border, takes remaining space */}
                <input
                  type="text" // Plain text input
                  value={searchQuery} // Controlled input — value tied to state
                  onChange={(e) => setSearchQuery(e.target.value)} // Update state on every keystroke
                  placeholder="Search parts..." // Ghost text when empty
                  className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] min-w-0" // Transparent styling, flex-1 fills space
                />

                {/* Clear button — only visible when search has more than 1 character */}
                {searchQuery.length > 1 && (
                  <button
                    type="button" // type=button prevents form submit
                    onClick={() => setSearchQuery('')} // Clear the search input
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.1] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all" // Small circular button
                    title="Clear search" // Tooltip on hover
                  >
                    <XMarkIcon className="w-3 h-3" /> {/* 12x12 X icon */}
                  </button>
                )}

                {/* ─── VOICE SEARCH BUTTON — pulsing animation when active ─── */}
                <div className="relative shrink-0"> {/* Relative container for absolute animated rings */}
                  {/* Pulsing ping ring — only when actively listening */}
                  {isListening && (
                    <span className="absolute inset-0 -m-1 rounded-full border-2 border-[var(--color-coral)] animate-ping opacity-75" />
                    /* animate-ping = expanding ring animation (Material Design style) */
                  )}
                  {/* Solid pulse ring — secondary animation for depth */}
                  {isListening && (
                    <span className="absolute inset-0 -m-1 rounded-full border border-[var(--color-coral)]/50 animate-pulse" />
                    /* animate-pulse = opacity breathing animation */
                  )}
                  <button
                    type="button" // type=button prevents form submit
                    onClick={handleVoiceSearch} // Toggle voice recognition
                    title={isListening ? 'Stop listening' : 'Search by voice'} // Dynamic tooltip
                    className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                      isListening
                        ? 'bg-[var(--color-coral)]/25 text-[var(--color-coral)] shadow-[0_0_12px_rgba(255,82,59,0.4)]' // ACTIVE: coral tint + glow shadow
                        : 'hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]' // INACTIVE: subtle hover effect
                    }`}
                  >
                    {/* Show animated sound wave bars when listening, mic icon otherwise */}
                    {isListening ? (
                      <span className="flex items-end gap-[2px] h-3"> {/* Flex column of bars, aligned to bottom */}
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0s', height: '40%' }} /> {/* Bar 1 — short, no delay */}
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.15s', height: '100%' }} /> {/* Bar 2 — tall, slight delay */}
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.3s', height: '60%' }} /> {/* Bar 3 — medium, more delay */}
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.1s', height: '80%' }} /> {/* Bar 4 — tall, slight delay */}
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.25s', height: '30%' }} /> {/* Bar 5 — short, medium delay */}
                      </span>
                    ) : (
                      <MicrophoneIcon className="w-3.5 h-3.5" /> /* 14x14 mic icon — default state */
                    )}
                  </button>
                </div>

                {/* ─── IMAGE SEARCH BUTTON — opens file picker for camera/photo ─── */}
                <button
                  type="button" // type=button prevents form submit
                  onClick={handleImageSearch} // Open file picker dialog
                  title="Search by image" // Tooltip on hover
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)] transition-all" // Subtle hover styling
                >
                  <CameraIcon className="w-3.5 h-3.5" /> {/* 14x14 camera icon */}
                </button>
              </form>
            </div>

            {/* Hidden file input — triggered programmatically by handleImageSearch */}
            <input
              ref={fileInputRef} // Ref — allows handleImageSearch to call .click()
              type="file" // File picker input
              accept="image/*" // Only accept image files in picker
              capture="environment" // Mobile: open rear camera by default
              onChange={handleImageSelected} // Process selected file
              className="hidden" // Visually hidden — never displayed
            />
          </div>

          {/* ═══════════════════════════════════════════════════════
              RIGHT SECTION: Wishlist + Cart + Settings
              Always visible — glass circle icon buttons
              ═══════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 shrink-0"> {/* shrink-0 = never compress this group */}

            {/* ─── WISHLIST BUTTON — glass circle (40x40, rounded-full, bg+blur+border) ─── */}
            <Link
              href="/wishlist" // Route to wishlist page
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              aria-label={`Wishlist with ${wishlistCount} items`} // Accessibility: screen reader label
            >
              {/* Show solid (filled) heart when items exist, outline heart when empty */}
              {wishlistCount > 0 ? (
                <HeartSolidIcon className="w-[18px] h-[18px] text-[var(--color-accent)]" /> /* Lime filled heart */
              ) : (
                <HeartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" /> /* Dim outline heart */
              )}
              {/* Badge — only shows when there are wishlist items */}
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {/* Badge positioned at top-right corner — lime bg, dark text */}
                  {wishlistCount} {/* Display count */}
                </span>
              )}
            </Link>

            {/* ─── CART BUTTON — same glass circle as wishlist, with count badge ─── */}
            <Link
              href="/cart" // Route to cart page
              // Same glass circle styling as wishlist button
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              aria-label={`Shopping cart with ${cartCount} items`} // Accessibility: screen reader label
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" /> {/* 18x18 cart icon */}
              {/* Badge — only shows when there are cart items */}
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {/* Badge positioned at top-right corner — lime bg, dark text */}
                  {cartCount} {/* Display count */}
                </span>
              )}
            </Link>

            {/* ═══════════════════════════════════════════════════════
                SETTINGS BUTTON — ALWAYS VISIBLE for all users
                Routes to /account when logged in, /login when not.
                FIX: Previously hidden when not logged in (was behind isLoggedIn check).
                Now always shows the gear icon so users can access settings.
                ═══════════════════════════════════════════════════════ */}
            <Link
              href={isLoggedIn ? '/account' : '/login'} // Route: account page if logged in, login page if not
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              // Same glass circle styling as wishlist + cart buttons
              title={isLoggedIn ? 'Account Settings' : 'Sign In to access settings'} // Dynamic tooltip
            >
              <Cog6ToothIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" /> {/* 18x18 gear icon — always rendered */}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
