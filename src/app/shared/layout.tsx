import type { Metadata } from "next"
import type { PropsWithChildren } from "react"

export const metadata: Metadata = {
  title: "Shared With Me",
  description: "View entries from lists shared with you",
}

const SharedLayout = ({ children }: PropsWithChildren) => {
  return <>{children}</>
}

export default SharedLayout
