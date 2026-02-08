import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SH Apparels - Premium Ladies Beauty Products",
    template: "%s | SH Apparels",
  },
  description:
    "Shop premium ladies beauty products including bags, jewelry, cosmetics, accessories & clothing. Cash on Delivery across Pakistan.",
  keywords: [
    "ladies beauty products",
    "bags",
    "jewelry",
    "cosmetics",
    "accessories",
    "clothing",
    "Pakistan",
    "online shopping",
    "SH Apparels",
  ],
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "SH Apparels",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
