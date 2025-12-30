import type { Metadata } from "next"
import type { PropsWithChildren } from "react"

export const metadata: Metadata = {
  title: "My Lists",
  description: "Manage your shared watch lists",
}

const ListsLayout = ({ children }: PropsWithChildren) => {
  return <>{children}</>
}

export default ListsLayout
