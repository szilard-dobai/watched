import { QueryClientProvider } from "@tanstack/react-query"
import { render as rtlRender, type RenderOptions } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { createTestQueryClient } from "./setup"

interface WrapperProps {
  children: ReactNode
}

export const createWrapper = () => {
  const queryClient = createTestQueryClient()
  const Wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

export const renderWithClient = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => rtlRender(ui, { wrapper: createWrapper(), ...options })
