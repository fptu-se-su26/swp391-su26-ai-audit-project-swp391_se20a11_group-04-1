import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook to manage OTP countdown timers:
 * - Cooldown time for resending OTP (e.g. 60 seconds)
 * - Expiration time of the OTP itself (e.g. 300 seconds)
 * - Spam block state (if daily limits are exceeded)
 */
export default function useOtpTimer() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [otpExpiryTime, setOtpExpiryTime] = useState(0)
  const [isSpamBlocked, setIsSpamBlocked] = useState(false)

  // Countdown timer tick effect
  useEffect(() => {
    if (timeLeft <= 0 && otpExpiryTime <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      setOtpExpiryTime((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, otpExpiryTime])

  // Start the resend cooldown timer
  const startCooldown = useCallback((seconds = 60) => {
    setTimeLeft(seconds)
  }, [])

  // Start the OTP expiry countdown timer
  const startExpiry = useCallback((seconds = 300) => {
    setOtpExpiryTime(seconds)
  }, [])

  // Set spam block state (e.g. if backend returns rate limit exceeded)
  const setSpamBlocked = useCallback((blocked = true) => {
    setIsSpamBlocked(blocked)
  }, [])

  // Reset all timers to initial state
  const resetTimers = useCallback(() => {
    setTimeLeft(0)
    setOtpExpiryTime(0)
    setIsSpamBlocked(false)
  }, [])

  // Helper function to format seconds to MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    timeLeft,
    otpExpiryTime,
    isSpamBlocked,
    startCooldown,
    startExpiry,
    setSpamBlocked,
    resetTimers,
    formatTime,
  }
}
