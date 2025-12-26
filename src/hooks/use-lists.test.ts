import { describe, it, expect } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useLists } from "./use-lists"
import { mockLists } from "@/test/mocks/handlers"
import type { ListWithRole } from "@/types"

describe("useLists", () => {
  it("fetches lists on mount", async () => {
    const { result } = renderHook(() => useLists())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.lists).toHaveLength(mockLists.length)
    expect(result.current.lists[0].name).toBe("Family Movies")
    expect(result.current.error).toBeNull()
  })

  it("creates a new list and returns it", async () => {
    const { result } = renderHook(() => useLists())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let newList: ListWithRole | null = null
    await act(async () => {
      newList = await result.current.createList("New Test List")
    })

    expect(newList).not.toBeNull()
    expect((newList as unknown as ListWithRole).name).toBe("New Test List")
    expect((newList as unknown as ListWithRole).role).toBe("owner")
  })
})
