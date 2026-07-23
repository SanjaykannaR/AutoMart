/**
 * Admin Settings Page — change admin username and password.
 * 
 * Features:
 *   - Change username (display name)
 *   - Change password (requires current password)
 *   - Shows current admin info
 *   - Separate sections for each action
 */
'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function AdminSettingsPage() {
  const { token, user, updateUser } = useAdminAuth()

  // ─── Username change state ───
  const [newName, setNewName] = useState(user?.name || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')

  // ─── Password change state ───
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  // ─── Change username ───
  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')
    setNameLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/admin/change-username`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to change username')
      }
      const data = await res.json()
      // Update local state with new username
      if (data.user) {
        updateUser({ ...user!, name: data.user.name })
      }
      setNameSuccess('Username updated successfully!')
    } catch (err: any) {
      setNameError(err.message)
    } finally {
      setNameLoading(false)
    }
  }

  // ─── Change password ───
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/admin/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to change password')
      }
      setPwSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>

      {/* ─── Current Admin Info Card ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Admin Account
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent)] font-bold text-xl">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-text)]">{user?.name || 'Admin'}</p>
            <p className="text-sm text-[var(--color-text-dim)]">{user?.email || ''}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-coral)]/15 text-[var(--color-coral)]">admin</span>
          </div>
        </div>
      </div>

      {/* ─── Change Username Section ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Change Username
        </h2>
        <p className="text-sm text-[var(--color-text-dim)] mb-4">
          Update your display name shown in the admin panel
        </p>

        {nameSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-sm text-[var(--color-success)]">{nameSuccess}</div>
        )}
        {nameError && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">{nameError}</div>
        )}

        <form onSubmit={handleNameChange} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="glass-input flex-1"
            placeholder="New display name"
            minLength={2}
            required
          />
          <button
            type="submit"
            disabled={nameLoading || newName === user?.name || newName.length < 2}
            className="glass-button px-6 py-2 text-sm disabled:opacity-50 shrink-0"
          >
            {nameLoading ? 'Saving...' : 'Update'}
          </button>
        </form>
      </div>

      {/* ─── Change Password Section ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Change Password
        </h2>
        <p className="text-sm text-[var(--color-text-dim)] mb-4">
          You must enter your current password to confirm the change
        </p>

        {pwSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-sm text-[var(--color-success)]">{pwSuccess}</div>
        )}
        {pwError && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">{pwError}</div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="glass-input pr-10"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
                {showCurrentPw ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="glass-input pr-10"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
                {showNewPw ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="glass-input"
              placeholder="Repeat new password"
              minLength={8}
              required
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-[var(--color-danger)] mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="glass-button px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
