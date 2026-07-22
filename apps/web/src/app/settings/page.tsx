/**
 * Settings Page — User preferences, vehicle details, coupons, and legal
 * 
 * SECTIONS:
 *   1. Profile — Gender selection for personalized product display
 *   2. My Vehicles — Add/edit/delete cars and bikes (drives product prioritization)
 *   3. Coupons & Referral — Apply coupons, refer a friend for bonus
 *   4. Preferences — Language, units (km/miles), notifications
 *   5. Terms & Conditions — Legal content (accordion style)
 * 
 * DATA STORAGE:
 *   - All data stored in localStorage (client-side only for now)
 *   - vehicles: [{ id, type, brand, model, year, color }]
 *   - settings: { gender, language, units, notifications }
 *   - coupons: [{ code, discount, validUntil }]
 *   - referralCode: unique user code for sharing
 * 
 * PERSONALIZATION:
 *   - Vehicle data is used by the product listing to prioritize
 *     parts compatible with the user's car/bike
 *   - Gender helps show relevant accessories (e.g., seat covers, keychains)
 */
'use client' // Next.js client component — enables hooks + browser APIs

import { useState, useEffect } from 'react' // React hooks for state + side effects
import {
  UserIcon,          // Profile/gender section
  WrenchIcon,        // Vehicle section
  GiftIcon,          // Coupons/referral section
  Cog6ToothIcon,     // Preferences section
  DocumentTextIcon,  // Terms & conditions section
  PlusIcon,          // Add button
  TrashIcon,         // Delete button
  CheckCircleIcon,   // Success indicator
  ClipboardIcon,     // Copy referral code
  TagIcon,           // Coupon tag
} from '@heroicons/react/24/outline' // Outline icon set — lightweight

/* ═══════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════ */

/** Vehicle — a car or bike the user owns */
interface Vehicle {
  id: number           // Unique ID (timestamp-based)
  type: 'car' | 'bike' // Vehicle category
  brand: string        // e.g., "Toyota", "Honda"
  model: string        // e.g., "Camry", "CBR600"
  year: string         // e.g., "2022"
  color: string        // e.g., "Red"
  nickname: string     // Friendly name: "My Car", "Track Bike"
}

/** UserSettings — all preferences stored in localStorage */
interface UserSettings {
  displayName: string     // User's display name
  email: string           // Email address
  phone: string           // Phone number
  currency: string        // 'USD' | 'EUR' | 'GBP' | 'INR' etc.
  timezone: string        // User's timezone
  notifications: boolean  // Email/push notifications on/off
}

/** Coupon — a discount code the user can apply */
interface Coupon {
  code: string         // Coupon code (e.g., "SAVE20")
  discount: string     // Discount amount (e.g., "20%")
  validUntil: string   // Expiry date (e.g., "2026-12-31")
  description: string  // What it's for (e.g., "First order discount")
}

/* ═══════════════════════════════════════════════════════════════
 * DEFAULT VALUES
 * ═══════════════════════════════════════════════════════════════ */

/** Default settings when no data exists in localStorage */
const defaultSettings: UserSettings = {
  displayName: '',        // No name until user sets one
  email: '',              // No email until user sets one
  phone: '',              // No phone until user sets one
  currency: 'USD',        // Default: US Dollar
  timezone: 'UTC',        // Default: UTC
  notifications: true,    // Default: notifications on
}

/** Empty vehicle list */
const defaultVehicles: Vehicle[] = []

/** Available car brands (popular auto parts brands) */
const carBrands = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
  'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Lexus', 'Mazda',
  'Subaru', 'Jeep', 'Dodge', 'Ram', 'GMC', 'Buick', 'Tesla',
  'Other' // Catch-all for unlisted brands
]

/** Available bike brands (popular motorcycle brands) */
const bikeBrands = [
  'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Harley-Davidson', 'BMW',
  'KTM', 'Ducati', 'Triumph', 'Royal Enfield', 'Bajaj', 'TVS',
  'Hero', 'Other' // Catch-all for unlisted brands
]

/** Current year — used for year dropdown max value */
const currentYear = new Date().getFullYear()

/* ═══════════════════════════════════════════════════════════════
 * SETTINGS PAGE COMPONENT
 * ═══════════════════════════════════════════════════════════════ */

export default function SettingsPage() {

  /* ─── State declarations ─── */
  const [settings, setSettings] = useState<UserSettings>(defaultSettings) // User preferences
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles)   // User's vehicles
  const [activeSection, setActiveSection] = useState('profile')          // Current visible section
  const [showAddVehicle, setShowAddVehicle] = useState(false)            // Add vehicle modal toggle
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null) // Vehicle being edited (null = adding new)
  const [saved, setSaved] = useState(false)                              // "Saved!" feedback flag
  const [couponCode, setCouponCode] = useState('')                       // Coupon input value
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([])    // Active coupons
  const [referralCopied, setReferralCopied] = useState(false)           // "Copied!" feedback for referral code

  /* ─── New vehicle form state ─── */
  const [newVehicle, setNewVehicle] = useState({
    type: 'car' as 'car' | 'bike', // Default to car
    brand: '',                       // Selected brand
    model: '',                       // Model name
    year: '',                        // Manufacturing year
    color: '',                       // Vehicle color
    nickname: '',                    // Friendly name
  })

  /* ─── Terms section state ─── */
  const [expandedToc, setExpandedToc] = useState<string | null>(null) // Which T&C section is expanded

  /* ═══════════════════════════════════════════════════════════════
   * LOAD DATA FROM LOCALSTORAGE ON MOUNT
   * ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    try {
      // Load settings
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) }) // Merge with defaults
      }

      // Load vehicles
      const savedVehicles = localStorage.getItem('vehicles')
      if (savedVehicles) {
        setVehicles(JSON.parse(savedVehicles))
      }

      // Load applied coupons
      const savedCoupons = localStorage.getItem('appliedCoupons')
      if (savedCoupons) {
        setAppliedCoupons(JSON.parse(savedCoupons))
      }
    } catch {
      // If parsing fails, use defaults — localStorage may be corrupted
    }
  }, []) // Empty deps — runs once on mount

  /* ═══════════════════════════════════════════════════════════════
   * SAVE SETTINGS TO LOCALSTORAGE
   * Shows "Saved!" feedback for 2 seconds
   * ═══════════════════════════════════════════════════════════════ */
  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings)) // Persist to localStorage
    setSaved(true) // Show success feedback
    setTimeout(() => setSaved(false), 2000) // Hide after 2 seconds
  }

  /* ═══════════════════════════════════════════════════════════════
   * VEHICLE MANAGEMENT
   * ═══════════════════════════════════════════════════════════════ */

  /** Add or update a vehicle */
  const saveVehicle = () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.year) {
      return // Don't save incomplete vehicles
    }

    let updatedVehicles: Vehicle[]

    if (editingVehicle) {
      // UPDATE existing vehicle — replace matching ID
      updatedVehicles = vehicles.map(v =>
        v.id === editingVehicle.id
          ? { ...v, ...newVehicle } // Merge new data into existing vehicle
          : v
      )
    } else {
      // ADD new vehicle — append with unique ID
      const vehicle: Vehicle = {
        id: Date.now(), // Timestamp as unique ID
        ...newVehicle,  // Spread form data
      }
      updatedVehicles = [...vehicles, vehicle]
    }

    setVehicles(updatedVehicles) // Update state
    localStorage.setItem('vehicles', JSON.stringify(updatedVehicles)) // Persist
    resetVehicleForm() // Clear form and close modal
  }

  /** Delete a vehicle by ID */
  const deleteVehicle = (id: number) => {
    const updated = vehicles.filter(v => v.id !== id) // Remove matching vehicle
    setVehicles(updated) // Update state
    localStorage.setItem('vehicles', JSON.stringify(updated)) // Persist
  }

  /** Open edit modal for a vehicle */
  const editVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle) // Set as editing target
    setNewVehicle({           // Populate form with existing data
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      nickname: vehicle.nickname,
    })
    setShowAddVehicle(true) // Open modal
  }

  /** Reset vehicle form and close modal */
  const resetVehicleForm = () => {
    setNewVehicle({ type: 'car', brand: '', model: '', year: '', color: '', nickname: '' })
    setShowAddVehicle(false) // Close modal
    setEditingVehicle(null)  // Clear editing state
  }

  /* ═══════════════════════════════════════════════════════════════
   * COUPON MANAGEMENT
   * ═══════════════════════════════════════════════════════════════ */

  /** Apply a coupon code */
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase() // Normalize to uppercase
    if (!code) return // Empty code

    // Check if already applied
    if (appliedCoupons.some(c => c.code === code)) {
      alert('This coupon is already applied!')
      return
    }

    // Demo coupons — in production, validate via API
    const validCoupons: Record<string, Coupon> = {
      'WELCOME10': { code: 'WELCOME10', discount: '10%', validUntil: '2026-12-31', description: 'Welcome discount — first order' },
      'SAVE20': { code: 'SAVE20', discount: '20%', validUntil: '2026-09-30', description: 'Seasonal sale — all parts' },
      'BIKE15': { code: 'BIKE15', discount: '15%', validUntil: '2026-12-31', description: 'Bike parts exclusive' },
      'FREESHIP': { code: 'FREESHIP', discount: 'Free Shipping', validUntil: '2026-12-31', description: 'Free delivery on any order' },
    }

    const coupon = validCoupons[code]
    if (coupon) {
      const updated = [...appliedCoupons, coupon] // Add to applied list
      setAppliedCoupons(updated)
      localStorage.setItem('appliedCoupons', JSON.stringify(updated)) // Persist
      setCouponCode('') // Clear input
    } else {
      alert('Invalid coupon code. Try: WELCOME10, SAVE20, BIKE15, FREESHIP')
    }
  }

  /** Remove an applied coupon */
  const removeCoupon = (code: string) => {
    const updated = appliedCoupons.filter(c => c.code !== code) // Remove coupon
    setAppliedCoupons(updated)
    localStorage.setItem('appliedCoupons', JSON.stringify(updated)) // Persist
  }

  /* ═══════════════════════════════════════════════════════════════
   * REFERRAL CODE
   * Generates a unique referral code from user's name + random digits
   * ═══════════════════════════════════════════════════════════════ */
  const getReferralCode = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const name = (user.name || 'USER').replace(/\s/g, '').toUpperCase().slice(0, 5) // First 5 chars of name
      const digits = Math.floor(1000 + Math.random() * 9000) // 4 random digits
      return `${name}${digits}` // e.g., "JOHN4523"
    } catch {
      return `AM${Math.floor(10000 + Math.random() * 90000)}` // Fallback: AM + 5 digits
    }
  }

  /** Copy referral code to clipboard */
  const copyReferralCode = async () => {
    const code = getReferralCode()
    try {
      await navigator.clipboard.writeText(code) // Clipboard API
      setReferralCopied(true) // Show "Copied!" feedback
      setTimeout(() => setReferralCopied(false), 2000) // Hide after 2s
    } catch {
      // Fallback for older browsers
      alert(`Your referral code: ${code}`)
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   * SECTION DEFINITIONS — sidebar navigation
   * ═══════════════════════════════════════════════════════════════ */
  const sections = [
    { id: 'profile', label: 'General Settings', icon: UserIcon },        // Name, email, phone, currency, timezone
    { id: 'vehicles', label: 'My Vehicles', icon: WrenchIcon },            // Car/bike management
    { id: 'coupons', label: 'Coupons & Referral', icon: GiftIcon },        // Discounts + refer a friend
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },      // Language, units, notifications
    { id: 'terms', label: 'Terms & Conditions', icon: DocumentTextIcon },  // Legal content
  ]

  /* ═══════════════════════════════════════════════════════════════
   * TERMS & CONDITIONS DATA
   * Static legal content organized in expandable sections
   * ═══════════════════════════════════════════════════════════════ */
  const tocSections = [
    {
      id: 'terms',
      title: 'Terms of Service',
      content: `Welcome to AutoMart. By using our platform, you agree to these terms. AutoMart is a marketplace for automotive spare parts connecting buyers with verified suppliers. All orders are subject to product availability and pricing at the time of purchase. We reserve the right to refuse service to anyone for any reason. Prices are subject to change without notice. Delivery times are estimates and not guaranteed.`,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: `We collect personal information (name, email, phone) to process orders and improve your experience. Vehicle data you provide is used solely for product personalization — we do not sell or share this data with third parties for marketing. We use industry-standard encryption for all data transmission. You may request deletion of your data at any time by contacting support@automart.com.`,
    },
    {
      id: 'returns',
      title: 'Return & Refund Policy',
      content: `Parts may be returned within 30 days of delivery if unused and in original packaging. Electrical components are non-returnable once installed. Refunds are processed within 5-7 business days to the original payment method. Shipping costs are non-refundable unless the return is due to our error. Damaged items must be reported within 48 hours of delivery with photo evidence.`,
    },
    {
      id: 'warranty',
      title: 'Warranty Information',
      content: `All parts sold on AutoMart come with a minimum 6-month manufacturer warranty. Extended warranty options are available at checkout. Warranty covers defects in materials and workmanship under normal use. It does not cover damage from improper installation, accidents, or modifications. Warranty claims require proof of purchase and may require the part to be returned for inspection.`,
    },
    {
      id: 'delivery',
      title: 'Delivery Policy',
      content: `Standard delivery: 30 minutes in supported areas, next-day for others. Free delivery on orders over $50. Express delivery (under 15 minutes) available for $4.99 surcharge. We deliver to residential, commercial, and workshop addresses. Someone must be available to receive the delivery. We currently serve select cities — check the app for availability in your area.`,
    },
  ]

  /* ═══════════════════════════════════════════════════════════════
   * RENDER
   * ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[2560px] mx-auto"> {/* Page container with responsive padding */}

      {/* ─── PAGE HEADER ─── */}
      <div className="mb-8"> {/* Bottom margin before content */}
        {/* Large bold heading using Outfit font for brand consistency */}
        <h1
          className="text-3xl font-extrabold"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Settings {/* Page title */}
        </h1>
        <p className="text-[var(--color-text-dim)] text-sm mt-1"> {/* Subtitle */}
          Manage your profile, vehicles, and preferences {/* Description */}
        </p>
      </div>

      {/* ─── MAIN LAYOUT: Sidebar + Content ─── */}
      <div className="grid lg:grid-cols-[260px_1fr] gap-6"> {/* 2 columns on desktop, single on mobile */}

        {/* ═══ LEFT SIDEBAR: Section Navigation ═══ */}
        <div className="card p-4 h-fit"> {/* Glass card for sidebar */}
          <nav className="space-y-1"> {/* Vertical nav list */}
            {sections.map((section) => ( // Loop through each section
              <button
                key={section.id} // React key
                onClick={() => setActiveSection(section.id)} // Switch to this section
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20' // ACTIVE: lime tint + border
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04]' // INACTIVE: subtle hover
                }`}
              >
                <section.icon className="w-5 h-5" /> {/* Section icon */}
                {section.label} {/* Section name */}
              </button>
            ))}
          </nav>
        </div>

        {/* ═══ RIGHT: Section Content ═══ */}
        <div className="space-y-6"> {/* Vertical spacing between cards */}

          {/* ═══════════════════════════════════════════════════════
              SECTION 1: GENERAL SETTINGS
              Name, email, phone, currency, timezone, dark mode
              ═══════════════════════════════════════════════════════ */}
          {activeSection === 'profile' && (
            <div className="card p-6"> {/* Glass card */}
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                General Settings {/* Section heading */}
              </h3>
              <p className="text-sm text-[var(--color-text-dim)] mb-6"> {/* Description */}
                Basic account info and display preferences
              </p>

              <div className="space-y-5 max-w-lg"> {/* Form container */}

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                    Display Name {/* Label */}
                  </label>
                  <input
                    type="text"
                    value={settings.displayName} // Controlled input
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} // Update state
                    placeholder="Your name" // Ghost text when empty
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                    Email Address {/* Label */}
                  </label>
                  <input
                    type="email"
                    value={settings.email} // Controlled input
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })} // Update state
                    placeholder="you@example.com" // Ghost text when empty
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                    Phone Number {/* Label */}
                  </label>
                  <input
                    type="tel"
                    value={settings.phone} // Controlled input
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })} // Update state
                    placeholder="+1 (555) 000-0000" // Ghost text when empty
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                  />
                </div>

                {/* Currency + Timezone — side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Currency dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Currency</label>
                    <select
                      value={settings.currency} // Controlled select
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })} // Update currency
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none transition-all"
                    >
                      <option value="USD">USD ($)</option>     {/* US Dollar */}
                      <option value="EUR">EUR (&euro;)</option>     {/* Euro */}
                      <option value="GBP">GBP (&pound;)</option>     {/* British Pound */}
                      <option value="INR">INR (&#8377;)</option>     {/* Indian Rupee */}
                      <option value="AED">AED</option>    {/* UAE Dirham */}
                      <option value="SAR">SAR</option>    {/* Saudi Riyal */}
                    </select>
                  </div>
                  {/* Timezone dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Timezone</label>
                    <select
                      value={settings.timezone} // Controlled select
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} // Update timezone
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none transition-all"
                    >
                      <option value="UTC">UTC (GMT+0)</option>         {/* UTC */}
                      <option value="EST">EST (GMT-5)</option>         {/* US East */}
                      <option value="CST">CST (GMT-6)</option>         {/* US Central */}
                      <option value="PST">PST (GMT-8)</option>         {/* US Pacific */}
                      <option value="GMT">GMT (GMT+0)</option>         {/* UK */}
                      <option value="CET">CET (GMT+1)</option>         {/* Central Europe */}
                      <option value="IST">IST (GMT+5:30)</option>      {/* India */}
                      <option value="GST">GST (GMT+4)</option>         {/* Gulf */}
                      <option value="JST">JST (GMT+9)</option>         {/* Japan */}
                    </select>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={saveSettings} // Save all settings
                  className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                >
                  {saved ? 'Saved!' : 'Save Changes'} {/* Toggle text on save */}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SECTION 2: MY VEHICLES
              Add cars/bikes — used for product prioritization
              ═══════════════════════════════════════════════════════ */}
          {activeSection === 'vehicles' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6"> {/* Header row */}
                <div>
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    My Vehicles {/* Section heading */}
                  </h3>
                  <p className="text-xs text-[var(--color-text-dim)] mt-1">
                    Add your vehicles to see compatible parts first {/* Subtitle */}
                  </p>
                </div>
                {/* Add vehicle button */}
                <button
                  onClick={() => { resetVehicleForm(); setShowAddVehicle(true) }} // Open empty form
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" /> {/* Plus icon */}
                  Add Vehicle {/* Button text */}
                </button>
              </div>

              {/* Vehicle list — or empty state */}
              {vehicles.length === 0 ? (
                <div className="text-center py-12"> {/* Empty state */}
                  <WrenchIcon className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" /> {/* Wrench icon */}
                  <p className="text-sm text-[var(--color-text-dim)] mb-1">No vehicles added yet</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Add your car or bike to get personalized part recommendations</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4"> {/* Grid of vehicle cards */}
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id} // React key
                      className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/20 transition-all"
                      /* Dark card with hover glow */
                    >
                      {/* Vehicle header — icon + nickname + actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {/* Vehicle type badge — car or bike */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            vehicle.type === 'car'
                              ? 'bg-[var(--color-blue)]/15 text-[var(--color-blue)]' // Car: blue badge
                              : 'bg-[var(--color-coral)]/15 text-[var(--color-coral)]' // Bike: coral badge
                          }`}>
                            {vehicle.type} {/* "car" or "bike" */}
                          </span>
                          {vehicle.nickname && ( // Show nickname if provided
                            <span className="text-sm font-medium">{vehicle.nickname}</span>
                          )}
                        </div>
                        {/* Action buttons — edit + delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => editVehicle(vehicle)} // Open edit modal
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors p-1"
                            title="Edit vehicle"
                          >
                            <Cog6ToothIcon className="w-4 h-4" /> {/* Gear icon for edit */}
                          </button>
                          <button
                            onClick={() => deleteVehicle(vehicle.id)} // Delete vehicle
                            className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors p-1"
                            title="Delete vehicle"
                          >
                            <TrashIcon className="w-4 h-4" /> {/* Trash icon for delete */}
                          </button>
                        </div>
                      </div>
                      {/* Vehicle details */}
                      <div className="text-sm text-[var(--color-text-dim)] space-y-0.5">
                        <p><span className="text-[var(--color-text-muted)]">Brand:</span> {vehicle.brand}</p> {/* Brand name */}
                        <p><span className="text-[var(--color-text-muted)]">Model:</span> {vehicle.model}</p> {/* Model name */}
                        <p><span className="text-[var(--color-text-muted)]">Year:</span> {vehicle.year}</p> {/* Year */}
                        {vehicle.color && ( // Only show color if provided
                          <p><span className="text-[var(--color-text-muted)]">Color:</span> {vehicle.color}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ ADD/EDIT VEHICLE MODAL ═══ */}
              {showAddVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"> {/* Overlay */}
                  <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
                    {/* Modal header */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} {/* Dynamic heading */}
                      </h4>
                      <button
                        onClick={resetVehicleForm} // Close modal
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      >
                        &#x2715; {/* X close button */}
                      </button>
                    </div>

                    {/* Vehicle form */}
                    <div className="space-y-4">
                      {/* Vehicle type — car or bike toggle */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Vehicle Type</label>
                        <div className="flex gap-2">
                          {(['car', 'bike'] as const).map((type) => (
                            <button
                              key={type} // React key
                              onClick={() => setNewVehicle({ ...newVehicle, type, brand: '' })} // Reset brand when switching type
                              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                newVehicle.type === type
                                  ? type === 'car'
                                    ? 'border-[var(--color-blue)]/40 bg-[var(--color-blue)]/10 text-[var(--color-blue)]' // Car selected: blue
                                    : 'border-[var(--color-coral)]/40 bg-[var(--color-coral)]/10 text-[var(--color-coral)]' // Bike selected: coral
                                  : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-muted)]' // Unselected
                              }`}
                            >
                              {type === 'car' ? '🚗 Car' : '🏍️ Bike'} {/* Emoji label */}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Brand dropdown — options change based on vehicle type */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Brand</label>
                        <select
                          value={newVehicle.brand} // Controlled select
                          onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} // Update brand
                          className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none transition-all"
                        >
                          <option value="">Select brand</option> {/* Placeholder */}
                          {(newVehicle.type === 'car' ? carBrands : bikeBrands).map((brand) => ( // Show car or bike brands
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                      </div>

                      {/* Model name — free text input */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Model</label>
                        <input
                          type="text"
                          value={newVehicle.model} // Controlled input
                          onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} // Update model
                          placeholder={newVehicle.type === 'car' ? 'e.g., Camry, Civic' : 'e.g., CBR600, MT-07'} // Context-aware placeholder
                          className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none transition-all"
                        />
                      </div>

                      {/* Year + Color — side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Year dropdown */}
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Year</label>
                          <select
                            value={newVehicle.year} // Controlled select
                            onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} // Update year
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none transition-all"
                          >
                            <option value="">Year</option> {/* Placeholder */}
                            {/* Generate year options from current year back to 1980 */}
                            {Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i).map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        {/* Color input */}
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Color (optional)</label>
                          <input
                            type="text"
                            value={newVehicle.color} // Controlled input
                            onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })} // Update color
                            placeholder="e.g., Red"
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Nickname — friendly name for the vehicle */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">Nickname (optional)</label>
                        <input
                          type="text"
                          value={newVehicle.nickname} // Controlled input
                          onChange={(e) => setNewVehicle({ ...newVehicle, nickname: e.target.value })} // Update nickname
                          placeholder="e.g., My Daily, Track Day Bike"
                          className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none transition-all"
                        />
                      </div>

                      {/* Action buttons — Cancel + Save */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={resetVehicleForm} // Close without saving
                          className="flex-1 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-dim)] hover:bg-white/[0.04] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveVehicle} // Save vehicle
                          disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.year} // Disable if incomplete
                          className="flex-1 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {editingVehicle ? 'Update' : 'Add Vehicle'} {/* Dynamic button text */}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SECTION 3: COUPONS & REFERRAL
              Apply discount codes + refer a friend for bonus
              ═══════════════════════════════════════════════════════ */}
          {activeSection === 'coupons' && (
            <div className="space-y-6"> {/* Vertical spacing between cards */}

              {/* ─── Apply Coupon Card ─── */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Coupons & Offers {/* Section heading */}
                </h3>
                <p className="text-xs text-[var(--color-text-dim)] mb-6">
                  Apply a coupon code for discounts on your next order
                </p>

                {/* Coupon input row */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={couponCode} // Controlled input
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} // Auto-uppercase as user types
                    placeholder="Enter coupon code" // Ghost text
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none transition-all uppercase tracking-wider font-mono"
                    /* uppercase + tracking-wider + font-mono = coupon code styling */
                  />
                  <button
                    onClick={applyCoupon} // Apply the code
                    disabled={!couponCode.trim()} // Disable if empty
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply {/* Button text */}
                  </button>
                </div>

                {/* Available coupon hints */}
                <div className="mb-6">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Try these demo codes:</p>
                  <div className="flex flex-wrap gap-2">
                    {['WELCOME10', 'SAVE20', 'BIKE15', 'FREESHIP'].map((code) => (
                      <button
                        key={code} // React key
                        onClick={() => setCouponCode(code)} // Fill input with this code
                        className="px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-all"
                      >
                        {code} {/* Coupon code text */}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Applied coupons list */}
                {appliedCoupons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-dim)] mb-3">Active Coupons:</p>
                    <div className="space-y-2">
                      {appliedCoupons.map((coupon) => (
                        <div
                          key={coupon.code} // React key
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/15"
                        >
                          <div className="flex items-center gap-3">
                            <TagIcon className="w-4 h-4 text-[var(--color-accent)]" /> {/* Tag icon */}
                            <div>
                              <p className="text-sm font-medium font-mono">{coupon.code}</p> {/* Coupon code */}
                              <p className="text-xs text-[var(--color-text-dim)]">{coupon.description}</p> {/* Description */}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[var(--color-accent)]">{coupon.discount}</span> {/* Discount amount */}
                            <button
                              onClick={() => removeCoupon(coupon.code)} // Remove coupon
                              className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                              title="Remove coupon"
                            >
                              &#x2715; {/* X button */}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Refer a Friend Card ─── */}
              <div className="card p-6">
                <div className="flex items-start gap-4"> {/* Icon + content side by side */}
                  {/* Gift icon — decorative */}
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-coral)]/10 flex items-center justify-center shrink-0">
                    <GiftIcon className="w-6 h-6 text-[var(--color-coral)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Refer a Friend {/* Section heading */}
                    </h3>
                    <p className="text-sm text-[var(--color-text-dim)] mb-4">
                      Share your code with friends. Both of you get <span className="text-[var(--color-accent)] font-bold">$10 off</span> your next order! {/* Referral bonus */}
                    </p>

                    {/* Referral code display + copy button */}
                    <div className="flex items-center gap-2">
                      {/* Code display box */}
                      <div className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-lg font-bold tracking-widest text-[var(--color-accent)] text-center">
                        {getReferralCode()} {/* Generated referral code */}
                      </div>
                      {/* Copy button */}
                      <button
                        onClick={copyReferralCode} // Copy to clipboard
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          referralCopied
                            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30' // Copied: green success state
                            : 'bg-[var(--color-coral)] text-white hover:bg-[var(--color-coral)]/90' // Default: coral CTA
                        }`}
                      >
                        {referralCopied ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" /> Copied! {/* Success state */}
                          </>
                        ) : (
                          <>
                            <ClipboardIcon className="w-4 h-4" /> Copy Code {/* Default state */}
                          </>
                        )}
                      </button>
                    </div>

                    {/* How it works — steps */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      {[
                        { step: '1', title: 'Share', desc: 'Send your code to friends' }, // Step 1
                        { step: '2', title: 'They Order', desc: 'Friend applies code at checkout' }, // Step 2
                        { step: '3', title: 'Both Save', desc: 'You both get $10 off' }, // Step 3
                      ].map((item) => (
                        <div key={item.step} className="text-center"> {/* Step card */}
                          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-[var(--color-accent)]">{item.step}</span> {/* Step number */}
                          </div>
                          <p className="text-xs font-medium">{item.title}</p> {/* Step title */}
                          <p className="text-[10px] text-[var(--color-text-muted)]">{item.desc}</p> {/* Step description */}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SECTION 4: PREFERENCES
              Notification settings + app behavior
              ═══════════════════════════════════════════════════════ */}
          {activeSection === 'preferences' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Preferences {/* Section heading */}
              </h3>
              <p className="text-xs text-[var(--color-text-dim)] mb-6">
                Control notifications and app behavior
              </p>

              <div className="space-y-4 max-w-lg"> {/* Form container */}

                {/* Notifications toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-[var(--color-text-dim)]">Order updates, delivery alerts, offers</p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })} // Toggle
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.notifications
                        ? 'bg-[var(--color-accent)]' // ON: lime
                        : 'bg-[var(--color-border)]' // OFF: gray
                    }`}
                  >
                    {/* Toggle knob — slides left (OFF) or right (ON) */}
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                      settings.notifications ? 'left-[22px]' : 'left-0.5' // OFF: 2px from left, ON: 22px from left
                    }`} />
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={saveSettings} // Save preferences
                  className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                >
                  {saved ? 'Saved!' : 'Save Preferences'} {/* Toggle text on save */}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SECTION 5: TERMS & CONDITIONS
              Legal content in expandable accordion sections
              ═══════════════════════════════════════════════════════ */}
          {activeSection === 'terms' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Terms & Conditions {/* Section heading */}
              </h3>
              <p className="text-xs text-[var(--color-text-dim)] mb-6">
                Please review our policies before using AutoMart
              </p>

              {/* Accordion sections */}
              <div className="space-y-3">
                {tocSections.map((section) => (
                  <div
                    key={section.id} // React key
                    className="rounded-xl border border-[var(--color-border)] overflow-hidden"
                    /* Rounded border container for each section */
                  >
                    {/* Accordion header — clickable to expand/collapse */}
                    <button
                      onClick={() => setExpandedToc(expandedToc === section.id ? null : section.id)} // Toggle expand
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-sm font-medium">{section.title}</span> {/* Section title */}
                      {/* Expand/collapse indicator — rotates arrow */}
                      <span className={`text-[var(--color-text-muted)] transition-transform ${
                        expandedToc === section.id ? 'rotate-180' : '' // Rotate 180deg when expanded
                      }`}>
                        &#x25BC; {/* Down arrow character */}
                      </span>
                    </button>
                    {/* Accordion content — shown when expanded */}
                    {expandedToc === section.id && (
                      <div className="px-5 pb-4 text-sm text-[var(--color-text-dim)] leading-relaxed border-t border-[var(--color-border)]">
                        <p className="pt-4">{section.content}</p> {/* Legal text */}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Last updated notice */}
              <p className="text-xs text-[var(--color-text-muted)] mt-6 text-center">
                Last updated: January 2026 {/* Static date */}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
