'use client'

import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved ? saved === 'dark' : true
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.classList.toggle('light', !next)
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? (
        <SunIcon className="w-4 h-4 text-yellow-400" />
      ) : (
        <MoonIcon className="w-4 h-4 text-blue-400" />
      )}
    </button>
  )
}
