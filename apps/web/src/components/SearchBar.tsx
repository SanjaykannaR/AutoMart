/**
 * SearchBar — Unified search input with text, voice, and image search
 * 
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  🔍 [Search input]          📷 🎤       │
 *   └──────────────────────────────────────────┘
 * 
 * Features:
 *   - Text search: submits query via onSearch callback on Enter
 *   - Voice search: uses Web Speech API (browser-native)
 *   - Image search: opens file picker, uploads to CLIP search endpoint
 *   - Full-screen voice overlay with pulsing mic animation
 * 
 * Styling:
 *   - Dark input with subtle border
 *   - Lime focus ring on input
 *   - Coral/orange hover on action icons
 *   - Pill-shaped (rounded-full) container
 */
'use client'

import { useState, useEffect } from 'react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { MagnifyingGlassIcon, MicrophoneIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  /** Fired on text submit (Enter) and, by default, on voice transcript. */
  onSearch: (query: string) => void
  /**
   * When provided, voice transcripts call THIS instead of onSearch —
   * lets pages route voice search differently (e.g. navigate to /search)
   * while keeping text-submit behavior unchanged.
   */
  onVoiceSearch?: (query: string) => void
  placeholder?: string
  /**
   * Optional external query source (e.g. the URL ?q= on the search page).
   * When it changes, the input syncs to it — keeps the bar in step with the
   * URL, including server-side normalization ("breaking bad" → "brake pad").
   */
  value?: string
}

export function SearchBar({ onSearch, onVoiceSearch, placeholder = 'Search parts...', value }: SearchBarProps) {
  const [query, setQuery] = useState('')

  // Sync from external value (URL query) when it changes — e.g. after a
  // navigation or when the server returns the normalized query.
  useEffect(() => {
    if (value !== undefined) setQuery(value)
  }, [value])

  // ─── Voice search (shared hook — identical behavior to Navbar.tsx) ───
  const {
    listening,
    error: voiceError,
    transcript: voiceTranscript,
    start,
    stop,
  } = useVoiceSearch({
    onTranscript: (t) => (onVoiceSearch ?? onSearch)(t),
  })
  const showVoiceOverlay = listening || !!voiceError

  // Live-update the search input while speaking
  useEffect(() => {
    if (voiceTranscript) setQuery(voiceTranscript)
  }, [voiceTranscript])

  /** Submit search on form submit (Enter key) */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  /* Voice search (start/stop, transcript, error handling) is provided by the
   * shared useVoiceSearch hook — see the state block above. */

  /**
   * Open file picker for image-based search.
   * Sends selected image to the CLIP search endpoint.
   */
  const handleImageSearch = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const formData = new FormData()
        formData.append('image', file)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search/image`, {
          method: 'POST',
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.query) onSearch(data.query)
          })
      }
    }
    input.click()
  }

  return (
    <>
      {/* ─── Search Input ─── */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] transition-all duration-200">
          {/* Search icon */}
          <MagnifyingGlassIcon className="w-5 h-5 text-[var(--color-text-dim)] shrink-0" />

          {/* Text input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none focus-visible:outline-none focus-visible:ring-0 flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
          />

          {/* Clear button — appears when typing */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
              title="Clear search"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          )}

          {/* Image search button */}
          <button
            type="button"
            onClick={handleImageSearch}
            title="Search by image"
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <CameraIcon className="w-4.5 h-4.5 text-[var(--color-text-dim)] hover:text-[var(--color-blue)] transition-colors" />
          </button>

          {/* Voice search button */}
          <button
            type="button"
            onClick={listening ? stop : start}
            title="Voice search"
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <MicrophoneIcon
              className={`w-4.5 h-4.5 transition-colors ${
                listening
                  ? 'text-[var(--color-coral)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-blue)]'
              }`}
            />
          </button>
        </div>
      </form>

      {/* ─── Voice Search Overlay ─── */}
      {showVoiceOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card p-12 text-center max-w-md w-full mx-4">
            {/* Pulsing mic icon */}
            <div className="w-20 h-20 rounded-full border-2 border-[var(--color-coral)] mx-auto mb-6 flex items-center justify-center animate-pulse">
              <MicrophoneIcon className="w-10 h-10 text-[var(--color-coral)]" />
            </div>

            {/* Status text */}
            <p className="text-lg mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {voiceError ? 'Voice search unavailable' : listening ? 'Listening...' : voiceTranscript || 'Say something'}
            </p>
            <p
              className={`text-sm mb-6 ${
                voiceError ? 'text-[var(--color-coral)]' : 'text-[var(--color-text-dim)]'
              }`}
            >
              {voiceError || voiceTranscript}
            </p>

            {/* Cancel button */}
            <button
              onClick={stop}
              className="glass-button-outline text-sm px-6 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
