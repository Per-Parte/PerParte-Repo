import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

// Display placeholder até a tipografia própria (B4). Exposta ao Tailwind
// como --font-clash → utilitário font-display (globals.css @theme).
const clashDisplay = localFont({
  src: "../fontes/ClashDisplay-Semibold.woff2",
  weight: "600",
  variable: "--font-clash",
});

export const metadata: Metadata = {
  title: "Per Parte — Criado por você, feito por partes.",
  description:
    "Escolha cada parte — ou invente as suas. A gente imprime em 3D, sob demanda, e entrega uma obra que é só sua.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${clashDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
