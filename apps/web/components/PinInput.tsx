"use client"

import React, { useRef, useEffect } from "react"

interface PinInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
}

export default function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = false,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index: number, digit: string) => {
    // Only allow numeric input
    if (digit && !/^\d$/.test(digit)) return

    const newValue = value.split("")
    newValue[index] = digit
    const updatedValue = newValue.join("")

    onChange(updatedValue)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (updatedValue.length === length && onComplete) {
      onComplete(updatedValue)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const newValue = value.split("")
      
      if (newValue[index]) {
        // Clear current digit
        newValue[index] = ""
        onChange(newValue.join(""))
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = ""
        onChange(newValue.join(""))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, length)
    
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData)
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
      
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData)
      }
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array(length).fill(0).map((_, index: number) => (
        <input
          key={index}
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-medium border-2 rounded-lg transition-all duration-200 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white"
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
