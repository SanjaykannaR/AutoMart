/**
 * Voice search handler — normalizes transcribed text from the browser's
 * Web Speech API before passing it to the text search pipeline.
 * The actual speech-to-text happens client-side (Web Speech API),
 * so this is just a text preprocessing step on the backend.
 */

/**
 * Normalizes voice transcript for search: trims whitespace and lowercases.
 * Could be extended to handle common speech recognition artifacts
 * (e.g. "brake pad" vs "break pad") in the future.
 */
export function processVoiceTranscript(transcript: string): string {
  return transcript.trim().toLowerCase()
}
