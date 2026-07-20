/**
 * Voice search handler
 *
 * HOW IT WORKS:
 * 1. User clicks mic button in the browser
 * 2. Web Speech API (SpeechRecognition) captures audio from microphone
 * 3. Browser sends audio to speech recognition engine:
 *    - Chrome/Edge: sends to Google's servers (free, no key needed)
 *    - Safari: uses local Siri/Nuance engine
 * 4. Engine returns transcribed text
 * 5. Transcribed text is passed to the same fuzzy text search pipeline
 *
 * DSA: No custom algorithm needed — browser handles ASR.
 * But understanding: HMM (Hidden Markov Models), CTC (Connectionist Temporal Classification),
 * Language Models for beam search decoding — these are what Whisper/vosk use under the hood.
 *
 * For this project: Browser's Web Speech API is free, no backend needed.
 * The backend just receives the transcribed text and runs search.
 */

// No backend processing needed for voice — it's purely client-side
// The browser handles ASR, sends text to /api/search?q=<transcribed text>

export function processVoiceTranscript(transcript: string): string {
  return transcript.trim().toLowerCase()
}
