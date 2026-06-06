import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://propx.gwdglobal.in"),
  title: "PropX — Smart Property Management",
  description: "Manage your rental properties, collect rent, track maintenance, and communicate with tenants — all in one place.",
  keywords: ["property management", "rental", "tenant management", "rent collection", "Hyderabad"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PropX",
  },
  icons: {
    icon: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
  openGraph: {
    title: "PropX — Smart Property Management",
    description: "Manage your rental properties, collect rent, track maintenance, and communicate with tenants — all in one place.",
    url: "https://propx.gwdglobal.in",
    siteName: "PropX",
    images: [
      {
        url: "/redlogo.png",
        width: 1200,
        height: 630,
        alt: "PropX Logo",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
        <PWAInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('SW registered:', reg.scope); },
                    function(err) { console.log('SW registration failed:', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
