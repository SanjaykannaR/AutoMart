'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, MicrophoneIcon, CameraIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Search parts...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const recognitionRef = useRef<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setVoiceText(transcript)
      setQuery(transcript)
    }

    recognition.onend = () => {
      setListening(false)
      setShowVoiceOverlay(false)
      if (voiceText.trim()) onSearch(voiceText.trim())
    }

    recognition.onerror = () => {
      setListening(false)
      setShowVoiceOverlay(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setShowVoiceOverlay(true)
    setVoiceText('')
  }

  const stopVoiceSearch = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setShowVoiceOverlay(false)
  }

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
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
        <div className="glass-input flex items-center gap-3 px-4 py-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder-[var(--color-text-muted)]"
          />
          <button type="button" onClick={handleImageSearch} title="Search by image">
            <CameraIcon className="w-5 h-5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" />
          </button>
          <button type="button" onClick={listening ? stopVoiceSearch : startVoiceSearch} title="Voice search">
            <MicrophoneIcon className={`w-5 h-5 transition-colors ${listening ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'}`} />
          </button>
        </div>
      </form>

      {showVoiceOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass p-12 text-center max-w-md w-full mx-4">
            <div className="w-20 h-20 rounded-full border-2 border-[var(--color-accent)] mx-auto mb-6 flex items-center justify-center animate-pulse">
              <MicrophoneIcon className="w-10 h-10 text-[var(--color-accent)]" />
            </div>
            <p className="text-lg mb-2">
              {listening ? 'Listening...' : voiceText || 'Say something'}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">{voiceText}</p>
            <button onClick={stopVoiceSearch} className="glass-button-outline text-sm px-6 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
