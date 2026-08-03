'use client'

/**
 * UserAvatar — renders a user avatar from either an emoji or an image URL.
 *
 * Google OAuth stores the profile picture URL (https://lh3.googleusercontent.com/…)
 * in the user's `avatar` field. This component renders URLs as an <img> and emoji
 * as text, so raw URLs never appear in the DOM as visible text.
 *
 * Usage (image fills the parent circle — parent should size itself):
 *   <div className="w-10 h-10 rounded-full overflow-hidden ...">
 *     <UserAvatar value={userAvatar} alt={userName} />
 *   </div>
 */
import { useState } from 'react'

const isImageUrl = (value: string) => /^https?:\/\//i.test(value)

interface UserAvatarProps {
  value: string
  alt?: string
  /** Extra classes — applied to the emoji text (image fills its parent circle). */
  className?: string
}

export default function UserAvatar({ value, alt = 'Profile', className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)

  if (!value) return null

  if (isImageUrl(value)) {
    if (failed) {
      // Image failed to load — fall back to the generic person icon, never a URL.
      return <span className={className}>&#x1F464;</span>
    }
    return (
      <img
        src={value}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover rounded-full ${className || ''}`}
        onError={() => setFailed(true)}
      />
    )
  }

  return <span className={className}>{value}</span>
}
