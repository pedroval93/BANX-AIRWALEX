import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// Alternativas de Google Fonts que indica la marca: Degular → DM Sans, Supreme → Barlow Condensed.
const ui = DM_Sans({ variable: "--font-ui", subsets: ["latin"] });
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const digits = DM_Mono({ variable: "--font-digits", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Tarjetas · Banx",
  description: "Consulta tus tarjetas, sus datos y tus movimientos.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2f3b3b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ui.variable} ${display.variable} ${digits.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
