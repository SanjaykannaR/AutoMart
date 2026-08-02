/**
 * useVoiceSearch — shared voice-search logic for the Web Speech API.
 *
 * Single source of truth used by BOTH SearchBar.tsx and Navbar.tsx so the
 * behavior can never diverge between components.
 *
 * Robustness features (each one fixed a real Chrome bug):
 *  - Pre-flight `getUserMedia({audio})` — forces the mic permission prompt
 *    correctly and distinguishes "mic blocked" from "Chrome voice service
 *    blocked". Chrome 125+ has a SEPARATE "Speech recognition" permission
 *    (address bar lock icon → Site settings) besides the microphone —
 *    granting only the mic still yields `not-allowed` from SpeechRecognition.
 *  - Only COMMITTED (isFinal) text is ever handed to onTranscript — a
 *    mid-sentence pause never fires a partial search.
 *  - Chrome ends recognition at every silence gap (~2s) even mid-sentence,
 *    so the hook restarts listening (fresh instance, 150ms delay) instead of
 *    closing. Gives up after MAX_RESTARTS silent cycles (dead mic / walked away).
 *  - A fresh SpeechRecognition instance per attempt: reusing one object across
 *    restarts throws InvalidStateError in Chrome.
 *  - Auto-retries once right after a fresh mic grant (Chrome sometimes needs
 *    the grant to settle before the speech service accepts).
 *  - Secure-context guard: on plain http:// (non-localhost) the API can't
 *    work at all — say so instead of blaming the mic.
 *  - All error paths release the pre-flight mic stream and surface a precise,
 *    actionable message.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_RESTARTS = 6

interface UseVoiceSearchOptions {
  /** Called with the FINAL transcript when speech naturally ends. */
  onTranscript: (transcript: string) => void
}

interface UseVoiceSearchReturn {
  /** True while recognition is active (incl. across silence-gap restarts). */
  listening: boolean
  /** Non-null when mic/service is unavailable — render it, auto-clears. */
  error: string | null
  /** Live display transcript (final + interim). Display-only, never searched. */
  transcript: string
  /** Begin listening. No-op if already listening. */
  start: () => void
  /** Stop listening (user-initiated — suppresses any auto-search). */
  stop: () => void
}

export function useVoiceSearch({ onTranscript }: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')

  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const finalRef = useRef('')
  const liveRef = useRef('')
  const stoppedByUserRef = useRef(false)
  const restartCountRef = useRef(0)
  const retriedOnceRef = useRef(false)
  // Always point at the latest callback so restarts never call a stale closure
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const showError = useCallback((msg: string, ms = 3500) => {
    setError(msg)
    setTimeout(() => setError(null), ms)
  }, [])

  /** Release the pre-flight mic stream (SpeechRecognition opens its own capture). */
  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  /**
   * Open + immediately release the mic. Returns null on success, or a precise
   * error message. Retries once (Chrome sometimes fails the first call right
   * after a grant), then probes the Permissions API to tell apart:
   *   - site-level denial  (perms: 'denied')            → lock-icon fix
   *   - not actually granted for THIS origin ('prompt') → origin mismatch
   *   - browser says granted but still blocked          → OS-level privacy
   *     settings / another app holding the mic / stale Chrome state
   */
  const ensureMic = useCallback(async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 400))
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
        stopTracks()
        return null
      } catch (e: any) {
        const name = e?.name
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          return 'No microphone found. Connect a mic and try again.'
        }
        if (name !== 'NotAllowedError' && name !== 'PermissionDeniedError' && name !== 'SecurityError') {
          return 'Could not access the microphone. Close other apps using it (Zoom, Teams, another tab) and retry.'
        }
        // permission-type error → loop once more (retry), then diagnose below
      }
    }

    // Two permission failures. Ask the Permissions API what the browser thinks.
    let perms = 'unknown'
    try {
      perms = (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state
    } catch {
      /* Permissions API unsupported — fall through */
    }
    if (perms === 'granted') {
      return "Your browser says the mic is allowed, but it's still blocked. Check Windows Settings → Privacy → Microphone (turn on access, allow Chrome), make sure you open localhost:3000 (not 127.0.0.1 or an IP — they're separate sites to Chrome), close other apps using the mic, then restart the browser."
    }
    if (perms === 'prompt') {
      return 'Mic permission has not been granted for this exact URL. Click the lock icon → Site settings → Microphone → Allow, then try again. (Note: localhost and 127.0.0.1 are different sites.)'
    }
    return 'Microphone blocked. Click the lock icon → Site settings → Microphone → Allow, then restart the browser and try again.'
  }, [stopTracks])

  /** Create a fresh recognition instance and start it. */
  const beginListening = useCallback(() => {
    if (stoppedByUserRef.current) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalRef.current += res[0].transcript
        } else {
          interim += res[0].transcript
        }
      }
      liveRef.current = finalRef.current + interim
      setTranscript(liveRef.current)
      restartCountRef.current = 0 // speech detected — reset the silence budget
    }

    recognition.onend = () => {
      // User pressed stop (or service was blocked — see onerror) → close for real
      if (stoppedByUserRef.current) {
        recognitionRef.current = null
        setListening(false)
        return
      }
      // Committed final result → hand it over. NEVER interim/partial text.
      if (finalRef.current.trim()) {
        const final = finalRef.current.trim()
        recognitionRef.current = null
        setListening(false)
        onTranscriptRef.current(final)
        return
      }
      // Silence gap with no committed result (mid-sentence pause) → keep listening
      if (restartCountRef.current < MAX_RESTARTS) {
        restartCountRef.current++
        setTimeout(beginListening, 150)
        return
      }
      // Too many silent cycles — give up quietly
      recognitionRef.current = null
      setListening(false)
    }

    recognition.onerror = (event: any) => {
      // The mic was already verified by the getUserMedia pre-flight, so these
      // mean the *speech service* is blocked — either Chrome's separate
      // "Speech recognition" permission, enterprise policy, or a region where
      // Google's speech servers are unavailable. The mic is NOT the problem.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopTracks()
        recognitionRef.current = null
        setListening(false)
        // Right after a first-time grant Chrome can still fail the first
        // attempt — retry once, then give a precise, actionable message.
        if (!retriedOnceRef.current) {
          retriedOnceRef.current = true
          stoppedByUserRef.current = false
          setTimeout(beginListening, 300)
          return
        }
        stoppedByUserRef.current = true
        showError(
          event.error === 'service-not-allowed'
            ? "Chrome's voice service is off. Click the lock icon in the address bar → Site settings → Speech recognition → Allow, then try again."
            : 'Voice search is blocked at the browser level. Click the lock icon → Site settings → Microphone + Speech recognition → Allow, then try again.',
        )
        return
      }
      if (event.error === 'network') {
        stopTracks()
        stoppedByUserRef.current = true
        recognitionRef.current = null
        setListening(false)
        showError('Voice search needs Google servers, which are unreachable from your network or region.')
        return
      }
      // 'no-speech' / 'aborted' / 'audio-capture' → onend fires next and handles restart/close
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      // start() threw (no audio input / already started) — clean up
      recognitionRef.current = null
      setListening(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showError, stopTracks])

  const start = useCallback(async () => {
    if (listening || recognitionRef.current) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showError('Voice search is not supported in this browser. Try Chrome or Edge.', 2500)
      return
    }
    if (!window.isSecureContext) {
      showError('Voice search requires https (or localhost). Open the site over https and try again.', 4000)
      return
    }

    // Pre-flight: open the mic so the permission prompt fires correctly and we
    // can tell "mic blocked" apart from "speech service blocked".
    const micError = await ensureMic()
    if (micError) {
      showError(micError, 5000)
      return
    }

    finalRef.current = ''
    liveRef.current = ''
    restartCountRef.current = 0
    retriedOnceRef.current = false
    stoppedByUserRef.current = false
    setTranscript('')
    setError(null)
    beginListening()
  }, [beginListening, ensureMic, listening, showError, stopTracks])

  const stop = useCallback(() => {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
    recognitionRef.current = null
    stopTracks()
    setListening(false)
    setError(null)
  }, [stopTracks])

  // Cleanup on unmount — never leave the mic or recognition running.
  useEffect(() => {
    return () => {
      stoppedByUserRef.current = true
      try {
        recognitionRef.current?.stop()
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null
      stopTracks()
    }
  }, [stopTracks])

  return { listening, error, transcript, start, stop }
}
