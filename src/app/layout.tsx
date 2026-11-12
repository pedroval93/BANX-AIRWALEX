import type { Metadata, Viewport } from "next";
import { Overpass_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const ui = Schibsted_Grotesk({ variable: "--font-ui", subsets: ["latin"] });
const digits = Overpass_Mono({ variable: "--font-digits", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mis tarjetas",
  description: "Consulta tus tarjetas, sus datos y tus movimientos.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf0f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f171e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ui.variable} ${digits.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
