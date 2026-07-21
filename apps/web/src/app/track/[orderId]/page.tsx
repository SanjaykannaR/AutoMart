/**
 * Track Order Page — Live order tracking with progress steps
 * 
 * WHAT IT DOES:
 *   - Shows a single order's tracking status
 *   - Displays progress steps (Confirmed → Preparing → Out for Delivery → Delivered)
 *   - Shows estimated delivery time
 *   - Displays order details (items, total, address)
 *   - Visual timeline with animated progress bar
 * 
 * HOW IT WORKS:
 *   - Reads order ID from URL: /track/[orderId]
 *   - Fetches order data from API (with localStorage fallback for demo)
 *   - Progress is calculated based on order status
 *   - Each step has an icon, label, and timestamp
 * 
 * PROGRESS STEPS:
 *   1. Order Confirmed — order received and payment verified
 *   2. Preparing — mechanic is gathering the parts
 *   3. Out for Delivery — on the way to you
 *   4. Delivered — completed
 * 
 * DATA:
 *   - Order stored in localStorage as "orders" JSON array
 *   - Each order has: id, status, items, total, address, createdAt
 *   - Status maps to a progress percentage (0-100%)
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircleIcon, ClockIcon, TruckIcon, MapPinIcon } from '@heroicons/react/24/solid'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

/**
 * Order type — what an order looks like in localStorage.
 * Includes tracking info and item details.
 */
interface Order {
  id: string
  status: string           // "confirmed" | "preparing" | "out_for_delivery" | "delivered"
  items: OrderItem[]
  total: number
  address: string
  createdAt: string        // ISO date string
  estimatedDelivery: string // ISO date string
}

/**
 * OrderItem type — a single item in an order.
 */
interface OrderItem {
  name: string
  price: number
  qty: number
  image: string
}

/**
 * Tracking steps definition — the 4 stages of delivery.
 * Each step has:
 *   - id: matches order.status values
 *   - label: human-readable name
 *   - icon: component to display
 *   - description: what's happening at this stage
 */
const trackingSteps = [
  {
    id: 'confirmed',
    label: 'Order Confirmed',
    icon: CheckCircleIcon,
    description: 'Your order has been received and payment verified.',
  },
  {
    id: 'preparing',
    label: 'Preparing',
    icon: ClockIcon,
    description: 'Your mechanic is gathering the parts.',
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: TruckIcon,
    description: 'Your parts are on the way!',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: MapPinIcon,
    description: 'Parts have been delivered. Enjoy!',
  },
]

export default function TrackOrderPage() {
  // ─── Get order ID from URL ───
  // /track/[orderId] → params.orderId = the order ID
  const params = useParams()
  const orderId = params?.orderId as string

  // ─── State ───
  const [order, setOrder] = useState<Order | null>(null)
  const [loaded, setLoaded] = useState(false)

  /**
   * LOAD ORDER FROM LOCALSTORAGE
   * 
   * Reads the "orders" array from localStorage and finds the matching order.
   * In production, this would be an API call to the order service.
   */
  useEffect(() => {
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const found = orders.find((o: Order) => o.id === orderId)
      if (found) {
        setOrder(found)
      }
    } catch {
      setOrder(null)
    }
    setLoaded(true)
  }, [orderId])

  /**
   * CALCULATE PROGRESS PERCENTAGE
   * 
   * Maps order status to a percentage (0-100%).
   * Used to fill the progress bar width.
   */
  const getProgress = (status: string): number => {
    switch (status) {
      case 'confirmed': return 0
      case 'preparing': return 33
      case 'out_for_delivery': return 66
      case 'delivered': return 100
      default: return 0
    }
  }

  /**
   * FIND CURRENT STEP INDEX
   * 
   * Returns the index of the current status in trackingSteps array.
   * Used to determine which steps are completed vs pending.
   */
  const getCurrentStep = (status: string): number => {
    return trackingSteps.findIndex((s) => s.id === status)
  }

  // ─── LOADING STATE ───
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ─── ORDER NOT FOUND ───
  if (!order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <TruckIcon className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Order not found
          </h1>
          <p className="text-[var(--color-text-dim)] text-sm mb-6">
            We couldn&apos;t find this order. Check the order ID and try again.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStep(order.status)
  const progress = getProgress(order.status)

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      {/* ─── Back Button ─── */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Track Order
        </h1>
        <p className="text-[var(--color-text-dim)] text-sm mt-1">
          Order #{order.id}
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* ─── LEFT: Tracking Progress ─── */}
        <div className="space-y-6">
          {/* ─── Progress Bar ─── 
           * Shows how far along the order is
           * Lime fill grows based on progress percentage
           */}
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Delivery Progress
            </h3>

            {/* Progress bar track */}
            <div className="relative mb-8">
              <div className="h-1.5 rounded-full bg-[var(--color-border)] w-full">
                {/* Progress fill — animates width based on status */}
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ─── Tracking Steps ─── 
             * Vertical timeline with icons
             * Each step shows: icon + label + description + timestamp
             * Completed steps: lime icon
             * Current step: lime icon + pulse animation
             * Pending steps: gray icon
             */}
            <div className="space-y-0">
              {trackingSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="flex gap-4">
                    {/* Timeline line + icon */}
                    <div className="flex flex-col items-center">
                      {/* Icon circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                        } ${isCurrent ? 'ring-2 ring-[var(--color-accent)]/30' : ''}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      {/* Connecting line — hidden for last step */}
                      {index < trackingSteps.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 min-h-[40px] transition-colors ${
                            index < currentStepIndex
                              ? 'bg-[var(--color-accent)]'
                              : 'bg-[var(--color-border)]'
                          }`}
                        />
                      )}
                    </div>

                    {/* Step info */}
                    <div className="pb-8">
                      <p
                        className={`font-semibold text-sm ${
                          isCompleted ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                        {step.description}
                      </p>
                      {/* Show timestamp if this step is completed */}
                      {isCompleted && (
                        <p className="text-xs text-[var(--color-accent)] mt-1">
                          {index < currentStepIndex ? 'Completed' : 'In Progress'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Order Summary ─── 
         * Shows items, total, delivery address
         * Stays visible while scrolling the progress
         */}
        <div className="space-y-4">
          {/* ─── Estimated Delivery ─── */}
          <div className="card p-5">
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Estimated Delivery</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {order.estimatedDelivery
                ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Calculating...'}
            </p>
          </div>

          {/* ─── Delivery Address ─── */}
          <div className="card p-5">
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Delivering to</p>
            <p className="text-sm text-[var(--color-text)]">{order.address}</p>
          </div>

          {/* ─── Order Items ─── */}
          <div className="card p-5">
            <p className="text-xs text-[var(--color-text-dim)] mb-3">Order Items</p>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Item thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">Qty: {item.qty}</p>
                  </div>
                  {/* Item price */}
                  <p className="text-xs font-medium text-[var(--color-accent)]">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold text-[var(--color-accent)]">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
