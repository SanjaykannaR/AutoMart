'use client'

/**
 * Cloudflare Turnstile widget — shared across login/register/admin-login forms.
 *
 * - Loads the official Turnstile script lazily, on first mount only.
 * - Self-contained: no npm dependency, no global context.
 * - When NEXT_PUBLIC_TURNSTILE_SITE_KEY is empty (dev/CI), renders nothing
 *   and TURNSTILE_ENABLED is false — forms behave exactly as before.
 *
 * Usage in a form:
 *   <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} onExpire={...} />
 *   // submit: if (TURNSTILE_ENABLED && !turnstileToken) → block
 *   // send header: 'x-turnstile-token': turnstileToken
 *   // after submission: setTurnstileToken(''); setTurnstileKey(k => k + 1)
 *   //   (tokens are single-use — remounting issues a fresh challenge)
 */
import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileWidgetProps {
  /** Called with a fresh single-use token when the challenge is solved. */
  onToken: (token: string) => void
  /** Called when a previously-issued token expires (clear your state). */
  onExpire?: () => void
  /** Called when the challenge errors (clear your state). */
  onError?: () => void
}

export default function TurnstileWidget({ onToken, onExpire, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef('')

  const render = useCallback(() => {
    const el = containerRef.current
    if (!el || !window.turnstile) return
    if (widgetIdRef.current) {
      // Already rendered — issue a fresh challenge.
      window.turnstile.reset(widgetIdRef.current)
      return
    }
    widgetIdRef.current = window.turnstile.render(el, {
      sitekey: SITE_KEY,
      callback: onToken,
      'expired-callback': () => {
        widgetIdRef.current = ''
        onExpire?.()
      },
      'error-callback': () => {
        widgetIdRef.current = ''
        onError?.()
      },
      theme: 'auto',
    })
  }, [onToken, onExpire, onError])

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    if (window.turnstile) {
      render()
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => {
      if (!cancelled) render()
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = ''
      }
    }
  }, [render])

  if (!SITE_KEY) return null

  return (
    <div
      ref={containerRef}
      className="flex justify-center"
      style={{ minHeight: 65 }}
    />
  )
}
