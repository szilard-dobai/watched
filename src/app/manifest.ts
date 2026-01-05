import type { MetadataRoute } from "next"

const manifest = (): MetadataRoute.Manifest => {
  return {
    name: "Watched",
    short_name: "Watched",
    description: "Track movies and TV shows you're watching together",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8b5cf6",
    icons: [
      {
        src: "/manifest-icon-192.maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-512.maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-192.maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/manifest-icon-512.maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}

export default manifest
