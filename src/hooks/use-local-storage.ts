"use client"

import { useState, useCallback, useEffect } from "react"

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValueState(JSON.parse(e.newValue) as T)
        } catch {
          // Ignore parse errors
        }
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [key])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = newValue instanceof Function ? newValue(prev) : newValue
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          console.warn(`Error setting localStorage key "${key}"`)
        }
        return resolved
      })
    },
    [key]
  )

  return [value, setValue]
}
