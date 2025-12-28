"use client"

import { useState, useCallback, useSyncExternalStore } from "react"

const getServerSnapshot = () => null

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }, [key])

  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
          callback()
        }
      }
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    },
    [key]
  )

  const storedString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const [internalValue, setInternalValue] = useState<T>(() => {
    if (storedString !== null) {
      try {
        return JSON.parse(storedString) as T
      } catch {
        return initialValue
      }
    }
    return initialValue
  })

  const parsedValue = storedString !== null ? (() => {
    try {
      return JSON.parse(storedString) as T
    } catch {
      return internalValue
    }
  })() : internalValue

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setInternalValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue))
        } catch {
          console.warn(`Error setting localStorage key "${key}"`)
        }
        return newValue
      })
    },
    [key]
  )

  return [parsedValue, setValue]
}
