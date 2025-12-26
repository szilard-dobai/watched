import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useAllEntries } from "./use-all-entries"
import { mockEntries } from "@/test/mocks/handlers"
import { createWrapper } from "@/test/test-utils"

describe("useAllEntries", () => {
  it("fetches entries from all lists on mount", async () => {
    const { result } = renderHook(() => useAllEntries(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries).toHaveLength(mockEntries.length)
    expect(result.current.error).toBeNull()
  })

  it("includes list name with each entry", async () => {
    const { result } = renderHook(() => useAllEntries(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.entries.forEach((entry) => {
      expect(entry.listName).toBeDefined()
      expect(typeof entry.listName).toBe("string")
    })
  })

  it("includes entries from multiple lists", async () => {
    const { result } = renderHook(() => useAllEntries(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const listIds = new Set(result.current.entries.map((e) => e.listId))
    expect(listIds.size).toBeGreaterThan(1)
  })
})
