import type { Metadata } from "next"
import type { PropsWithChildren } from "react"

export const metadata: Metadata = {
  title: "List Settings",
  description: "Manage your list settings and members",
}

const ListSettingsLayout = ({ children }: PropsWithChildren) => {
  return <>{children}</>
}

export default ListSettingsLayout
