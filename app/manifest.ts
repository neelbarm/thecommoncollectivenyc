import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Common Collective",
    short_name: "Collective",
    description: "A premium members platform for cohorts, updates, events, and concierge coordination.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#090806",
    theme_color: "#090806",
    orientation: "portrait",
    icons: [
      {
        src: "/brand/common-collective-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
