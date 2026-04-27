import type { Metadata } from "next"
import Script from "next/script"
import { Cairo, Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { DocumentLanguageSync } from "@/components/providers/document-language-sync"
import { defaultLanguage, getLanguageDirection } from "@/lib/i18n/config"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: {
    default: "HAGZAYA",
    template: "%s | HAGZAYA",
  },
  description:
    "HAGZAYA helps players discover football pitches, join tournaments, and manage bookings with a modern sports-first experience.",
  applicationName: "HAGZAYA",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
}

const languageSyncScript = `
(function () {
  var STORAGE_KEY = 'smart-playground-language';

  function resolveLanguage(value) {
    if (!value) return 'ar';

    try {
      var parsed = JSON.parse(value);
      var language = parsed?.state?.language ?? parsed?.language ?? 'ar';
      return language === 'ar' ? 'ar' : 'en';
    } catch {
      return 'ar';
    }
  }

  function applyLanguage(language) {
    var html = document.documentElement;
    var resolvedLanguage = language === 'ar' ? 'ar' : 'en';

    html.lang = resolvedLanguage;
    html.dir = resolvedLanguage === 'ar' ? 'rtl' : 'ltr';

    if (resolvedLanguage === 'ar') {
      html.classList.add('font-ar');
      html.classList.remove('font-en');
    } else {
      html.classList.add('font-en');
      html.classList.remove('font-ar');
    }
  }

  function syncFromStorage() {
    applyLanguage(resolveLanguage(window.localStorage.getItem(STORAGE_KEY)));
  }

  syncFromStorage();

  var originalSetItem = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = function (key, value) {
    originalSetItem(key, value);

    if (key === STORAGE_KEY) {
      applyLanguage(resolveLanguage(value));
    }
  };

  var originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);
  window.localStorage.removeItem = function (key) {
    originalRemoveItem(key);

    if (key === STORAGE_KEY) {
      applyLanguage('ar');
    }
  };

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) {
      applyLanguage(resolveLanguage(event.newValue));
    }
  });
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialDir = getLanguageDirection(defaultLanguage)
  const initialFontClass = defaultLanguage === "ar" ? "font-ar" : "font-en"

  return (
    <html
      lang={defaultLanguage}
      dir={initialDir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${initialFontClass}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Script id="app-language-sync" strategy="beforeInteractive">
          {languageSyncScript}
        </Script>

        <DocumentLanguageSync />

        {children}

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}