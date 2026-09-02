import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSection } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSection("seo");
  return {
    title: seo.title,
    description: seo.description,
    icons: { icon: "/logo-mark.png" },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
