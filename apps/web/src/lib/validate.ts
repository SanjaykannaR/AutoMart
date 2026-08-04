export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}
